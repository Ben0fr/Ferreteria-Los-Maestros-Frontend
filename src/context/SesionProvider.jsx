import { useState, useEffect } from 'react'
import { SesionContext } from './sesion'
import { perfil } from '../servicios/auth'
import {
    leerSesion, guardarSesion, borrarSesion, obtenerUsuarioActual, EVENTO_SESION_EXPIRADA
} from '../servicios/almacenSesion'

// Guarda el usuario logueado y lo comparte con toda la página
export function SesionProvider({ children }) {
    // Al abrir o recargar la página, recupera la sesión guardada (si existe)
    const [usuario, setUsuario] = useState(() => obtenerUsuarioActual())

    // Si hay sesión guardada, la verifica con el backend (GET /auth/me).
    // Así se detecta un token vencido o una cuenta desactivada. Si el backend está apagado no se cierra la sesión.
    useEffect(() => {
        if (leerSesion() === null) {
            return
        }

        let activo = true
        perfil()
            .then((datos) => {
                const sesion = leerSesion()
                // Si el usuario cerró sesión mientras tanto, no se vuelve a abrir
                if (activo && sesion !== null) {
                    guardarSesion({ ...sesion, usuario: datos })
                    setUsuario(datos)
                }
            })
            .catch(() => {})

        return () => { activo = false }
    }, [])

    // Si el interceptor no pudo renovar el token, la sesión se cierra
    useEffect(() => {
        const expirar = () => setUsuario(null)
        window.addEventListener(EVENTO_SESION_EXPIRADA, expirar)
        return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, expirar)
    }, [])

    // Inicia sesión: guarda tokens y usuario, y actualiza el menú
    const iniciarSesion = ({ accessToken, refreshToken, usuario: usuarioNuevo }) => {
        guardarSesion({ accessToken, refreshToken, usuario: usuarioNuevo })
        setUsuario(usuarioNuevo)
    }

    // Cierra sesión: borra tokens y usuario, y actualiza el menú
    const cerrarSesion = () => {
        borrarSesion()
        setUsuario(null)
    }

    return (
        <SesionContext.Provider value={{ usuario, iniciarSesion, cerrarSesion }}>
            {children}
        </SesionContext.Provider>
    )
}
