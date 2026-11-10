import { useEffect, useState } from 'react'
import { mensajeError } from './errores'

// Carga datos desde el backend al abrir una pantalla y entrega { datos, cargando, error, recargar }.
// - "cargar" es una función que devuelve una promesa (por ejemplo, () => obtenerProductos())
// - "dependencias" son los valores que, si cambian, vuelven a cargar (por ejemplo, el id de la URL)
// - "recargar()" vuelve a pedir los datos (útil después de crear, editar o eliminar)
// Si la pantalla se cierra antes de que llegue la respuesta, el resultado se descarta.
export function useCarga(cargar, dependencias = []) {
    const [datos, setDatos] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')
    const [version, setVersion] = useState(0)

    useEffect(() => {
        let activo = true
        setCargando(true)

        cargar()
            .then((resultado) => {
                if (activo) {
                    setDatos(resultado)
                    setError('')
                }
            })
            .catch((e) => {
                if (activo) setError(mensajeError(e))
            })
            .finally(() => {
                if (activo) setCargando(false)
            })

        return () => { activo = false }
    }, [version, ...dependencias])

    return { datos, cargando, error, recargar: () => setVersion((v) => v + 1) }
}
