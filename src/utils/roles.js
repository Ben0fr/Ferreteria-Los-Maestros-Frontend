// Roles que entrega el backend (campo "rol" del usuario)
export const ROL_ADMIN = 'ADMINISTRADOR'
export const ROL_VENDEDOR = 'VENDEDOR'
export const ROL_CLIENTE = 'CLIENTE'

// A dónde se envía a cada usuario después de iniciar sesión
export function rutaInicial(rol) {
    if (rol === ROL_ADMIN) {
        return '/admin'
    }
    if (rol === ROL_VENDEDOR) {
        return '/vendedor'
    }
    return '/'
}
