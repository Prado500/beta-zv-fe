import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import LandingPage from '../src/modules/promo/page/LandingPage';
import { Header } from '../src/modules/promo/components/layout/Header';
import { SECTION_LINKS } from '../src/modules/promo/components/layout/sectionLinks';
import { useSmoothAnchors } from '../src/hooks/useSmoothAnchors';
import { stopSmoothScroll } from '../src/utils/smoothScroll';
import { renderAt, setupUser } from './testUtils';

/**
 * Las anclas de la landing: cada enlace de la barra lleva a una sección que
 * existe, y al pulsarlo la página se desplaza suave y la URL lo refleja a
 * través del router. Se prueba lo que pasa al hacer clic; nadie mira dentro
 * del hook ni de la animación.
 */

/** Dónde queda el destino en la página de prueba, en píxeles. */
const TARGET_TOP = 1400;

/** Página mínima: el hook, un enlace, su sección y la URL que ve el router. */
const Page = ({ href = '#destino' }: { href?: string }) => {
  useSmoothAnchors();
  const location = useLocation();
  return (
    <>
      <a href={href}>Ir a la sección</a>
      <section id="destino">Destino</section>
      <output data-testid="hash">{location.hash}</output>
    </>
  );
};

const renderPage = (href?: string) =>
  render(
    <MemoryRouter>
      <Page href={href} />
    </MemoryRouter>,
  );

const link = () => screen.getByRole('link', { name: 'Ir a la sección' });
const hash = () => screen.getByTestId('hash').textContent;
const scrollCalls = () => vi.mocked(window.scrollTo).mock.calls;
const lastTop = () => (scrollCalls().at(-1)?.[0] as ScrollToOptions | undefined)?.top;

const mediaList = (query: string, matches: boolean): MediaQueryList =>
  ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;

describe('useSmoothAnchors · desplazamiento suave', () => {
  beforeEach(() => {
    // Solo los fotogramas son falsos: la animación avanza cuando la prueba lo pide.
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    // jsdom no maqueta: la página mide 6000 px y la sección está a 1400 px.
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 6000 });
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: TARGET_TOP,
      top: TARGET_TOP,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      toJSON: () => ({}),
    } as DOMRect);
  });

  afterEach(() => {
    stopSmoothScroll();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('al pulsar un enlace interno la página viaja suave hasta la sección y la URL la refleja', async () => {
    const user = setupUser();
    renderPage();

    await user.click(link());

    expect(hash()).toBe('#destino');
    // Todavía no corrió ningún fotograma: nada se ha movido.
    expect(scrollCalls()).toHaveLength(0);

    vi.advanceTimersByTime(2000);

    // Varios pasos, no un salto, y el último deja la sección arriba del todo.
    expect(scrollCalls().length).toBeGreaterThan(3);
    expect(lastTop()).toBe(TARGET_TOP);
  });

  it('con Ctrl pulsado no se entromete: eso es "abrir aparte"', async () => {
    const user = setupUser();
    renderPage();

    await user.keyboard('{Control>}');
    await user.click(link());
    await user.keyboard('{/Control}');
    vi.advanceTimersByTime(2000);

    expect(scrollCalls()).toHaveLength(0);
    expect(hash()).toBe('');
  });

  it('si el destino no existe, deja el enlace seguir su curso', async () => {
    const user = setupUser();
    renderPage('#no-existe');

    await user.click(link());
    vi.advanceTimersByTime(2000);

    expect(scrollCalls()).toHaveLength(0);
    expect(hash()).toBe('');
  });

  it('con "reducir movimiento" salta directo al destino, en un solo paso', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) =>
      mediaList(query, query.includes('prefers-reduced-motion')),
    );
    const user = setupUser();
    renderPage();

    await user.click(link());
    vi.advanceTimersByTime(2000);

    expect(scrollCalls()).toHaveLength(1);
    expect(lastTop()).toBe(TARGET_TOP);
    expect(hash()).toBe('#destino');
  });

  it('un gesto a mitad de camino corta la animación y le deja el control a la persona', async () => {
    const user = setupUser();
    renderPage();

    await user.click(link());
    vi.advanceTimersByTime(100);
    const before = scrollCalls().length;
    expect(before).toBeGreaterThan(0);

    window.dispatchEvent(new Event('wheel'));
    vi.advanceTimersByTime(2000);

    expect(scrollCalls()).toHaveLength(before);
    expect(lastTop()).not.toBe(TARGET_TOP);
  });
});

describe('anclas de la landing', () => {
  // jsdom no trae IntersectionObserver y el contador de cupos lo usa al montarse.
  beforeEach(() =>
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    ),
  );

  afterEach(() => vi.unstubAllGlobals());

  it('cada enlace de la barra tiene su sección en la página', () => {
    renderAt(<LandingPage />);

    for (const { href } of SECTION_LINKS) {
      expect(document.getElementById(href.slice(1)), `falta la sección de ${href}`).toBeTruthy();
    }
  });

  it('la barra de escritorio y el menú móvil listan las mismas secciones, en el mismo orden', async () => {
    const user = setupUser();
    renderAt(<Header />);
    const hrefs = SECTION_LINKS.map((item) => item.href);

    const desktop = within(screen.getByRole('navigation', { name: 'Secciones' })).getAllByRole('link');
    expect(desktop.map((a) => a.getAttribute('href'))).toEqual([...hrefs, '/mis-dedicatorias']);

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    const mobile = within(screen.getByRole('navigation', { name: 'Menú' })).getAllByRole('link');
    expect(mobile.map((a) => a.getAttribute('href'))).toEqual([...hrefs, '/mis-dedicatorias', '#pricing']);
    expect(screen.getByRole('button', { name: 'Cerrar menú' }).getAttribute('aria-expanded')).toBe('true');
  });
});
