import { ApiError, NetworkError } from './api';

/**
 * Traduce un fallo de la API a una frase que el usuario pueda usar.
 *
 * El backend ya manda mensajes en castellano, así que por defecto se respeta el
 * suyo: es el único que sabe por qué falló. Aquí solo se cubren los estados en
 * los que el mensaje técnico no le dice a la persona qué hacer a continuación
 * (401, 409, 503) y se deja una puerta — `overrides` — para que cada pantalla
 * añada el matiz que conoce, sin duplicar el resto del mapa.
 */

const BY_STATUS: Record<number, string> = {
  401: 'Tu sesión expiró. Vuelve a la página principal e inicia sesión de nuevo.',
  403: 'No tienes permiso para hacer esto. Vuelve a iniciar sesión.',
  404: 'No encontramos lo que buscabas. Vuelve a empezar desde la página principal.',
  429: 'Demasiados intentos seguidos. Espera unos segundos y vuelve a probar.',
  503: 'El servicio no está disponible ahora mismo. Inténtalo de nuevo en un momento.',
};

const FALLBACK = 'No pudimos completar la operación. Intenta de nuevo.';

/**
 * `overrides` acepta tanto códigos del backend (`EMAIL_IN_USE`) como estados
 * HTTP en texto (`'409'`); el código gana, porque es más específico.
 */
export const describeError = (error: unknown, overrides: Record<string, string> = {}): string => {
  if (error instanceof ApiError) {
    return (
      overrides[error.code] ??
      overrides[String(error.status)] ??
      BY_STATUS[error.status] ??
      error.message ??
      FALLBACK
    );
  }
  if (error instanceof NetworkError) return error.message;
  return FALLBACK;
};
