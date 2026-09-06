import { defineConfig } from 'vite'
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
})