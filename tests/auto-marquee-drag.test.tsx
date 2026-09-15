import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { AutoMarquee } from '../src/modules/promo/components/ui/AutoMarquee';
import { RESUME_DELAY_MS } from '../src/modules/promo/components/ui/useMarqueeDrag';

/**
 * La cinta automática, bajo el dedo.
 *
 * Lo que se fija aquí es el trato: mientras alguien la toca NO se mueve sola,
 * sigue al dedo mientras arrastra, y al soltar espera antes de retomar la
 * marcha desde donde quedó. La animación es CSS, así que la única forma de
 * moverla a mano es apagarla —y eso es justo lo que se comprueba.
 */

const CARDS = ['uno', 'dos', 'tres'];

const renderMarquee = (resumeAfterMs?: number | null) =>
  render(
    <AutoMarquee itemWidth={200} gap={20} speed={20} label="Cinta" resumeAfterMs={resumeAfterMs}>
      {CARDS.map((card) => (
        <button key={card} type="button" onClick={onCard}>
          {card}
        </button>
      ))}
    </AutoMarquee>,
  );

const onCard = vi.fn();

/** El carril es el `<ul>`; la superficie del gesto, su contenedor. */
const rails = () => {
  const row = screen.getByRole('list', { name: 'Cinta' }) as HTMLUListElement;
  return { row, surface: row.parentElement as HTMLElement };
};

/**
 * jsdom no calcula diseño: sin esto `offsetWidth` es 0 y la vuelta de la cinta
 * no existe, así que no se podría comprobar el ajuste circular ni la fracción
 * desde la que reanuda.
 */
const withLap = (row: HTMLElement, lap: number) =>
  Object.defineProperty(row, 'offsetWidth', { configurable: true, value: lap * 2 });

/** Ojo: hay que apuntar a lo de dentro del paréntesis; "translate3d" trae un 3. */
const translateX = (row: HTMLElement): number =>
  Number.parseFloat(row.style.transform.match(/translate3d\((-?[\d.]+)px/)?.[1] ?? 'NaN');

/**
 * jsdom no implementa la captura de puntero, así que se instala a mano.
 *
 * No basta con espiar: `hasPointerCapture` tiene que contestar como el
 * navegador —que sí solo después de haberla pedido—, porque es lo que decide
 * si al soltar hay algo que devolver. Devolver una captura que no existe lanza.
 */
const spyPointerCapture = (el: HTMLElement) => {
  const held = new Set<number>();
  const set = vi.fn((id: number) => void held.add(id));
  const release = vi.fn((id: number) => void held.delete(id));
  Object.assign(el, {
    setPointerCapture: set,
    releasePointerCapture: release,
    hasPointerCapture: (id: number) => held.has(id),
  });
  return { set, release };
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  // `clearMocks` borra las llamadas pero deja puesta la implementación falsa:
  // sin esto, el `getComputedStyle` de la prueba de matrix3d se colaría en las
  // siguientes.
  vi.restoreAllMocks();
});

describe('AutoMarquee · arrastre', () => {
  it('al tocarla se detiene en seco', () => {
    renderMarquee();
    const { row, surface } = rails();
    expect(row.style.animationName).toBe('');

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 120 });

    // Apagar la animación es lo que suelta el control del transform
    expect(row.style.animationName).toBe('none');
    expect(row.style.transform).toContain('translate3d');
  });

  /*
   * Sin `withLap` a propósito: aquí se mide que la cinta siga al dedo, y con
   * una vuelta declarada el segundo tramo cruzaría el ajuste circular —que es
   * lo correcto, pero es otra propiedad y tiene su propia prueba debajo—.
   */
  it('sigue al dedo, en los dos sentidos', () => {
    renderMarquee();
    const { row, surface } = rails();

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 300 });
    const origin = translateX(row);

    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 380 });
    expect(translateX(row)).toBeCloseTo(origin + 80, 3);

    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 210 });
    expect(translateX(row)).toBeCloseTo(origin - 90, 3);
  });

  it('el arrastre no tiene tope: al pasar de una vuelta vuelve a entrar por el otro lado', () => {
    renderMarquee();
    const { row, surface } = rails();
    withLap(row, 600);

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 0 });
    // Muy por encima de una vuelta entera
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 5000 });

    // Siempre dentro de (-vuelta, 0]: fuera de ahí asomaría el hueco
    const x = translateX(row);
    expect(x).toBeGreaterThan(-600);
    expect(x).toBeLessThanOrEqual(0);
  });

  it('al soltar espera y retoma la marcha desde donde quedó', () => {
    renderMarquee();
    const { row, surface } = rails();
    withLap(row, 600);

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 400 });
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 250 });
    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 250 });

    // Todavía quieta: la espera es deliberada, no se reanuda de golpe
    expect(row.style.animationName).toBe('none');

    act(() => vi.advanceTimersByTime(RESUME_DELAY_MS));

    expect(row.style.animationName).toBe('');
    expect(row.style.transform).toBe('');
    /*
     * Una vuelta son 33 s (3 tarjetas de 220 px a 20 px/s). Quedó en -150 px
     * de una vuelta de 600, un cuarto: el retraso negativo la coloca ahí en
     * vez de hacerla saltar al principio.
     */
    expect(Number.parseFloat(row.style.animationDelay)).toBeCloseTo(-8.25, 2);
  });

  it('con `resumeAfterMs` a null se queda en la tarjeta elegida', () => {
    renderMarquee(null);
    const { row, surface } = rails();

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 100 });
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 40 });
    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 40 });

    act(() => vi.advanceTimersByTime(RESUME_DELAY_MS * 4));

    expect(row.style.animationName).toBe('none');
  });

  it('volver a tocarla durante la espera cancela la reanudación', () => {
    renderMarquee();
    const { row, surface } = rails();

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 100 });
    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 100 });
    act(() => vi.advanceTimersByTime(RESUME_DELAY_MS / 2));

    fireEvent.pointerDown(surface, { pointerId: 2, clientX: 100 });
    act(() => vi.advanceTimersByTime(RESUME_DELAY_MS));

    // El temporizador del primer gesto no puede arrancarla con el dedo encima
    expect(row.style.animationName).toBe('none');
  });

  it('arrastrar no activa la tarjeta sobre la que se soltó', () => {
    onCard.mockClear();
    renderMarquee();
    const { surface } = rails();
    const card = screen.getAllByRole('button', { name: 'uno' })[0];

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 300 });
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 220 });
    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 220 });
    fireEvent.click(card);

    expect(onCard).not.toHaveBeenCalled();
  });

  it('un toque limpio sí la activa: no todo gesto es un arrastre', () => {
    onCard.mockClear();
    renderMarquee();
    const { surface } = rails();
    const card = screen.getAllByRole('button', { name: 'dos' })[0];

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 300 });
    // Por debajo del umbral: un dedo nunca está del todo quieto
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 303 });
    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 303 });
    fireEvent.click(card);

    expect(onCard).toHaveBeenCalledOnce();
  });

  /*
   * Esta es la pieza que sostiene las dos pruebas de clic de arriba.
   *
   * Mientras hay captura de puntero, el navegador dirige el `click` al elemento
   * que captura y NO al que está bajo el dedo: si se pidiera en el `pointerdown`,
   * ninguna tarjeta recibiría un clic, ni siquiera con un toque limpio, y la
   * prueba de «un toque limpio sí la activa» seguiría pasando porque dispara el
   * clic directamente sobre la tarjeta y se salta ese desvío. Pidiéndola solo
   * cuando el gesto ya es un arrastre, el toque llega a su destino y el clic del
   * arrastre aterriza en la superficie, que es donde se suprime.
   */
  it('no se apropia del puntero hasta que el gesto es un arrastre', () => {
    renderMarquee();
    const { surface } = rails();
    const capture = spyPointerCapture(surface);

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 300 });
    expect(capture.set).not.toHaveBeenCalled();

    // Por debajo del umbral esto todavía es un toque
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 303 });
    expect(capture.set).not.toHaveBeenCalled();

    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 260 });
    expect(capture.set).toHaveBeenCalledWith(1);

    // Y una sola vez: el resto del gesto no vuelve a pedirla
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 200 });
    expect(capture.set).toHaveBeenCalledOnce();

    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 200 });
    expect(capture.release).toHaveBeenCalledWith(1);
  });

  it('el toque limpio no devuelve una captura que nunca pidió', () => {
    renderMarquee();
    const { surface } = rails();
    const capture = spyPointerCapture(surface);

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 300 });
    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 300 });

    // `releasePointerCapture` sobre un puntero que no se capturó lanza
    expect(capture.release).not.toHaveBeenCalled();
  });

  it('un gesto que el navegador cancela también retoma la marcha', () => {
    renderMarquee();
    const { row, surface } = rails();
    withLap(row, 600);

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 400 });
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 250 });
    /*
     * En cuanto el navegador decide que el dedo va en vertical —lo que permite
     * `touch-action: pan-y`— se lleva el gesto y avisa cancelando, no soltando.
     * Es el camino más transitado en móvil: pasa cada vez que alguien desplaza
     * la página con el dedo sobre la cinta.
     */
    fireEvent.pointerCancel(surface, { pointerId: 1, clientX: 250 });

    expect(row.style.animationName).toBe('none');

    act(() => vi.advanceTimersByTime(RESUME_DELAY_MS));

    // Sin esto la cinta se quedaría parada para siempre al desplazar la página
    expect(row.style.animationName).toBe('');
    expect(Number.parseFloat(row.style.animationDelay)).toBeCloseTo(-8.25, 2);
  });

  it('lee la posición aunque el navegador la devuelva como matrix3d', () => {
    renderMarquee();
    const { row, surface } = rails();
    withLap(row, 600);

    /*
     * Para un transform 2D el navegador contesta `matrix(...)` con seis
     * valores, y es lo que pasa hoy. Pero en cuanto entra en juego cualquier
     * contexto 3D —un `translateZ`, una `perspective`— pasa a `matrix3d` con
     * dieciséis, y ahí el propio nombre trae un 3: contarlo como un valor más
     * corre todos los índices y se acabaría leyendo un 0, con la cinta saltando
     * al origen justo al agarrarla.
     */
    const real = window.getComputedStyle;
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) =>
      el === row
        ? ({ transform: 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -150, 0, 0, 1)' } as CSSStyleDeclaration)
        : real.call(window, el, pseudo),
    );

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 0 });

    expect(translateX(row)).toBeCloseTo(-150, 3);
  });

  it('el botón secundario del ratón no secuestra la cinta', () => {
    renderMarquee();
    const { row, surface } = rails();

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 100, pointerType: 'mouse', button: 2 });

    expect(row.style.animationName).toBe('');
  });
});
