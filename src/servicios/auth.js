import { api } from './api'

// Inicia sesión. Devuelve { accessToken, refreshToken, tipoToken, expiraEnSegundos, usuario }
export async function login(correo, clave) {
    const { data } = await api.post('/auth/login', { correo, clave })
    return data
}

// Registro público: siempre crea un cliente
export async function registrar(nombre, correo, clave) {
    const { data } = await api.post('/auth/registro', { nombre, correo, clave })
    return data
}

// Datos del usuario de la sesión actual (sirve para verificar el token al recargar la página)
export async function perfil() {
    const { data } = await api.get('/auth/me')
    return data
}
