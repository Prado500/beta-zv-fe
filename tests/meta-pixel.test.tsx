import { StrictMode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { CookieBanner } from '../src/components/ui/CookieBanner';
import { META_PIXEL_ID } from '../src/config/analytics';
import { usePixelPageViews } from '../src/hooks/usePixelPageViews';
import { writeConsent } from '../src/utils/consent';
import { setupUser } from './testUtils';

/**
 * Meta Pixel: lo que Meta recibe, no cómo está escrito el módulo.
 *
 * `fbevents.js` nunca carga en jsdom, así que el sustituto de `fbq` conserva
 * todas las llamadas en `queue`. Esa cola es exactamente lo que el script real
 * reenviaría a Meta: leerla es leer la métrica, no un detalle interno.
 *
 * Los eventos de conversión —`ViewContent`, `InitiateCheckout`, `Purchase`— y
 * el formato de su carga viven en `pixel.test.ts`. Aquí solo las visitas.
 */

/** Las llamadas que Meta habría recibido, en orden. */
const calls = (): unknown[][] => window.fbq?.queue ?? [];

const pageViews = (): unknown[][] =>
  calls().filter(([method, event]) => method === 'track' && event === 'PageView');

const script = (): HTMLScriptElement | null =>
  document.querySelector<HTMLScriptElement>('script[src*="connect.facebook.net"]');

/** El píxel colgado del router, que es como vive en `App`. */
const PixelPageViews = () => {
  usePixelPageViews();
  return null;
};

/** Una landing con anclas y una segunda pantalla, como la app de verdad. */
const App = () => (
  <>
    <PixelPageViews />
    <CookieBanner />
    <Routes>
      <Route
        path="/"
        element={
          <>
            <Link to="/editor">Ir al editor</Link>
            <Link to="/#precio">Ver precios</Link>
          </>
        }
      />
      <Route path="/editor" element={<p>Editor</p>} />
    </Routes>
  </>
);

const renderApp = (wrapper: (children: React.ReactNode) => React.ReactElement = (c) => <>{c}</>) =>
  render(wrapper(<MemoryRouter initialEntries={['/']}>{<App />}</MemoryRouter>));

/** Con el permiso ya dado en una visita anterior: el caso normal de quien vuelve. */
const conCookiesAceptadas = () => {
  writeConsent('granted');
};

// El píxel se reconoce a sí mismo por `window.fbq`; sin limpiarlo, la primera
// prueba dejaría arrancadas a todas las demás.
afterEach(() => {
  delete window.fbq;
  delete window._fbq;
  script()?.remove();
});

describe('Meta Pixel', () => {
  it('arranca el Pixel y cuenta la primera pantalla', () => {
    conCookiesAceptadas();

    renderApp();

    expect(script()?.src).toBe('https://connect.facebook.net/en_US/fbevents.js');
    expect(calls()[0]).toEqual(['init', META_PIXEL_ID]);
    expect(pageViews()).toHaveLength(1);
  });

  it('cuenta una vista más cuando el usuario cambia de pantalla', async () => {
    const user = setupUser();
    conCookiesAceptadas();
    renderApp();

    await user.click(screen.getByRole('link', { name: 'Ir al editor' }));

    expect(await screen.findByText('Editor')).toBeTruthy();
    expect(pageViews()).toHaveLength(2);
  });

  it('no cuenta dos veces la primera visita aunque React monte dos veces', () => {
    conCookiesAceptadas();

    renderApp((children) => <StrictMode>{children}</StrictMode>);

    expect(calls().filter(([method]) => method === 'init')).toHaveLength(1);
    expect(pageViews()).toHaveLength(1);
  });

  it('ignora las anclas de la landing: cambiar de sección no es cambiar de página', async () => {
    const user = setupUser();
    conCookiesAceptadas();
    renderApp();

    await user.click(screen.getByRole('link', { name: 'Ver precios' }));

    expect(pageViews()).toHaveLength(1);
  });

  it('queda apagado mientras no se aceptan las cookies', () => {
    // Sin decidir nada: ni script, ni cola, ni visitas.
    renderApp();

    expect(script()).toBeNull();
    expect(window.fbq).toBeUndefined();
  });

  it('arranca en cuanto se acepta, y esa misma pantalla ya cuenta', async () => {
    const user = setupUser();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    /*
     * La visita en la que se acepta es la que hay que contar. Si hubiera que
     * esperar a la siguiente página, se perdería justo la que dio el permiso.
     */
    expect(script()).not.toBeNull();
    expect(calls()[0]).toEqual(['init', META_PIXEL_ID]);
    expect(pageViews()).toHaveLength(1);
  });

  it('no vuelve a inyectar el script ni a inicializar al cambiar de pantalla', async () => {
    const user = setupUser();
    conCookiesAceptadas();
    renderApp();

    await user.click(screen.getByRole('link', { name: 'Ir al editor' }));
    expect(await screen.findByText('Editor')).toBeTruthy();

    expect(document.querySelectorAll('script[src*="connect.facebook.net"]')).toHaveLength(1);
    expect(calls().filter(([method]) => method === 'init')).toHaveLength(1);
  });
});
