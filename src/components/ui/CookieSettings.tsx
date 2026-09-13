import React from 'react';
import { useConsent } from '../../hooks/useConsent';
import { clearConsent } from '../../utils/consent';

/**
 * La vuelta atrás del aviso de cookies.
 *
 * El aviso solo se enseña mientras no se haya decidido nada, así que sin esto
 * la primera respuesta era para siempre. La Política de Privacidad promete, en
 * su apartado 10, que el usuario podrá «aceptar, rechazar o modificar
 * preferencias»: esto es la parte de "modificar", y sin ella esa frase sería
 * una promesa sin implementación.
 *
 * **No se pinta antes de decidir.** Ahí la herramienta ya está en pantalla —es
 * el propio aviso—, y ofrecer un segundo camino a lo mismo solo sería ruido.
 *
 * Es un `button` y no un enlace porque no lleva a ninguna parte: devuelve el
 * aviso a esta misma pantalla. Un `<a href="#">` mentiría al lector de
 * pantalla y al que pulsa con el botón central.
 */

interface CookieSettingsProps {
  /** Lo pone quien lo monta: así se peina igual que sus vecinos del pie. */
  className?: string;
}

export const CookieSettings: React.FC<CookieSettingsProps> = ({ className }) => {
  const consent = useConsent();

  if (consent === null) return null;

  return (
    <button type="button" onClick={clearConsent} className={className}>
      Preferencias de cookies
    </button>
  );
};
