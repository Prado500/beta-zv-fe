/**
 * Salidas del SPA hacia otro origen.
 *
 * Asignar `window.location.href` es la única forma de mandar al usuario a la
 * pasarela, pero es también un efecto irreversible incrustado en medio de la
 * lógica: en cuanto aparece dentro de un hook, ese hook deja de poder probarse.
 * Aislarlo aquí lo convierte en una costura — un punto que el test sustituye y
 * el navegador ejecuta — sin que el resto del código cambie una línea.
 */

/** Abandona la SPA hacia una URL externa (checkout de Mercado Pago). */
export const redirectTo = (url: string): void => {
  window.location.href = url;
};
