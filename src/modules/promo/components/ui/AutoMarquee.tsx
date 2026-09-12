import React from 'react';

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
 */
export const AutoMarquee: React.FC<AutoMarqueeProps> = ({
  children,
  itemWidth = 280,
  gap = 16,
  speed = 24,
  padY = 4,
  label,
  className = '',
}) => {
  const items = React.Children.toArray(children);
  const duration = (items.length * (itemWidth + gap)) / speed;

  return (
    <div className={`relative ${className}`}>
      <div
        className="overflow-hidden -mx-margin-mobile px-margin-mobile"
        style={{ paddingBlock: padY }}
      >
        <ul
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
