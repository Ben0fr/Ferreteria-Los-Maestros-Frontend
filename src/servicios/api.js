import axios from 'axios'
import { leerSesion, guardarSesion, borrarSesion, EVENTO_SESION_EXPIRADA } from './almacenSesion'

export const URL_USUARIOS = import.meta.env.VITE_API_USUARIOS_URL ?? 'http://localhost:8081/api/v1'
export const URL_PRODUCTOS = import.meta.env.VITE_API_PRODUCTOS_URL ?? 'http://localhost:8082/api/v1'

// Rutas que no necesitan token (ni se reintentan con refresh)
const RUTAS_PUBLICAS = ['/auth/login', '/auth/registro', '/auth/refresh']
const esPublica = (url) => RUTAS_PUBLICAS.some((ruta) => url?.startsWith(ruta))

function cerrarPorExpiracion() {
    borrarSesion()
    window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA))
}

// Si varias peticiones fallan a la vez con 401, se renueva el token una sola vez
// (la variable es común a todos los clientes: el refresh siempre se pide a usuarios-service)
let renovacionEnCurso = null

// Crea un cliente axios para un microservicio. Todos comparten la misma sesión y el mismo manejo de JWT:
// 1) Antes de cada petición: agrega "Authorization: Bearer <accessToken>"
// 2) Después de cada respuesta: si el access token venció (401), pide uno nuevo con el refresh token
//    y repite la petición original. Si no se puede renovar, cierra la sesión.
function crearCliente(baseURL) {
    const cliente = axios.create({
        baseURL,
        headers: { 'Content-Type': 'application/json' }
    })

    cliente.interceptors.request.use((config) => {
        const sesion = leerSesion()
        if (sesion?.accessToken && !esPublica(config.url)) {
            config.headers.Authorization = 'Bearer ' + sesion.accessToken
        }
        return config
    })

    cliente.interceptors.response.use(
        (respuesta) => respuesta,
        async (error) => {
            const original = error.config
            const status = error.response?.status

            if (status !== 401 || !original || original._reintentada || esPublica(original.url)) {
                return Promise.reject(error)
            }

            const sesion = leerSesion()
            if (!sesion?.refreshToken) {
                cerrarPorExpiracion()
                return Promise.reject(error)
            }

            original._reintentada = true

            try {
                if (renovacionEnCurso === null) {
                    // Se usa axios "a secas" (no un cliente) para no volver a pasar por estos interceptores
                    renovacionEnCurso = axios
                        .post(URL_USUARIOS + '/auth/refresh', { refreshToken: sesion.refreshToken })
                        .then((respuesta) => respuesta.data)
                        .finally(() => { renovacionEnCurso = null })
                }

                const nueva = await renovacionEnCurso
                guardarSesion({
                    accessToken: nueva.accessToken,
                    refreshToken: nueva.refreshToken,
                    usuario: nueva.usuario
                })

                original.headers.Authorization = 'Bearer ' + nueva.accessToken
                return cliente(original)
            } catch {
                cerrarPorExpiracion()
                return Promise.reject(error)
            }
        }
    )

    return cliente
}

// Cliente para usuarios-service (puerto 8081)
export const api = crearCliente(URL_USUARIOS)

// Cliente para productos-service (puerto 8082)
export const apiProductos = crearCliente(URL_PRODUCTOS)
