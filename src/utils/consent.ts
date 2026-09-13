/**
 * Consentimiento de cookies.
 *
 * Es la llave del píxel de Meta: mientras no haya un "sí" expreso, no se
 * descarga el script, no se pone ninguna cookie y no sale ningún evento. La
 * puerta no vive aquí sino en `utils/pixel`, que pregunta antes de cada cosa
 * que hace; así no depende de que cada pantalla se acuerde de preguntar.
 *
 * Tres estados, no dos: `granted`, `denied` y **todavía no preguntado**
 * (`null`). El tercero es el que decide si el aviso se enseña, y confundirlo
 * con "denegado" haría que el banner no volviera a aparecer nunca.
 *
 * La decisión se avisa a quien esté escuchando (`onConsentChange`) porque
 * aceptar tiene que encender el píxel **en el momento**, sin recargar: si
 * hubiera que esperar a la siguiente página, la visita en la que se acepta se
 * perdería entera.
 */

export type Consent = 'granted' | 'denied';

const KEY = 'cookieConsent';

const isConsent = (value: string | null): value is Consent =>
  value === 'granted' || value === 'denied';

/**
 * Lo decidido en esta sesión, para cuando el almacenamiento está bloqueado.
 *
 * En una ventana privada, o con las cookies de sitio capadas, `localStorage`
 * lanza al tocarlo. Sin esto el banner reaparecería en cada render y la
 * decisión no valdría de nada mientras dure la visita.
 */
let sessionDecision: Consent | null = null;

type Listener = (consent: Consent) => void;

const listeners = new Set<Listener>();

/** Lo que se decidió antes, o `null` si aún no se ha preguntado. */
export const readConsent = (): Consent | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(KEY);
    return isConsent(stored) ? stored : null;
  } catch {
    return sessionDecision;
  }
};

/** Guarda la decisión y la anuncia. Si el almacenamiento falla, sigue valiendo. */
export const writeConsent = (value: Consent): void => {
  if (typeof window === 'undefined') return;

  sessionDecision = value;
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    /* Sin almacenamiento se vuelve a preguntar en la próxima visita */
  }

  // Copia de la lista: un oyente puede darse de baja dentro de su propio aviso.
  for (const listener of [...listeners]) listener(value);
};

/** Se suscribe a la decisión. Devuelve la baja, para el `useEffect`. */
export const onConsentChange = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const hasConsent = (): boolean => readConsent() === 'granted';
