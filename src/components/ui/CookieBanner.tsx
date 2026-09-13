import React from 'react';
import { useConsent } from '../../hooks/useConsent';
import { writeConsent, type Consent } from '../../utils/consent';

/**
 * Aviso de cookies. La puerta del píxel de Meta.
 *
 * Solo aparece mientras no se haya decidido nada: con un "sí" o un "no" ya
 * guardados no se vuelve a preguntar. No hace falta avisar a nadie de la
 * decisión —`writeConsent` la anuncia y `useConsent` la reparte—, así que quien
 * la usa no tiene que pasarle ningún manejador ni acordarse de encender nada.
 *
 * **Los dos botones pesan lo mismo.** Mismo tamaño, misma altura, mismo sitio:
 * rechazar tiene que costar exactamente lo mismo que aceptar. Un "rechazar"
 * escondido en letra pequeña convierte el consentimiento en un trámite, y
 * entonces deja de ser consentimiento.
 */

const BUTTON = 'flex-1 sm:flex-none h-11 px-5 rounded-full text-sm font-semibold cursor-pointer';

export const CookieBanner: React.FC = () => {
  const consent = useConsent();

  // `null` es "todavía no se ha preguntado", y es el único caso que se enseña.
  if (consent !== null) return null;

  const decide = (value: Consent) => () => writeConsent(value);

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed bottom-0 inset-x-0 z-100 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto max-w-4xl rounded-4xl bg-white/95 backdrop-blur-sm ring-1 ring-wine/15 shadow-2xl px-5 py-4 sm:px-7 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex gap-3 min-w-0">
          <span className="w-9 h-9 rounded-full bg-blush flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-wine text-[19px]" aria-hidden="true">
              cookie
            </span>
          </span>
          <p className="font-body-md text-[13px] sm:text-sm leading-relaxed text-on-surface-variant">
            Usamos cookies de <strong className="text-wine">medición</strong> para entender cómo
            llega la gente a la página y mejorarla. Puedes aceptarlas o seguir sin ellas:{' '}
            <strong className="text-wine">tu dedicatoria funciona igual</strong>.
          </p>
        </div>

        <div className="flex gap-2.5 shrink-0 sm:ml-auto">
          <button
            type="button"
            onClick={decide('denied')}
            className={`${BUTTON} text-wine ring-1 ring-wine/25 hover:bg-blush/50 transition-colors`}
          >
            Rechazar
          </button>
          <button
            type="button"
            onClick={decide('granted')}
            className={`${BUTTON} text-white bg-wine hover:bg-primary transition-colors shadow-lg`}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
