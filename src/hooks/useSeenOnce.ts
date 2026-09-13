import { useEffect, useState, type RefObject } from 'react';

/**
 * Si un elemento ha llegado a verse alguna vez. Una vez sí, ya no vuelve a no.
 *
 * No es `useInView`, y la diferencia importa: aquel **nace en `true`** —le
 * conviene, porque decide si esconder un chip— y eso significa que un efecto
 * colgado de él se dispara en el primer render, antes de que el observador
 * diga nada. Para avisar a Meta de que alguien vio el producto, eso sería
 * exactamente lo que se quiere evitar: un evento en cada carga de la portada.
 *
 * Aquí se nace en `false` y solo lo cambia el observador. Donde no hay
 * `IntersectionObserver` (jsdom) se queda en `false`: sin señal no se inventa
 * una visita.
 */
export const useSeenOnce = (target: RefObject<Element | null>, threshold = 0.4): boolean => {
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (seen) return;

    const element = target.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= threshold)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [target, threshold, seen]);

  return seen;
};
