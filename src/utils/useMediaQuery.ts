import { useEffect, useState } from 'react';

/**
 * Suscribe un componente a una media query. Útil cuando la diferencia entre
 * móvil y escritorio no es solo de estilos sino de marcado — por ejemplo un
 * carrusel que en pantallas grandes debe ser una rejilla y no duplicar nada.
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setMatches(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [query]);

  return matches;
};
