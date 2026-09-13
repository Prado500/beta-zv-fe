import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { initPixel, trackPageView } from '../utils/pixel';
import { useConsent } from './useConsent';

/**
 * Carga el píxel y registra una visita en cada cambio de ruta.
 *
 * En una sola página el navegador solo navega una vez: sin esto, entrar por la
 * portada y llegar hasta `/pago/retorno` contaría como una única visita. Va
 * dentro del `Router` porque necesita saber la ruta actual.
 *
 * Nada de esto ocurre sin consentimiento, y el efecto cuelga de él: quien
 * acepta a mitad de visita enciende el píxel en ese momento y su visita cuenta.
 * Esperar a la siguiente página perdería justo la que lo aceptó.
 *
 * **Una vista por pantalla, ni más ni menos.** Se mira `pathname` a secas y no
 * la `location` entera: las anclas de la landing (`#precio`, `#como-funciona`)
 * cambian el `hash` a través del router y no son páginas nuevas; contarlas
 * inflaría la métrica con quien solo hace scroll. Y el `ref` recuerda la última
 * contada, que es lo que evita que el doble montaje de `StrictMode` mande dos
 * visitas de la primera pantalla.
 *
 * El `ref` no se toca sin consentimiento, así que quien acepta a mitad de
 * visita sí cuenta: su pantalla todavía no estaba apuntada.
 *
 * `initPixel` es idempotente y se llama en cada ruta a propósito: si el
 * identificador no estaba disponible en el primer render, la siguiente ruta lo
 * vuelve a intentar.
 */
export const usePixelPageViews = (): void => {
  const { pathname } = useLocation();
  const consent = useConsent();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (consent !== 'granted') return;
    if (lastTracked.current === pathname) return;

    lastTracked.current = pathname;
    initPixel();
    trackPageView();
  }, [pathname, consent]);
};
