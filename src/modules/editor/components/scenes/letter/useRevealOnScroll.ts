import { useEffect, type RefObject } from 'react';
import { prefersReducedMotion } from '../../../../../utils/smoothScroll';
import { REVEAL_MAX_DELAY_MS, REVEAL_STAGGER_MS } from './letterTiming';

interface RevealOptions {
  /** Contenedor con scroll dentro del que se mide. */
  scrollRef: RefObject<HTMLDivElement | null>;
  /** Solo se observa mientras la carta está a la vista. */
  active: boolean;
  /** Cambia cuando cambia el contenido: hay bloques nuevos que observar. */
  contentKey: unknown;
}

/**
 * Revelado por scroll: cada bloque `[data-reveal]` entra una sola vez, y los
 * que aparecen juntos se escalonan 90 ms en orden de documento.
 *
 * Con "reducir movimiento", o donde no existe `IntersectionObserver`, todos
 * los bloques se dan por vistos: el texto de la carta nunca depende de una
 * animación para leerse.
 */
export const useRevealOnScroll = ({ scrollRef, active, contentKey }: RevealOptions): void => {
  useEffect(() => {
    const root = scrollRef.current;
    if (!active || !root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        let order = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          // Quien notifica puede no traer elemento (dobles de prueba): se ignora.
          const el = entry.target;
          if (!(el instanceof HTMLElement)) continue;
          el.style.transitionDelay = `${Math.min(order++ * REVEAL_STAGGER_MS, REVEAL_MAX_DELAY_MS)}ms`;
          el.classList.add('is-in');
          io.unobserve(el);
        }
      },
      { root, threshold: 0.12 },
    );
    items.forEach((el) => {
      if (!el.classList.contains('is-in')) io.observe(el);
    });
    return () => io.disconnect();
  }, [scrollRef, active, contentKey]);
};
