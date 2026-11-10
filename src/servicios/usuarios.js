import { api } from './api'

// CRUD de usuarios (el backend solo lo permite al ADMINISTRADOR)
export async function listarUsuarios() {
    const { data } = await api.get('/usuarios')
    return data
}

// Recibe los datos del formulario y los convierte al formato que espera el backend
export async function crearUsuario(datos) {
    const cuerpo = {
        run: datos.run,
        nombre: datos.nombre,
        apellidos: datos.apellidos,
        correo: datos.correo,
        clave: datos.clave,
        rol: datos.tipo.toUpperCase(),            // "Vendedor" -> "VENDEDOR"
        fechaNacimiento: datos.fecha || null,
        region: datos.region || null,
        comuna: datos.comuna || null,
        direccion: datos.direccion || null
    }
    const { data } = await api.post('/usuarios', cuerpo)
    return data
}

export async function eliminarUsuario(id) {
    await api.delete('/usuarios/' + id)
}
