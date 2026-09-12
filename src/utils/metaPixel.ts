/**
 * Meta Pixel: carga y envío de eventos.
 *
 * Es el fragmento oficial de Meta escrito en TypeScript, no pegado en el HTML.
 * En una SPA el `index.html` se sirve una sola vez, así que un `PageView` en el
 * documento contaría la primera pantalla y ninguna más; y el identificador
 * quedaría duplicado fuera del sistema de configuración. Aquí la carga es una
 * función que se puede llamar (o no llamar) y probar.
 *
 * **Una sola inicialización.** El guardia es `window.fbq`, igual que en el
 * fragmento de Meta, y no una bandera de módulo: sobrevive al doble montaje de
 * `StrictMode`, a la recarga en caliente de Vite y a que dos sitios distintos
 * llamen a `initMetaPixel`.
 *
 * **`PageView` no se dispara aquí.** `initMetaPixel` solo hace `init`; quien
 * cuenta las páginas es `<MetaPixel />`, que además cuenta las navegaciones
 * internas. Si esta función también rastreara, la primera visita valdría dos.
 */

import { META_PIXEL_ID } from '../config/analytics';

const SCRIPT_SRC = 'https://connect.facebook.net/en_US/fbevents.js';
const SCRIPT_ID = 'meta-pixel-sdk';

/**
 * El sustituto de `fbq` mientras `fbevents.js` viaja por la red.
 *
 * Acepta llamadas desde el primer milisegundo y las guarda en `queue`; cuando
 * el script real carga, instala `callMethod` y vacía esa cola. Sin él, un
 * evento disparado durante la carga se perdería.
 */
const installQueue = (win: Window): MetaPixelFbq => {
  const fbq = ((...args: unknown[]): void => {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue?.push(args);
  }) as MetaPixelFbq;

  fbq.queue = [];
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';

  win.fbq = fbq;
  win._fbq ??= fbq;
  return fbq;
};

/** Inyecta `fbevents.js` una sola vez; el `id` evita duplicarlo. */
const loadScript = (doc: Document): void => {
  if (doc.getElementById(SCRIPT_ID)) return;
  const script = doc.createElement('script');
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = SCRIPT_SRC;
  doc.head.appendChild(script);
};

/**
 * Arranca el Pixel. Devuelve `false` si no hay nada que arrancar —sin
 * identificador configurado la medición queda apagada, que es el
 * comportamiento que se espera en una preview o en local.
 */
export const initMetaPixel = (pixelId: string = META_PIXEL_ID): boolean => {
  if (!pixelId) return false;
  if (window.fbq) return true;

  const fbq = installQueue(window);
  loadScript(document);
  fbq('init', pixelId);
  return true;
};

/** Cuenta una vista de página. No hace nada si el Pixel no está arrancado. */
export const trackPageView = (): void => {
  window.fbq?.('track', 'PageView');
};

/**
 * Envía un evento estándar de Meta (`Purchase`, `Lead`, `InitiateCheckout`…).
 *
 * Existe para que el día que se mida una conversión no haya que volver a tocar
 * la carga del Pixel. Hoy no lo llama nadie: el único evento acordado es
 * `PageView`.
 */
export const trackMetaEvent = (eventName: string, params?: MetaPixelParams): void => {
  window.fbq?.('track', eventName, params);
};
