import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',            // DOM simulado para renderizar componentes
    setupFiles: './src/setupTests.js', // se carga antes de cada archivo de pruebas
    globals: true,                   // describe, it, expect, vi... disponibles sin importar
    restoreMocks: true,              // los spies (vi.spyOn) se restauran solos después de cada test
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/**/*.test.{js,jsx}', 'src/main.jsx', 'src/setupTests.js'],
      reporter: ['text', 'html'],
    },
  },
})
