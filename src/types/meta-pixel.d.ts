/**
 * Lo que el script de Meta Pixel cuelga de `window` y no declara ningún
 * paquete de tipos: no instalamos dependencias para esto.
 *
 * `fbq` es una función con propiedades. Antes de que `fbevents.js` cargue es el
 * sustituto que encola las llamadas (`queue`); cuando carga, el propio script
 * rellena `callMethod` y vacía la cola. Por eso todas las propiedades son
 * opcionales: describen dos momentos de la misma función.
 *
 * Es opcional en `Window` a propósito: sin Pixel configurado nunca se crea, y
 * quien lo use tiene que preguntar (`window.fbq?.(...)`).
 */

/** Parámetros de un evento de Meta (`value`, `currency`, `content_ids`…). */
type MetaPixelParams = Record<string, unknown>;

interface MetaPixelFbq {
  (method: 'init', pixelId: string, params?: MetaPixelParams): void;
  (method: 'track' | 'trackCustom', eventName: string, params?: MetaPixelParams): void;
  (method: string, ...args: unknown[]): void;
  /** Llamadas hechas antes de que `fbevents.js` cargara. */
  queue?: unknown[][];
  /** La instala el script real; su presencia significa "ya no hay que encolar". */
  callMethod?: (...args: unknown[]) => void;
  /** El propio `fbq`: el script lo espera para poder tratarlo como un array. */
  push?: MetaPixelFbq;
  loaded?: boolean;
  version?: string;
}

interface Window {
  fbq?: MetaPixelFbq;
  _fbq?: MetaPixelFbq;
}
