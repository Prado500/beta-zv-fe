import { useCallback, useEffect, useRef, useState } from 'react';

/** Medidas de diseño de la carta. Todo dentro se maqueta contra ellas. */
export const DESIGN_W = 320;
export const DESIGN_H = 640;

/** Aire que se deja bajo el teléfono para que no toque el borde. */
const BOTTOM_GAP = 20;

/**
 * En móvil se reserva más: ahí el teléfono se apoya sobre un pedestal que
 * sobresale por abajo, y con 20px quedaba pegado al borde de la pantalla.
 */
const BOTTOM_GAP_MOBILE = 56;

const MIN_SCALE = 0.62;
const MAX_SCALE = 1.18;

/**
 * En móvil la previa no debe llenar la pantalla: con la pestaña Previa activa
 * el teléfono era casi tan alto como el viewport y no quedaba aire para el
 * pedestal ni para entender que es una maqueta.
 */
const MAX_SCALE_MOBILE = 0.8;
const MOBILE_BREAKPOINT = 768;

/**
 * Ajusta el teléfono al hueco que realmente queda debajo del rótulo. Devuelve
 * la escala y el ref que hay que poner en el envoltorio.
 *
 * La carta se maqueta siempre a 320×640 y el conjunto se escala: encoger el
 * marco directamente dejaría el texto en dos palabras por línea. La escala se
 * calcula midiendo el hueco real, no con escalones por media query.
 */
export const usePhoneScale = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const narrow = window.innerWidth < MOBILE_BREAKPOINT;
    const gap = narrow ? BOTTOM_GAP_MOBILE : BOTTOM_GAP;
    const ceiling = narrow ? MAX_SCALE_MOBILE : MAX_SCALE;

    const top = el.getBoundingClientRect().top;
    const byHeight = (window.innerHeight - top - gap) / DESIGN_H;
    const byWidth = (el.parentElement?.clientWidth ?? window.innerWidth) / DESIGN_W;
    setScale(Math.max(MIN_SCALE, Math.min(ceiling, Math.min(byHeight, byWidth))));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    measure();
    window.addEventListener('resize', measure);
    // Donde no existe (jsdom) basta con la medida inicial y el `resize`.
    if (typeof ResizeObserver === 'undefined') {
      return () => window.removeEventListener('resize', measure);
    }
    // El observer dispara también al montar, así que cubre la medida inicial
    const observer = new ResizeObserver(measure);
    if (el.parentElement) observer.observe(el.parentElement);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  return { ref, scale };
};
