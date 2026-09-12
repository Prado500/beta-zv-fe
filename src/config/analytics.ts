/**
 * Medición del lado cliente.
 *
 * El identificador del Pixel no es un secreto —viaja en cada petición a Meta y
 * cualquiera lo lee en el HTML—, pero vive aquí y no escrito a mano dentro del
 * código de carga por dos razones: se puede apagar en un entorno concreto
 * (`VITE_META_PIXEL_ID=` vacío en una preview o en local) y se puede apuntar a
 * otro Pixel sin tocar una línea de TypeScript.
 *
 * Sigue la convención del proyecto: constante de configuración derivada de
 * `import.meta.env.VITE_*` con un valor por defecto, igual que `config/site.ts`.
 * El valor por defecto es el Pixel de producción, así que el despliegue de Azure
 * funciona sin añadir nada al Variable Group (hoy solo inyecta
 * `VITE_API_BASE_URL`; ver `.azure-pipelines/cd-frontend.yaml`).
 */
export const META_PIXEL_ID: string = (
  import.meta.env.VITE_META_PIXEL_ID ?? '4659139844407745'
).trim();
