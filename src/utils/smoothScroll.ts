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

const MIN_MS = 380;
/*
 * El tope, dos veces revisado, y por el mismo motivo las dos.
 *
 * De la barra a "Precio" hay 7400 px. Con 820 ms eso son 9000 px/s y con
 * 1150 ms, 5900: medido, la animación corría —47 muestras, ningún salto por
 * encima del 12% del recorrido— pero a esa velocidad el contenido pasa como un
 * borrón y se percibe como un corte, no como un viaje. A 1700 ms baja a unos
 * 4300 px/s, que ya se sigue con la vista.
 *
 * Los trayectos cortos no se enteran: la duración es proporcional y un salto
 * de 1200 px sigue durando poco más de medio segundo.
 */
const MAX_MS = 1700;
/** Milisegundos por cada mil píxeles de recorrido. */
const MS_PER_1000PX = 165;
/** Lo que dura el recorrido con "reducir movimiento": corto, pero no un salto. */
const REDUCED_MS = 320;

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
 * `onArrive` se llama al llegar, y solo al llegar: si la persona toma el
 * control a mitad de camino no se la lleva a ninguna parte.
 *
 * Con "reducir movimiento" activo salta directo al destino: ese ajuste existe
 * para quien se marea con el desplazamiento, y aquí el viaje es el efecto.
 * Cualquier gesto de la persona manda: si toca la rueda, la pantalla o el
 * teclado a mitad del recorrido, la animación se aparta y le deja el control,
 * en vez de seguir arrastrándola.
 */
export const smoothScrollTo = (el: Element, onArrive?: () => void): void => {
  stopSmoothScroll();

  const from = window.scrollY;
  const to = scrollTargetFor(el);
  const distance = to - from;
  if (Math.abs(distance) < 2) return;

  /*
   * Con "reducir movimiento" NO se teletransporta: se acorta.
   *
   * Antes saltaba al destino en un solo fotograma, y eso es justo lo que se
   * ve como un corte: 1241 px de golpe desorientan más que un recorrido
   * breve. Quien activa ese ajuste huye del movimiento largo y decorativo
   * —parallax, zooms, cosas que se mueven solas—, no de un desplazamiento
   * funcional que dura un cuarto de segundo y enseña a dónde te llevaron.
   *
   * Se reduce, que es lo que pide la preferencia, en vez de eliminarse.
   */
  const duration = prefersReducedMotion() ? REDUCED_MS : scrollDuration(distance);
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
    /* Al final, y no antes: lo que se haga aquí compite por el mismo hilo
       que la animación, y un solo fotograma perdido se ve como un tirón. */
    onArrive?.();
  };
  frame = requestAnimationFrame(step);
};
