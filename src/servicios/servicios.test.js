// Tests de servicios - Integración HTTP con JWT y lógica de negocio de la compra (Vitest)
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { api, apiProductos } from './api'
import { guardarSesion } from './almacenSesion'
import { agregarAlCarrito, agregarAlCarritoValidado, obtenerCarrito, realizarCompra } from './tienda'
import { listarProductos, obtenerProducto, descontarStock } from './productos'

// productos-service se simula: estos tests de la tienda no necesitan el backend encendido
vi.mock('./productos', () => ({
    listarProductos: vi.fn(),
    obtenerProducto: vi.fn(),
    descontarStock: vi.fn()
}))

const martillo = { id: 1, codigo: 'MAR001', nombre: 'Martillo Carpintero', precio: 6990, stock: 25 }
const cemento = { id: 3, codigo: 'CEM003', nombre: 'Saco de Cemento 25kg', precio: 5490, stock: 40 }

describe('servicios/api (axios + JWT)', () => {
    const adaptadorUsuarios = api.defaults.adapter
    const adaptadorProductos = apiProductos.defaults.adapter

    beforeEach(() => localStorage.clear())
    afterEach(() => {
        api.defaults.adapter = adaptadorUsuarios
        apiProductos.defaults.adapter = adaptadorProductos
    })

    // Se reemplaza el "adapter" de axios para capturar la petición sin salir a la red
    it('envía el accessToken guardado en la cabecera Authorization de cada petición', async () => {
        guardarSesion({ accessToken: 'token-de-prueba', refreshToken: 'r', usuario: { nombre: 'Ana' } })

        let cabecera = null
        api.defaults.adapter = async (config) => {
            cabecera = config.headers.get('Authorization')
            return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
        }

        await api.get('/auth/me')

        expect(cabecera).toBe('Bearer token-de-prueba')
    })

    it('el cliente de productos-service también envía el token (mismo JWT para ambos microservicios)', async () => {
        guardarSesion({ accessToken: 'token-de-prueba', refreshToken: 'r', usuario: { nombre: 'Ana' } })

        let cabecera = null
        let url = null
        apiProductos.defaults.adapter = async (config) => {
            cabecera = config.headers.get('Authorization')
            url = config.baseURL + config.url
            return { data: [], status: 200, statusText: 'OK', headers: {}, config }
        }

        await apiProductos.get('/productos')

        expect(cabecera).toBe('Bearer token-de-prueba')
        expect(url).toContain('/api/v1/productos')
    })

    it('sin sesión, el catálogo se pide igual (lectura pública) y sin cabecera Authorization', async () => {
        let cabecera = 'sin-revisar'
        apiProductos.defaults.adapter = async (config) => {
            cabecera = config.headers.get('Authorization')
            return { data: [], status: 200, statusText: 'OK', headers: {}, config }
        }

        await apiProductos.get('/productos')

        expect(cabecera == null).toBe(true)
    })
})

describe('servicios/tienda - compra (con productos-service simulado)', () => {
    beforeEach(() => {
        localStorage.clear()
        listarProductos.mockResolvedValue([martillo, cemento])
        obtenerProducto.mockImplementation(async (id) => {
            const producto = [martillo, cemento].find((p) => p.id === id)
            if (!producto) throw { response: { status: 404, data: { message: 'Producto no encontrado' } } }
            return producto
        })
        descontarStock.mockResolvedValue({})
    })

    it('realizarCompra falla y no descuenta nada si no hay stock suficiente', async () => {
        agregarAlCarrito(1, 999)
        const resultado = await realizarCompra()
        expect(resultado.ok).toBe(false)
        expect(resultado.mensaje).toContain('Martillo Carpintero')
        expect(descontarStock).not.toHaveBeenCalled()
        expect(obtenerCarrito().length).toBe(1)
    })

    it('realizarCompra descuenta cada producto en el backend y vacía el carrito', async () => {
        agregarAlCarrito(1, 2)
        agregarAlCarrito(3, 1)
        const resultado = await realizarCompra()
        expect(resultado.ok).toBe(true)
        expect(descontarStock).toHaveBeenCalledWith(1, 2)
        expect(descontarStock).toHaveBeenCalledWith(3, 1)
        expect(obtenerCarrito()).toEqual([])
    })

    it('si el backend falla a mitad de la compra, lo ya descontado sale del carrito (no se descuenta dos veces)', async () => {
        agregarAlCarrito(1, 2)
        agregarAlCarrito(3, 1)
        descontarStock
            .mockResolvedValueOnce({})
            .mockRejectedValueOnce({ response: { status: 409, data: { message: 'No hay stock suficiente' } } })

        const resultado = await realizarCompra()

        expect(resultado.ok).toBe(false)
        expect(resultado.mensaje).toBe('No hay stock suficiente')
        expect(obtenerCarrito()).toEqual([{ id: 3, cantidad: 1 }])
    })

    it('agregarAlCarritoValidado no deja superar el stock que informa el backend', async () => {
        const resultado = await agregarAlCarritoValidado(1, 26)
        expect(resultado.ok).toBe(false)
        expect(obtenerCarrito()).toEqual([])

        const correcto = await agregarAlCarritoValidado(1, 25)
        expect(correcto.ok).toBe(true)
        expect(obtenerCarrito()).toEqual([{ id: 1, cantidad: 25 }])
    })

    it('agregarAlCarritoValidado avisa si el producto ya no existe (404)', async () => {
        const resultado = await agregarAlCarritoValidado(99, 1)
        expect(resultado).toEqual({ ok: false, mensaje: 'El producto ya no existe' })
    })
})
