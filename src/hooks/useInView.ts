import { useEffect, useState, type RefObject } from 'react';

interface InViewOptions {
  /** Contenedor con scroll contra el que medir; por defecto, el viewport. */
  root?: RefObject<Element | null>;
  /** Fracción visible a partir de la cual cuenta como "a la vista". */
  threshold?: number;
  /** Mientras sea falso no se observa y se da por visible: ahorra un observer. */
  enabled?: boolean;
}

/**
 * Si un elemento está a la vista dentro de su contenedor con scroll.
 *
 * Donde no existe `IntersectionObserver` (jsdom) se asume visible: el chip
 * flotante que depende de esto es un extra, no algo de lo que dependa leer la
 * carta.
 */
export const useInView = (
  target: RefObject<Element | null>,
  { root, threshold = 0.5, enabled = true }: InViewOptions = {},
): boolean => {
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const element = target.current;
    if (!enabled || !element || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry) setInView(entry.isIntersecting && entry.intersectionRatio >= threshold);
      },
      { root: root?.current ?? null, threshold },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [target, root, threshold, enabled]);

  return enabled ? inView : true;
};
