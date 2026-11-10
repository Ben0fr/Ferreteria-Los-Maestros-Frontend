// Agrega los matchers del DOM (toBeInTheDocument, toHaveValue, etc.)
import '@testing-library/jest-dom'

// Node 25+ trae un localStorage experimental que, sin el flag --localstorage-file, queda undefined
// y tapa al localStorage de jsdom. Si pasa eso, se usa uno simple en memoria (en Node LTS no hace nada).
class MemoriaStorage {
    #datos = new Map()
    get length() { return this.#datos.size }
    key(indice) { return [...this.#datos.keys()][indice] ?? null }
    getItem(clave) { return this.#datos.has(String(clave)) ? this.#datos.get(String(clave)) : null }
    setItem(clave, valor) { this.#datos.set(String(clave), String(valor)) }
    removeItem(clave) { this.#datos.delete(String(clave)) }
    clear() { this.#datos.clear() }
}

let localStorageRoto = false
try {
    localStorageRoto = typeof globalThis.localStorage?.clear !== 'function'
} catch {
    localStorageRoto = true
}

if (localStorageRoto) {
    Object.defineProperty(globalThis, 'localStorage', {
        value: new MemoriaStorage(),
        configurable: true,
        writable: true
    })
}
