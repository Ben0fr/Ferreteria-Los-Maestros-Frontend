// Lógica de la tienda: catálogo y carrito (equivale al app.js de la fase 1).
// Los usuarios y la sesión los maneja el backend (ver servicios/auth.js) y los productos también
// (ver servicios/productos.js). Solo el carrito sigue guardándose en el navegador.
import { leerJSON, guardarJSON, borrarClave } from "../utils/almacenamiento"
import { mensajeError } from "../utils/errores"
import { listarProductos, obtenerProducto, descontarStock } from "./productos"

// Nombre con el que se guarda el carrito en localStorage (igual a la fase 1)
const CLAVE_CARRITO = "carritoFerreteria"

// Quienes escuchan cambios en el carrito (por ejemplo, el contador del menú)
const listenersCarrito = new Set()

function notificarCarrito() {
    for (const escuchar of listenersCarrito) {
        escuchar()
    }
}

// Permite que un componente se avise cuando el carrito cambia; devuelve una función para dejar de escuchar
export function suscribirCarrito(escuchar) {
    listenersCarrito.add(escuchar)
    return () => listenersCarrito.delete(escuchar)
}

// ---------------- CATÁLOGO (productos-service) ----------------

// Trae el catálogo completo desde el backend
export async function obtenerProductos() {
    return listarProductos()
}

// Busca un producto por su id (devuelve undefined si no existe)
export async function buscarProductoPorId(id) {
    try {
        return await obtenerProducto(id)
    } catch (error) {
        if (error.response?.status === 404) {
            return undefined
        }
        throw error
    }
}

// ---------------- CARRITO ----------------

// Devuelve el carrito guardado: lista de { id, cantidad }
export function obtenerCarrito() {
    return leerJSON(CLAVE_CARRITO, [])
}

// Suma la cantidad de todos los productos del carrito (para el contador del menú)
export function obtenerCantidadCarrito() {
    return obtenerCarrito().reduce((total, item) => total + item.cantidad, 0)
}

// Agrega un producto al carrito (si ya estaba, suma la cantidad indicada)
export function agregarAlCarrito(id, cantidad = 1) {
    const carrito = obtenerCarrito()
    const item = carrito.find((i) => i.id === id)

    if (item) {
        item.cantidad = item.cantidad + cantidad
    } else {
        carrito.push({ id: id, cantidad: cantidad })
    }

    guardarJSON(CLAVE_CARRITO, carrito)
    notificarCarrito()
}

// Cantidad de un producto que ya hay en el carrito (0 si no está)
export function cantidadEnCarrito(id) {
    const item = obtenerCarrito().find((i) => i.id === id)
    return item ? item.cantidad : 0
}

// Igual que agregarAlCarrito, pero valida el stock actual (consultado al backend):
// no deja que lo del carrito + lo nuevo supere el stock. Devuelve { ok, mensaje }
export async function agregarAlCarritoValidado(id, cantidad = 1) {
    let producto

    try {
        producto = await buscarProductoPorId(id)
    } catch (error) {
        return { ok: false, mensaje: mensajeError(error) }
    }

    if (producto === undefined) {
        return { ok: false, mensaje: "El producto ya no existe" }
    }

    if (!Number.isInteger(cantidad) || cantidad < 1) {
        return { ok: false, mensaje: "La cantidad debe ser al menos 1" }
    }

    const enCarrito = cantidadEnCarrito(id)

    if (enCarrito + cantidad > producto.stock) {
        const disponibles = Math.max(producto.stock - enCarrito, 0)
        return {
            ok: false,
            mensaje: `No puedes superar el stock de ${producto.nombre} (${producto.stock} unidades). ` +
                `Ya tienes ${enCarrito} en el carrito y puedes agregar ${disponibles} más.`
        }
    }

    agregarAlCarrito(id, cantidad)
    return { ok: true, mensaje: "Producto agregado al carrito" }
}

// Cambia la cantidad de un producto del carrito. Si es 0 (o menos) lo elimina.
// Si se indica el stock disponible, la cantidad nunca lo supera (la pantalla ya tiene el producto cargado).
// Devuelve { carrito, mensaje } (mensaje vacío si no hubo ajuste)
export function actualizarCantidadCarrito(id, cantidad, stock) {
    if (cantidad <= 0) {
        return { carrito: eliminarDelCarrito(id), mensaje: "" }
    }

    let mensaje = ""

    if (stock !== undefined && cantidad > stock) {
        cantidad = stock
        mensaje = `Solo hay ${stock} unidades disponibles`
    }

    const carrito = obtenerCarrito().map((i) => (i.id === id ? { ...i, cantidad } : i))
    guardarJSON(CLAVE_CARRITO, carrito)
    notificarCarrito()
    return { carrito, mensaje }
}

// Quita del carrito el producto con ese id y devuelve el carrito nuevo
export function eliminarDelCarrito(id) {
    const carritoNuevo = obtenerCarrito().filter((i) => i.id !== id)
    guardarJSON(CLAVE_CARRITO, carritoNuevo)
    notificarCarrito()
    return carritoNuevo
}

// Deja el carrito completamente vacío
export function vaciarCarrito() {
    borrarClave(CLAVE_CARRITO)
    notificarCarrito()
}

// Confirma la compra de lo que hay en el carrito: revisa el stock en el backend, lo descuenta y vacía el carrito
export async function realizarCompra() {
    const carrito = obtenerCarrito()

    if (carrito.length === 0) {
        return { ok: false, mensaje: "El carrito está vacío" }
    }

    try {
        // Primero se revisa que haya stock suficiente para todo, antes de descontar nada
        const catalogo = await listarProductos()

        for (const item of carrito) {
            const producto = catalogo.find((p) => p.id === item.id)

            if (producto === undefined || producto.stock < item.cantidad) {
                const nombre = producto ? producto.nombre : "un producto"
                return { ok: false, mensaje: `No hay stock suficiente de ${nombre}` }
            }
        }

        // Se descuenta producto por producto (PATCH /productos/{id}/stock/descontar, requiere sesión).
        // Cada producto ya descontado sale del carrito: si algo falla a mitad de camino,
        // al reintentar no se vuelve a descontar lo que ya se había descontado.
        for (const item of carrito) {
            await descontarStock(item.id, item.cantidad)
            eliminarDelCarrito(item.id)
        }
    } catch (error) {
        return { ok: false, mensaje: mensajeError(error) }
    }

    vaciarCarrito()

    return { ok: true, mensaje: "¡Compra realizada con éxito! Gracias por tu compra." }
}
