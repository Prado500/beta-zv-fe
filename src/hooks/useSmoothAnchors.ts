import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { smoothScrollTo, stopSmoothScroll } from '../utils/smoothScroll';

/**
 * Enlaces internos con desplazamiento suave.
 *
 * Un solo escuchador sobre el documento cubre cualquier `<a href="#…">` de la
 * página —la barra, el botón del hero, el pie— sin que cada enlace tenga que
 * enterarse. Al pulsar uno se anima el scroll y la URL pasa a reflejar la
 * sección a través del router, no con `history.pushState` a sus espaldas: así
 * `useLocation` sigue diciendo la verdad y el botón de atrás vuelve a la
 * sección anterior, igual que con un ancla nativa.
 *
 * Se respetan los gestos de "abrir aparte" —modificadores, otro botón,
 * `target="_blank"`— y un enlace cuyo destino no existe sigue su curso normal.
 */
export const useSmoothAnchors = (): void => {
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = (event.target as Element | null)?.closest?.('a');
      if (!link || link.target === '_blank') return;

      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#') || href === '#') return;

      // `getElementById` y no `querySelector(href)`: un id que empiece por
      // número haría estallar el selector.
      const target = document.getElementById(href.slice(1));
      if (!target) return;

      event.preventDefault();
      smoothScrollTo(target);
      navigate(href);
    };

    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
      stopSmoothScroll();
    };
  }, [navigate]);
};
