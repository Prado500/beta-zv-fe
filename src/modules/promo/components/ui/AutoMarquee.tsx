import React from 'react';
import { useMarqueeDrag } from './useMarqueeDrag';

interface AutoMarqueeProps {
  children: React.ReactNode;
  /** Ancho de cada tarjeta en px. Fijo a propósito, ver nota de abajo. */
  itemWidth?: number;
  /** Separación entre tarjetas, en px. */
  gap?: number;
  /** Píxeles por segundo. Un poco lento se lee mejor. */
  speed?: number;
  /**
   * Aire arriba y abajo, en px. El carril recorta lo que se sale —lo necesita
   * para el bucle—, así que un adorno que sobresalga de la tarjeta, como un
   * número puesto sobre el borde, se corta si no se le reserva sitio.
   */
  padY?: number;
  /**
   * Espera antes de que la cinta vuelva a andar sola tras soltarla. Con `null`
   * se queda en la tarjeta donde la dejaron.
   */
  resumeAfterMs?: number | null;
  label: string;
  className?: string;
}

/**
 * Cinta que se desplaza sola, a velocidad constante y sin que nadie la toque.
 *
 * Va con una animación CSS sobre `transform`, no moviendo `scrollLeft` desde
 * JavaScript: aquello dependía de demasiadas piezas (bucle de fotogramas,
 * observador de visibilidad, que el carril fuese contenedor de scroll) y
 * cualquiera de ellas podía dejarlo quieto. Aquí solo hay una regla de CSS.
 *
 * El truco del bucle sin costuras: la lista se dibuja DOS veces y la fila se
 * desplaza exactamente un -50%. Para que esa mitad coincida con una lista
 * completa, la separación va como margen de cada tarjeta y no como `gap` —
 * con `gap` hay 2N-1 huecos y la mitad no cuadra, así que el salto se vería.
 * Por lo mismo el ancho es fijo en px: un porcentaje contra un contenedor
 * `w-max` no tiene contra qué resolverse.
 *
 * Y se puede arrastrar: al tocarla se detiene y sigue al dedo; al soltar
 * espera un momento y retoma la marcha desde donde quedó. Esa parte vive en
 * `useMarqueeDrag`, que explica por qué hace falta apagar la animación para
 * poder mover el carril.
 */
export const AutoMarquee: React.FC<AutoMarqueeProps> = ({
  children,
  itemWidth = 280,
  gap = 16,
  speed = 24,
  padY = 4,
  resumeAfterMs,
  label,
  className = '',
}) => {
  const items = React.Children.toArray(children);
  const duration = (items.length * (itemWidth + gap)) / speed;
  const { rowRef, surface } = useMarqueeDrag({ durationSeconds: duration, resumeAfterMs });

  return (
    <div className={`relative ${className}`}>
      {/*
        `touch-action: pan-y` es lo que reparte el gesto: el dedo en horizontal
        arrastra la cinta y en vertical sigue desplazando la página. Sin esto,
        o se lleva el gesto la cinta o se lo lleva la página, y una de las dos
        deja de responder.
      */}
      <div
        {...surface}
        className="overflow-hidden -mx-margin-mobile px-margin-mobile touch-pan-y select-none cursor-grab active:cursor-grabbing"
        style={{ paddingBlock: padY }}
      >
        <ul
          ref={rowRef}
          role="list"
          aria-label={label}
          className="marquee-row flex w-max"
          style={{ '--marquee-duration': `${duration.toFixed(1)}s` } as React.CSSProperties}
        >
          {[...items, ...items].map((item, i) => (
            <li
              key={i}
              /* La segunda copia existe solo para cerrar el bucle */
              aria-hidden={i >= items.length ? true : undefined}
              className="shrink-0"
              style={{ width: `${itemWidth}px`, marginRight: `${gap}px` }}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
};
