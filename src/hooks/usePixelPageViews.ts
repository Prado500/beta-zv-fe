import { useEffect } from 'react';
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
 * `initPixel` es idempotente y se llama en cada ruta a propósito: si el
 * identificador no estaba disponible en el primer render, la siguiente ruta lo
 * vuelve a intentar.
 */
export const usePixelPageViews = (): void => {
  const { pathname } = useLocation();
  const consent = useConsent();

  useEffect(() => {
    if (consent !== 'granted') return;
    initPixel();
    trackPageView();
  }, [pathname, consent]);
};
