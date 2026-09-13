/**
 * Lectura de cookies del navegador.
 *
 * Existe por una sola razón: el backend necesita `_fbp` y `_fbc` para mandar
 * los eventos por la API de conversiones de Meta. Son cookies que pone el
 * propio píxel, no son `HttpOnly`, y sin ellas el servidor no puede atribuir
 * la venta a la persona que la hizo.
 *
 * Va con expresión regular y no con `split(';')` porque los casos raros son
 * justo los que rompen la atribución: un nombre que es prefijo de otro
 * (`_fbc` frente a `_fbcx`), un valor que lleva `=` dentro —los `_fbc` los
 * llevan— y el espacio que el navegador mete después de cada `;`.
 */

/** Escapa lo que en una expresión regular significaría otra cosa. */
const literal = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * El valor de una cookie, o cadena vacía si no está.
 *
 * Vacío en vez de `null` a propósito: el payload que se manda al backend
 * siempre lleva los dos campos, y `_fbc` falta siempre que la visita no venga
 * de un anuncio. Eso no es un error, es lo normal.
 */
export const getCookie = (name: string): string => {
  if (typeof document === 'undefined' || !document.cookie) return '';

  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${literal(name)}=([^;]*)`));
  if (!match?.[1]) return '';

  try {
    return decodeURIComponent(match[1]);
  } catch {
    // Un `%` suelto en el valor hace estallar a `decodeURIComponent`. El dato
    // en crudo sirve igual: quien lo interpreta es Meta, no nosotros.
    return match[1];
  }
};
