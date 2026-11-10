import { leerJSON, guardarJSON, borrarClave } from '../utils/almacenamiento'

// Aquí se guarda la sesión completa: { accessToken, refreshToken, usuario }
// Se usa localStorage para que la sesión sobreviva a recargas de página.
// (Trade-off: un localStorage puede leerse si hubiera XSS; por eso el access token dura solo 30 minutos.)
const CLAVE_SESION = 'sesionFerreteria'

// Evento que se dispara cuando la sesión ya no se pudo renovar (el Provider lo escucha y cierra la sesión)
export const EVENTO_SESION_EXPIRADA = 'sesion-expirada'

export function leerSesion() {
    return leerJSON(CLAVE_SESION, null)
}

export function guardarSesion(sesion) {
    guardarJSON(CLAVE_SESION, sesion)
}

export function borrarSesion() {
    borrarClave(CLAVE_SESION)
}

// Devuelve solo el usuario de la sesión guardada (null si no hay sesión)
export function obtenerUsuarioActual() {
    const sesion = leerSesion()
    return sesion === null ? null : sesion.usuario
}
