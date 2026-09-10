import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { prefersReducedMotion } from '../../../../../utils/smoothScroll';
import { AUTO_SCROLL_PX_S, AUTO_SCROLL_START_MS } from './letterTiming';

interface AutoScrollOptions {
  /** Contenedor con scroll de la carta. */
  scrollRef: RefObject<HTMLDivElement | null>;
  /** La carta está a la vista. */
  active: boolean;
  /** Modo demo: la carta se recorre sola, para grabarla. */
  demo: boolean;
  /** Cambia cuando cambia el contenido: reinicia el recorrido desde arriba. */
  contentKey: unknown;
}

/**
 * Recorrido automático de la carta en modo demo, y el botón de volver arriba.
 *
 * La carta se recorre sola, a ritmo constante, y al llegar abajo se queda
 * ahí. Quien la lee decide con el botón si quiere volver a subir.
 *
 * La posición se lleva en un acumulador propio en vez de leer `scrollTop` en
 * cada vuelta. Ese era el motivo de que en el celular no se moviera nada: a
 * 120 Hz el avance por fotograma es de 0,75 px, y como el navegador redondea
 * `scrollTop` a un entero, el resto se perdía en cada frame y el recorrido no
 * arrancaba. A 60 Hz —el escritorio— salían 1,5 px y sí avanzaba.
 *
 * El recorrido se rinde ante la persona: cualquier toque, rueda o tecla sobre
 * la carta lo detiene y le deja el control.
 */
export const useAutoScroll = ({ scrollRef, active, demo, contentKey }: AutoScrollOptions) => {
  /** Cancela el recorrido en curso, si lo hay. */
  const stopRef = useRef<(() => void) | null>(null);
  /** Espera antes de arrancar, si está programada. */
  const pendingRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (pendingRef.current) window.clearTimeout(pendingRef.current);
    pendingRef.current = null;
    stopRef.current?.();
    stopRef.current = null;
  }, []);

  const run = useCallback((): (() => void) => {
    const el = scrollRef.current;
    if (!el) return () => undefined;

    let raf = 0;
    let last = performance.now();
    let pos = 0;

    el.scrollTo(0, 0);
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const max = el.scrollHeight - el.clientHeight;
      pos = Math.min(max, pos + AUTO_SCROLL_PX_S * dt);
      el.scrollTo(0, pos);
      if (pos < max - 0.5) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [scrollRef]);

  /** Programa el recorrido: espera un poco y arranca desde arriba. */
  const schedule = useCallback(() => {
    stop();
    pendingRef.current = window.setTimeout(() => {
      pendingRef.current = null;
      stopRef.current = run();
    }, AUTO_SCROLL_START_MS);
  }, [run, stop]);

  useEffect(() => {
    if (!active || !demo) return;
    schedule();
    return stop;
  }, [active, demo, contentKey, schedule, stop]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !demo) return;
    const byUser = () => stop();
    const opts: AddEventListenerOptions = { passive: true };
    el.addEventListener('pointerdown', byUser, opts);
    el.addEventListener('touchstart', byUser, opts);
    el.addEventListener('wheel', byUser, opts);
    el.addEventListener('keydown', byUser, opts);
    return () => {
      el.removeEventListener('pointerdown', byUser);
      el.removeEventListener('touchstart', byUser);
      el.removeEventListener('wheel', byUser);
      el.removeEventListener('keydown', byUser);
    };
  }, [scrollRef, demo, stop]);

  /**
   * Vuelve al principio de la carta sin cortar la música. En modo demo,
   * además, vuelve a lanzar el recorrido desde arriba.
   */
  const backToTop = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    stop();
    el.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    if (demo) schedule();
  }, [scrollRef, demo, schedule, stop]);

  return { backToTop };
};
