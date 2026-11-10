import { apiProductos } from './api'

// Llamadas REST a productos-service (/api/v1). La lectura es pública; crear, editar y eliminar
// exigen rol ADMINISTRADOR y descontar stock exige sesión (el token se agrega solo en api.js).
//
// Cada producto que devuelve el backend tiene la forma:
// { id, codigo, nombre, descripcion, categoria, categoriaSlug, categoriaId, precio, stock, stockCritico, stockEnNivelCritico, icono }

// ---------------- PRODUCTOS ----------------

export async function listarProductos() {
    const { data } = await apiProductos.get('/productos')
    return data
}

export async function obtenerProducto(id) {
    const { data } = await apiProductos.get('/productos/' + id)
    return data
}

// Productos con stock igual o menor al stock crítico (solo ADMINISTRADOR y VENDEDOR)
export async function listarStockCritico() {
    const { data } = await apiProductos.get('/productos/stock-critico')
    return data
}

// Recibe los datos del formulario y los convierte al formato que espera el backend (ProductoRequest)
function aCuerpoProducto(datos) {
    return {
        codigo: datos.codigo,
        nombre: datos.nombre,
        descripcion: datos.descripcion || null,
        precio: datos.precio,
        stock: datos.stock,
        stockCritico: datos.stockCritico ?? null,
        categoriaId: datos.categoriaId
    }
}

export async function crearProducto(datos) {
    const { data } = await apiProductos.post('/productos', aCuerpoProducto(datos))
    return data
}

export async function actualizarProducto(id, datos) {
    const { data } = await apiProductos.put('/productos/' + id, aCuerpoProducto(datos))
    return data
}

export async function eliminarProducto(id) {
    await apiProductos.delete('/productos/' + id)
}

// Resta stock al confirmar una compra (responde 409 si no alcanza)
export async function descontarStock(id, cantidad) {
    const { data } = await apiProductos.patch('/productos/' + id + '/stock/descontar', { cantidad })
    return data
}

// ---------------- CATEGORÍAS ----------------

export async function listarCategorias() {
    const { data } = await apiProductos.get('/categorias')
    return data
}
