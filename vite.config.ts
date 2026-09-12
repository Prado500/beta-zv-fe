// `vitest/config` reexporta el `defineConfig` de Vite y le añade la clave
// `test`; con el de 'vite' a secas, TypeScript rechazaría la configuración.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    /*
     * La API se sirve en el mismo origen que la app durante el desarrollo.
     *
     * No es comodidad: la cookie de sesión del backend es `SameSite=Lax`, así que
     * en una llamada de 5173 a 8000 el navegador NO la enviaría y todo respondería
     * 401. Con el proxy, el navegador solo ve `localhost:5173`.
     *
     * Se puede apuntar a otro backend con VITE_API_PROXY_TARGET.
     */
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
    },
  },

  /*
   * Pruebas con Vitest sobre jsdom.
   *
   * `jsdom` porque lo que se prueba es comportamiento de usuario —escribir,
   * pulsar, ver un borde rojo—, y eso necesita un DOM de verdad. `globals`
   * habilita el `afterEach` que Testing Library usa para limpiar solo entre
   * casos; sin él, cada prueba heredaría los modales de la anterior.
   */
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    css: false,
    // Cada caso declara lo que su API mockeada debe responder; lo que se limpia
    // entre pruebas es el historial de llamadas, que es lo que se afirma.
    clearMocks: true,
    // Escribir un formulario entero tecla a tecla con validación en vivo pasa de
    // los 5 s por defecto en máquinas lentas.
    testTimeout: 15000,
  },
})
