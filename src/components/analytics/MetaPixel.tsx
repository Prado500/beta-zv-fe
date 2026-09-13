import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { initMetaPixel, trackPageView } from '../../utils/metaPixel';

/**
 * Meta Pixel dentro del router.
 *
 * No pinta nada: vive colgado del árbol solo para poder escuchar al router. Va
 * dentro de `<Router>` porque `useLocation` lo exige, y es lo que convierte una
 * SPA —donde el documento se carga una vez— en algo que Meta puede contar
 * pantalla a pantalla.
 *
 * **Una vista por pantalla, ni más ni menos.**
 *
 * - Se compara contra `pathname` a secas, no contra la `location` entera: las
 *   anclas de la landing (`#precio`, `#como-funciona`) cambian el `hash` a
 *   través del router y no son páginas nuevas. Contarlas inflaría la métrica
 *   con el usuario que simplemente hace scroll.
 * - El `ref` recuerda la última contada. Sin él, el doble montaje de
 *   `StrictMode` en desarrollo mandaría dos `PageView` de la primera visita, y
 *   eso es exactamente lo que se ve luego en el Administrador de Eventos.
 * - `initMetaPixel` se llama desde el efecto y no al importar el módulo: así
 *   nada toca `window` fuera del navegador y una prueba puede montar la app sin
 *   arrastrar un script de terceros.
 */
export const MetaPixel = (): null => {
  const { pathname } = useLocation();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!initMetaPixel()) return;
    if (lastTracked.current === pathname) return;

    lastTracked.current = pathname;
    trackPageView();
  }, [pathname]);

  return null;
};
