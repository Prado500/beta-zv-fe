import { useEffect, useState } from 'react';
import { onConsentChange, readConsent, type Consent } from '../utils/consent';

/**
 * La decisión de cookies, viva: `null` mientras no se haya preguntado.
 *
 * Existe para que aceptar surta efecto en el acto. Lo que depende del
 * consentimiento —cargar el píxel, mandar un evento, enseñar el aviso— cuelga
 * de este valor, así que al pulsar "Aceptar" React vuelve a pintar y lo que
 * estaba esperando arranca sin recargar la página.
 */
export const useConsent = (): Consent | null => {
  const [consent, setConsent] = useState<Consent | null>(readConsent);

  useEffect(() => onConsentChange(setConsent), []);

  return consent;
};
