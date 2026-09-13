import { hasConsent } from './consent';
import { getCookie } from './cookies';

/**
 * Píxel de Meta: carga y eventos de conversión.
 *
 * El script oficial se inyecta a mano en vez de traer `react-facebook-pixel`:
 * son quince líneas, la librería lleva años sin mantenerse y metería su propia
 * copia del mismo fragmento.
 *
 * **Sin consentimiento no existe.** La puerta está aquí dentro, en `usable()`,
 * y no en quien llama: mientras no haya un "sí" expreso en el banner de
 * cookies no se descarga el script, no se pone ninguna cookie y no sale ningún
 * evento. Puesta en cada pantalla que quiere medir algo, bastaría con que una
 * se olvidara; puesta aquí, olvidarse no es posible.
 *
 * **Nada de esto puede tumbar una compra.** Todo lo que habla con `fbq` pasa
 * por `trackPixelEvent`, que traga cualquier fallo y sigue. Un bloqueador de
 * anuncios, una extensión o un `fbq` a medio cargar son el caso normal, no la
 * excepción, y ninguno de los tres tiene por qué dejar a alguien sin pagar.
 *
 * **Deduplicación.** Cada evento de compra lleva `eventID` con la
 * `externalReference` de la compra, que es la misma que manda el servidor por
 * la API de conversiones. Meta cruza las dos por ese identificador y cuenta
 * una sola venta. Si el identificador no coincide, la venta se cuenta dos
 * veces y el coste por conversión que se ve en el panel es mentira.
 */

/** Firma de la cola que deja el fragmento oficial de Meta. */
type FbqCall = (...args: unknown[]) => void;

interface Fbq extends FbqCall {
  callMethod?: FbqCall;
  queue: unknown[][];
  push: Fbq;
  loaded: boolean;
  version: string;
}

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const SCRIPT_ID = 'meta-pixel';
const SRC = 'https://connect.facebook.net/en_US/fbevents.js';

/**
 * Identificador del píxel. Sin él el módulo entero calla: en local no hay
 * ninguno definido y no se carga nada, que es lo que se busca.
 */
export const PIXEL_ID: string = import.meta.env.VITE_META_PIXEL_ID ?? '';

/** El producto, con el mismo nombre e identificador en los tres eventos. */
const PRODUCT = {
  content_name: 'Eternal Connection',
  content_ids: ['eternal-connection'],
  content_type: 'product',
} as const;

let initialised = false;

/**
 * Tres condiciones, y la tercera es la que manda: navegador, identificador
 * configurado y consentimiento dado. Se consulta en cada llamada, no una vez al
 * cargar: la decisión llega a mitad de visita, cuando la persona pulsa el botón.
 */
const usable = (): boolean =>
  typeof window !== 'undefined' && PIXEL_ID.length > 0 && hasConsent();

/** Deja lista la cola `fbq` antes de que el script llegue. */
const ensureQueue = (): void => {
  if (window.fbq) return;

  const fbq = function (this: unknown, ...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod.apply(this, args);
    else fbq.queue.push(args);
  } as Fbq;

  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];

  window.fbq = fbq;
  window._fbq = fbq;
};

/**
 * Carga el píxel. Idempotente: llamarla dos veces no duplica nada.
 *
 * Sin consentimiento no hace nada en absoluto —ni siquiera prepara la cola—,
 * así que el script de Meta no llega a pedirse. Es la diferencia entre no
 * medir y medir sin permiso.
 */
export const initPixel = (): void => {
  if (initialised || !usable()) return;
  initialised = true;

  ensureQueue();

  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = SRC;
    document.head.appendChild(script);
  }

  window.fbq?.('init', PIXEL_ID);
};

/**
 * El envoltorio blindado. **Todo** evento sale por aquí.
 *
 * Si no hay identificador configurado se calla del todo: eso es una ausencia
 * deliberada (desarrollo, previsualizaciones), no una avería. Con identificador
 * y sin `fbq` sí avisa, porque ahí sí hay algo roto que mirar.
 */
export const trackPixelEvent = (
  event: string,
  payload?: Record<string, unknown>,
  options?: { eventID: string },
): boolean => {
  try {
    if (!usable()) return false;

    if (typeof window.fbq !== 'function') {
      console.warn(`[pixel] ${event} no se envió: fbq no está disponible.`);
      return false;
    }

    window.fbq('track', event, payload, options);
    return true;
  } catch (problem) {
    // Nunca se relanza: este módulo no está en el camino crítico de nadie.
    console.warn(`[pixel] ${event} falló y se ignora.`, problem);
    return false;
  }
};

/** Una visita. En una sola página hay que llamarla en cada cambio de ruta. */
export const trackPageView = (): void => {
  trackPixelEvent('PageView');
};

/** Lo que el evento de compra necesita saber, tal como responde el backend. */
export interface TrackedPurchase {
  /** El importe llega en centavos; a Meta va en pesos. */
  amountCents: number;
  currency: string;
  /** La misma que usa el servidor como `event_id`. Sin ella no hay dedup. */
  externalReference: string;
}

/**
 * Centavos a pesos, como NÚMERO.
 *
 * Meta descarta el evento —o peor, lo acepta con valor 0— si `value` llega
 * como cadena. Aquí no puede llegar como cadena porque no se toca a mano.
 */
const pesos = (amountCents: number): number =>
  Number.isFinite(amountCents) ? Math.round(amountCents) / 100 : 0;

/**
 * La moneda tal como la cobra el backend, normalizada a mayúsculas.
 *
 * Es COP en toda la tienda; se lee de la compra en vez de fijarla porque
 * mandar "COP" sobre un cobro en otra moneda sería declarar un valor falso.
 */
const moneda = (currency: string): string => (currency || 'COP').toUpperCase();

const purchasePayload = (purchase: TrackedPurchase) => ({
  ...PRODUCT,
  value: pesos(purchase.amountCents),
  currency: moneda(purchase.currency),
  num_items: 1,
});

/** Una sola vez por carga: la sección se puede ver, salir y volver a ver. */
let viewContentSent = false;

/**
 * Interés en el producto. No va al cargar la página: se dispara cuando la
 * persona llega de verdad al previsualizador, que es el momento en que ve lo
 * que se vende.
 */
export const trackViewContent = (): void => {
  if (viewContentSent) return;
  /*
   * Se apunta solo si de verdad salió. Quien baja hasta el previsualizador
   * ANTES de aceptar las cookies no manda nada, y darlo por enviado dejaría ese
   * evento perdido para siempre: al aceptar, esto se vuelve a intentar.
   */
  viewContentSent = trackPixelEvent('ViewContent', { ...PRODUCT });
};

/** Salida hacia Mercado Pago, con la compra ya creada en el backend. */
export const trackInitiateCheckout = (purchase: TrackedPurchase): void => {
  trackPixelEvent('InitiateCheckout', purchasePayload(purchase), {
    eventID: purchase.externalReference,
  });
};

/**
 * Compras ya avisadas en esta pestaña.
 *
 * Meta deduplica por `eventID` durante 48 h, así que un reenvío no ensucia el
 * panel; esto evita además el ruido de un doble montaje o de una recarga.
 */
const purchasesSent = new Set<string>();

/**
 * Venta confirmada. Se llama **solo** cuando el servidor dice que la compra
 * está pagada, nunca por lo que traiga la URL de vuelta.
 */
export const trackPurchase = (purchase: TrackedPurchase): void => {
  if (purchasesSent.has(purchase.externalReference)) return;

  const sent = trackPixelEvent('Purchase', purchasePayload(purchase), {
    eventID: purchase.externalReference,
  });
  // Igual que arriba: lo que no llegó a salir no se da por contado.
  if (sent) purchasesSent.add(purchase.externalReference);
};

/**
 * Las cookies del píxel que el backend necesita para la API de conversiones.
 *
 * `_fbp` lo pone el píxel en cuanto carga. `_fbc` solo existe si la visita
 * llegó desde un anuncio (con `fbclid` en la URL): que falte es lo normal, y
 * entonces se manda vacío.
 */
export const pixelCookies = (): { fbp: string; fbc: string } => ({
  fbp: getCookie('_fbp'),
  fbc: getCookie('_fbc'),
});

/** Solo para las pruebas y para que la interfaz pueda consultarlo. */
export const isPixelActive = (): boolean => initialised;
