// Test 1/10 - Validaciones (Vitest)
import { describe, it, expect } from 'vitest'
import { validarCorreo } from './validaciones'

describe('utils/validaciones', () => {
    // Regla del enunciado: solo se aceptan correos @duoc.cl, @profesor.duoc.cl y @gmail.com
    it('validarCorreo rechaza dominios no permitidos', () => {
        expect(validarCorreo('ana@hotmail.com')).toBe(false)
        expect(validarCorreo('sin-dominio')).toBe(false)
    })
})
