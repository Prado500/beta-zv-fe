import { useCallback, useEffect, useRef, useState } from 'react';

/** Debe coincidir con la animación de salida del visor (`superpositionOut`). */
export const LIGHTBOX_CLOSE_MS = 120;

export interface PhotoLightbox {
  /** Foto ampliada, o `null` con el visor cerrado. */
  index: number | null;
  /** Corriendo la animación de salida; el visor sigue montado. */
  closing: boolean;
  open: (index: number) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  /** Cierra en seco, sin animación: para cuando se cierra la carta entera. */
  reset: () => void;
}

/**
 * Estado del visor de fotos ampliadas dentro de la carta.
 *
 * El cierre tiene dos tiempos: primero corre la animación de salida y solo
 * después se desmonta. Aquí vive esa cuenta, no en el JSX.
 */
export const usePhotoLightbox = (count: number): PhotoLightbox => {
  const [index, setIndex] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const timer = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const open = useCallback(
    (next: number) => {
      clear();
      setClosing(false);
      setIndex(next);
    },
    [clear],
  );

  const close = useCallback(() => {
    clear();
    setClosing(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setIndex(null);
      setClosing(false);
    }, LIGHTBOX_CLOSE_MS);
  }, [clear]);

  const next = useCallback(() => {
    setIndex((current) => (current === null || count === 0 ? current : (current + 1) % count));
  }, [count]);

  const prev = useCallback(() => {
    setIndex((current) => (current === null || count === 0 ? current : (current - 1 + count) % count));
  }, [count]);

  const reset = useCallback(() => {
    clear();
    setIndex(null);
    setClosing(false);
  }, [clear]);

  useEffect(() => clear, [clear]);

  return { index, closing, open, close, next, prev, reset };
};
