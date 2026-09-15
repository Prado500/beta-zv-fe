import { useCallback, useEffect, useRef } from 'react';

/**
 * Arrastre manual de la cinta automática.
 *
 * La cinta se mueve con una animación CSS sobre `transform` —una sola regla,
 * sin bucle de fotogramas— y eso es justo lo que impide moverla: el navegador
 * es el dueño de la propiedad mientras la animación corre. Así que al tocar se
 * hace lo contrario: se lee dónde está, se apaga la animación y a partir de
 * ahí manda el dedo. Al soltar se devuelve el control con un `animation-delay`
 * negativo equivalente a la posición actual, y la cinta sigue desde donde
 * quedó en vez de saltar al principio.
 *
 * No se cambió a un contenedor con scroll nativo a propósito: el componente ya
 * vino de ahí y se documentó por qué se abandonó (dependía del bucle de
 * fotogramas, del observador de visibilidad y de que el carril fuese
 * contenedor de scroll, y cualquiera de las tres podía dejarlo quieto).
 */

/** A partir de aquí el gesto es un arrastre y no un toque sobre una tarjeta. */
const DRAG_THRESHOLD_PX = 6;

/** Lo que espera la cinta, ya suelta, antes de volver a andar sola. */
export const RESUME_DELAY_MS = 2200;

export interface MarqueeDragOptions {
  /** Lo que tarda una vuelta entera, en segundos. El mismo valor del CSS. */
  durationSeconds: number;
  /**
   * Espera antes de reanudar tras soltar. Con `null` la cinta se queda donde
   * la dejaron y no vuelve a arrancar sola.
   */
  resumeAfterMs?: number | null;
}

/** translateX actual, tanto si lo pinta la animación como si lo pusimos nosotros. */
const currentX = (row: HTMLElement): number => {
  const { transform } = getComputedStyle(row);
  if (!transform || transform === 'none') return 0;
  const parts = transform.match(/-?[\d.]+(?:e-?\d+)?/g);
  if (!parts) return 0;
  // matrix(a,b,c,d,tx,ty) | matrix3d(...16 valores, tx en la posición 13)
  const raw = parts.length === 6 ? parts[4] : parts[12];
  const value = Number.parseFloat(raw ?? '0');
  return Number.isFinite(value) ? value : 0;
};

/**
 * Una vuelta de la cinta. El carril dibuja la lista DOS veces y la animación
 * recorre un -50%, así que media anchura es exactamente una lista.
 */
const lapWidth = (row: HTMLElement): number => row.offsetWidth / 2;

/**
 * Deja la posición dentro de (-vuelta, 0].
 *
 * Fuera de ese tramo el carril se despegaría del borde y asomaría el hueco:
 * dentro de él, como el contenido de las dos copias es idéntico, cualquier
 * punto se ve igual. Es lo que permite arrastrar sin fin en los dos sentidos.
 */
const wrap = (x: number, lap: number): number => (lap > 0 ? (((x % lap) + lap) % lap) - lap : x);

export interface MarqueeDragHandles {
  /** Va en el `<ul>` que lleva la animación. */
  rowRef: React.RefObject<HTMLUListElement | null>;
  /** Va en el contenedor que recibe el gesto. */
  surface: {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerCancel: (event: React.PointerEvent<HTMLElement>) => void;
    onClickCapture: (event: React.MouseEvent<HTMLElement>) => void;
  };
}

export const useMarqueeDrag = ({
  durationSeconds,
  resumeAfterMs = RESUME_DELAY_MS,
}: MarqueeDragOptions): MarqueeDragHandles => {
  const rowRef = useRef<HTMLUListElement>(null);
  const drag = useRef<{ pointerId: number; startX: number; originX: number } | null>(null);
  /**
   * Dónde quedó la cinta. Se guarda en vez de releerla del estilo computado al
   * reanudar: ahí ya es un valor nuestro, y volver a pasarlo por la matriz del
   * navegador solo añadiría una forma más de leerlo mal.
   */
  const position = useRef(0);
  /** Hubo movimiento de verdad: el clic que viene detrás no es una pulsación. */
  const moved = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelResume = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = null;
  }, []);

  /** Congela la cinta donde esté y devuelve esa posición. */
  const freeze = useCallback((row: HTMLElement): number => {
    /*
     * Si ya estaba congelada —se vuelve a agarrar durante la espera— la
     * posición es nuestra y no hay que ir a buscarla al estilo computado.
     * Leerla solo hace falta cuando quien la movía era la animación.
     */
    const frozen = row.style.animationName === 'none';
    const x = wrap(frozen ? position.current : currentX(row), lapWidth(row));
    row.style.animationName = 'none';
    row.style.transform = `translate3d(${x}px, 0, 0)`;
    position.current = x;
    return x;
  }, []);

  /** Devuelve el mando a la animación, desde la posición en la que quedó. */
  const resume = useCallback(
    (row: HTMLElement) => {
      const lap = lapWidth(row);
      // La animación va de 0 a -vuelta: en -x/vuelta está la fracción recorrida.
      const progress = lap > 0 ? -position.current / lap : 0;
      row.style.transform = '';
      row.style.animationDelay = `${(-progress * durationSeconds).toFixed(3)}s`;
      row.style.animationName = '';
    },
    [durationSeconds],
  );

  useEffect(() => cancelResume, [cancelResume]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const row = rowRef.current;
      // Solo el botón principal: con el secundario se abre el menú del sistema
      if (!row || (event.pointerType === 'mouse' && event.button !== 0)) return;

      cancelResume();
      moved.current = false;
      drag.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        originX: freeze(row),
      };
      // Capturar el puntero mantiene el gesto aunque el dedo salga de la cinta
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [cancelResume, freeze],
  );

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const active = drag.current;
    const row = rowRef.current;
    if (!active || active.pointerId !== event.pointerId || !row) return;

    const delta = event.clientX - active.startX;
    if (Math.abs(delta) > DRAG_THRESHOLD_PX) moved.current = true;

    const x = wrap(active.originX + delta, lapWidth(row));
    position.current = x;
    row.style.transform = `translate3d(${x}px, 0, 0)`;
  }, []);

  const finish = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const active = drag.current;
      const row = rowRef.current;
      if (!active || active.pointerId !== event.pointerId) return;

      drag.current = null;
      event.currentTarget.releasePointerCapture?.(event.pointerId);

      // Sin espera configurada, la cinta se queda en la tarjeta que eligieron
      if (!row || resumeAfterMs === null) return;
      resumeTimer.current = setTimeout(() => resume(row), resumeAfterMs);
    },
    [resume, resumeAfterMs],
  );

  /**
   * Un arrastre no debe activar la tarjeta sobre la que se soltó el dedo. Va
   * en captura para llegar antes que el manejador de quien esté dentro.
   */
  const onClickCapture = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (!moved.current) return;
    moved.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    rowRef,
    surface: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
      onClickCapture,
    },
  };
};
