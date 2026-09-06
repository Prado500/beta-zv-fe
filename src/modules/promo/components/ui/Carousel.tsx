import React, { useCallback, useEffect, useRef } from 'react';
import { useMediaQuery } from '../../../../utils/useMediaQuery';

interface CarouselProps {
  children: React.ReactNode;
  /** Ancho de cada tarjeta. Móvil primero: se asoma la siguiente. */
  itemClassName?: string;
  /** Texto bajo el carrusel en móvil. */
  hint?: string;
  /** Flechas en escritorio, donde no hay gesto táctil. */
  arrows?: boolean;
  /** Desplazamiento sin final: al llegar al borde continúa por el otro lado. */
  loop?: boolean;
  /**
   * Solo desliza en móvil; de `md` para arriba se dibuja como rejilla. Para
   * listas cortas, donde en pantalla ancha caben todas y un carrusel estorba.
   */
  mobileOnly?: boolean;
  /** Columnas de esa rejilla. */
  gridClassName?: string;
  /**
   * Píxeles por segundo de desplazamiento continuo, tipo catálogo. Sin valor,
   * no se mueve solo.
   *
   * SOLO CORRE EN MÓVIL: por encima de 768px la comprobación de abajo lo apaga
   * aunque se pase un valor, para que nadie active sin querer un carrusel que
   * se mueve solo en escritorio.
   *
   * En este modo el carril NO se puede desplazar a mano: `overflow-x: hidden`
   * se lo quita a la persona pero sigue permitiendo mover `scrollLeft` por
   * código, que es justo lo que hace falta. También se desactiva el anclaje,
   * que tiraría del carril en cada fotograma y lo movería a tirones.
   */
  driftPxPerSecond?: number;
  label: string;
  className?: string;
}

/** Copias de la lista cuando el carrusel es infinito. Se navega por la del centro. */
const SETS = 3;

/**
 * Carrusel con anclaje de desplazamiento y avance de una tarjeta por gesto.
 * Un solo contenedor scrollable en todos los tamaños: en móvil se desliza con
 * el dedo y en escritorio con las flechas, sin duplicar el marcado aparte.
 *
 * En modo `loop` la lista se repite tres veces y el scroll arranca en la copia
 * central; al acercarse a un extremo se reposiciona un ancho de lista, que es
 * invisible porque el contenido en esa posición es idéntico.
 */
export const Carousel: React.FC<CarouselProps> = ({
  children,
  itemClassName = 'w-[78%] sm:w-[46%] lg:w-[31%]',
  hint,
  arrows = true,
  loop = false,
  mobileOnly = false,
  gridClassName = 'md:grid-cols-3',
  driftPxPerSecond,
  label,
  className = '',
}) => {
  const trackRef = useRef<HTMLUListElement>(null);
  const adjusting = useRef(false);
  const isWide = useMediaQuery('(min-width: 768px)');

  const items = React.Children.toArray(children);
  const asGrid = mobileOnly && isWide;
  const looping = loop && !asGrid;
  const speed = driftPxPerSecond ?? 0;
  const drifting =
    speed > 0 &&
    !isWide &&
    !asGrid &&
    !(typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const rendered = looping ? Array.from({ length: SETS }, () => items).flat() : items;
  /** Arranca en la copia central para que haya recorrido hacia ambos lados. */
  useEffect(() => {
    if (!looping) return;
    const track = trackRef.current;
    if (!track) return;
    track.scrollLeft = track.scrollWidth / SETS;
  }, [looping, items.length]);

  const handleScroll = useCallback(() => {
    // En modo deriva el reposicionamiento lo hace el bucle de animación. Si
    // además lo hiciera este manejador, ambos restarían el ancho de lista en
    // el mismo fotograma y el carril daría un salto hacia atrás.
    if (drifting || !looping || adjusting.current) return;
    const track = trackRef.current;
    if (!track) return;

    const set = track.scrollWidth / SETS;
    if (set <= 0) return;

    let next: number | null = null;
    if (track.scrollLeft < set * 0.5) next = track.scrollLeft + set;
    else if (track.scrollLeft > set * 1.5) next = track.scrollLeft - set;

    if (next === null) return;
    // Reposicionar dispara otro evento de scroll: se ignora con la bandera.
    adjusting.current = true;
    track.scrollLeft = next;
    requestAnimationFrame(() => {
      adjusting.current = false;
    });
  }, [looping, drifting]);

  const scrollByCard = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 16 : track.clientWidth * 0.8;
    track.scrollBy({ left: step * direction, behavior: 'smooth' });
  }, []);

  /**
   * Deriva continua, solo en móvil. Avanza por fotograma, así la velocidad es
   * constante. No corre si la lista está fuera de pantalla ni con la pestaña
   * en segundo plano: mover algo que nadie ve solo gasta batería.
   */
  useEffect(() => {
    if (!drifting) return;
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    let previous = 0;
    let visible = false;

    const tick = (now: number) => {
      if (previous) {
        const elapsed = (now - previous) / 1000;
        // Un salto de tiempo grande (pestaña dormida) daría un tirón enorme
        if (visible && !document.hidden && elapsed < 0.1) {
          const set = track.scrollWidth / SETS;
          let next = track.scrollLeft + speed * elapsed;
          if (set > 0 && next > set * 1.5) next -= set;
          track.scrollLeft = next;
        }
      }
      previous = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.2 },
    );
    observer.observe(track);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [drifting, speed]);

  return (
    <div className={`relative ${className}`}>
      {arrows && !asGrid && !drifting && (
        <>
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label="Anterior"
            className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full bg-white text-wine shadow-[0_10px_24px_-10px_rgba(94,10,27,0.6)] ring-1 ring-wine/15 hover:bg-blush transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="Siguiente"
            className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full bg-white text-wine shadow-[0_10px_24px_-10px_rgba(94,10,27,0.6)] ring-1 ring-wine/15 hover:bg-blush transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">chevron_right</span>
          </button>
        </>
      )}

      {/* El sangrado deja que la tarjeta siguiente se asome en el borde */}
      <div className={asGrid ? '' : '-mx-margin-mobile md:mx-0'}>
        <ul
          ref={trackRef}
          onScroll={handleScroll}
          aria-label={label}
          className={
            asGrid
              ? `grid gap-6 ${gridClassName}`
              : drifting
                ? /* overflow-x-hidden: nadie lo arrastra, pero scrollLeft sigue
                     funcionando por código */
                  'no-scrollbar flex gap-4 overflow-x-hidden px-margin-mobile md:px-1 py-1'
                : 'no-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory px-margin-mobile md:px-1 py-1'
          }
        >
          {rendered.map((item, i) => (
            <li
              key={i}
              /* Las copias no entran al árbol de accesibilidad: se leería tres veces */
              aria-hidden={looping && i >= items.length ? true : undefined}
              className={
                asGrid
                  ? 'min-w-0'
                  : /* Ojo: las clases deben quedar separadas por espacio del
                       ${'$'}{...} — pegadas, el escáner de Tailwind no las extrae y
                       la regla nunca llega al CSS.
                       En modo deriva no hay anclaje: tiraría del carril en cada
                       fotograma y el movimiento saldría a tirones. */
                    `${itemClassName} shrink-0 ${
                      drifting ? '' : 'snap-center snap-always'
                    } ${looping && i >= items.length ? 'pointer-events-none' : ''}`
              }
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      {hint && !asGrid && !drifting && (
        <p className="lg:hidden flex items-center justify-center gap-1.5 text-xs opacity-60 pt-3">
          <span className="material-symbols-outlined text-[15px]">swipe</span>
          {hint}
        </p>
      )}
    </div>
  );
};
