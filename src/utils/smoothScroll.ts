/**
 * Desplazamiento suave hasta un elemento, animado a mano.
 *
 * Se anima con `requestAnimationFrame` en vez de dejarlo en manos de
 * `scroll-behavior: smooth`. Ese CSS estaba puesto y aplicado —el navegador lo
 * reportaba activo— y aun así el salto era instantáneo: al medirlo, la página
 * pasaba de 0 a 6219 px en un solo fotograma. Escribiendo la animación no
 * depende de que el navegador quiera hacerla.
 *
 * Aquí no hay React: solo el cálculo del destino y el bucle de fotogramas.
 * Quién lo dispara y cuándo es asunto de `useSmoothAnchors`.
 */

/** Rápido al principio y al final; el tramo largo, más suelto. */
const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

const MIN_MS = 340;
/*
 * El tope estaba en 820 ms, y de la barra a "Precio" hay 7400 px: el recorrido
 * entero se hacía en poco más de medio segundo y no se leía como un viaje sino
 * como un corte con estela. Medido: pasaba de 0 a 7394 px en catorce
 * fotogramas. Con 1150 ms el trayecto largo se ve, y los cortos siguen siendo
 * cortos porque la duración es proporcional.
 */
const MAX_MS = 1150;
/** Milisegundos por cada mil píxeles de recorrido. */
const MS_PER_1000PX = 110;

/** Gestos con los que la persona retoma el control a mitad de recorrido. */
const SURRENDER_EVENTS: (keyof WindowEventMap)[] = ['wheel', 'touchstart', 'keydown'];

/** Duración proporcional al recorrido, acotada: ni un parpadeo ni un viaje. */
export const scrollDuration = (distance: number): number =>
  Math.min(MAX_MS, Math.max(MIN_MS, (Math.abs(distance) / 1000) * MS_PER_1000PX + MIN_MS));

/**
 * Destino de scroll para `el`, descontando su `scroll-margin-top`.
 *
 * El margen se lee del estilo calculado y no de una constante: así sigue al
 * `scroll-mt` de las secciones, que existe para que no queden debajo de las
 * barras fijas. Si un día cambia esa clase, esto va detrás solo.
 */
export const scrollTargetFor = (el: Element): number => {
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const limit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  return Math.min(limit, Math.max(0, el.getBoundingClientRect().top + window.scrollY - margin));
};

export const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let frame = 0;
let release: (() => void) | null = null;

/** Corta la animación en curso, si la hay, y suelta sus escuchadores. */
export const stopSmoothScroll = (): void => {
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  release?.();
  release = null;
};

/**
 * Lleva la página hasta `el`.
 *
 * Con "reducir movimiento" activo salta directo al destino: ese ajuste existe
 * para quien se marea con el desplazamiento, y aquí el viaje es el efecto.
 * Cualquier gesto de la persona manda: si toca la rueda, la pantalla o el
 * teclado a mitad del recorrido, la animación se aparta y le deja el control,
 * en vez de seguir arrastrándola.
 */
export const smoothScrollTo = (el: Element): void => {
  stopSmoothScroll();

  const from = window.scrollY;
  const to = scrollTargetFor(el);
  const distance = to - from;
  if (Math.abs(distance) < 2) return;

  if (prefersReducedMotion()) {
    window.scrollTo({ top: to, behavior: 'instant' });
    return;
  }

  const duration = scrollDuration(distance);
  const surrender = () => stopSmoothScroll();
  SURRENDER_EVENTS.forEach((name) => window.addEventListener(name, surrender, { passive: true }));
  release = () => SURRENDER_EVENTS.forEach((name) => window.removeEventListener(name, surrender));

  // El reloj es el del propio fotograma: el primero fija el cero y los demás
  // se miden contra él, sin depender de `performance.now()`.
  let start: number | null = null;
  const step = (now: number) => {
    if (start === null) start = now;
    const t = Math.min(1, (now - start) / duration);
    window.scrollTo({ top: from + distance * easeInOutCubic(t), behavior: 'instant' });
    if (t < 1) {
      frame = requestAnimationFrame(step);
      return;
    }
    frame = 0;
    release?.();
    release = null;
  };
  frame = requestAnimationFrame(step);
};
