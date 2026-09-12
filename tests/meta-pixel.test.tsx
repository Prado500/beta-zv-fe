import { StrictMode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { MetaPixel } from '../src/components/analytics/MetaPixel';
import { META_PIXEL_ID } from '../src/config/analytics';
import { initMetaPixel } from '../src/utils/metaPixel';
import { setupUser } from './testUtils';

/**
 * Meta Pixel: lo que Meta recibe, no cómo está escrito el módulo.
 *
 * `fbevents.js` nunca carga en jsdom, así que el sustituto de `fbq` conserva
 * todas las llamadas en `queue`. Esa cola es exactamente lo que el script real
 * reenviaría a Meta: leerla es leer la métrica, no un detalle interno.
 */

/** Las llamadas que Meta habría recibido, en orden. */
const calls = (): unknown[][] => window.fbq?.queue ?? [];

const pageViews = (): unknown[][] =>
  calls().filter(([method, event]) => method === 'track' && event === 'PageView');

const script = (): HTMLScriptElement | null =>
  document.querySelector<HTMLScriptElement>('script[src*="connect.facebook.net"]');

/** Una landing con anclas y una segunda pantalla, como la app de verdad. */
const App = () => (
  <>
    <MetaPixel />
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

const renderApp = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  );

// El Pixel se reconoce a sí mismo por `window.fbq`; sin limpiarlo, la primera
// prueba dejaría arrancadas a todas las demás.
afterEach(() => {
  delete window.fbq;
  delete window._fbq;
  script()?.remove();
});

describe('Meta Pixel', () => {
  it('arranca el Pixel y cuenta la primera pantalla', () => {
    renderApp();

    expect(script()?.src).toBe('https://connect.facebook.net/en_US/fbevents.js');
    expect(calls()[0]).toEqual(['init', META_PIXEL_ID]);
    expect(pageViews()).toHaveLength(1);
  });

  it('cuenta una vista más cuando el usuario cambia de pantalla', async () => {
    const user = setupUser();
    renderApp();

    await user.click(screen.getByRole('link', { name: 'Ir al editor' }));

    expect(await screen.findByText('Editor')).toBeTruthy();
    expect(pageViews()).toHaveLength(2);
  });

  it('no cuenta dos veces la primera visita aunque React monte dos veces', () => {
    render(
      <StrictMode>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </StrictMode>,
    );

    expect(calls().filter(([method]) => method === 'init')).toHaveLength(1);
    expect(pageViews()).toHaveLength(1);
  });

  it('ignora las anclas de la landing: cambiar de sección no es cambiar de página', async () => {
    const user = setupUser();
    renderApp();

    await user.click(screen.getByRole('link', { name: 'Ver precios' }));

    expect(pageViews()).toHaveLength(1);
  });

  it('queda apagado si el entorno no configura identificador', () => {
    expect(initMetaPixel('')).toBe(false);
    expect(window.fbq).toBeUndefined();
    expect(script()).toBeNull();
  });

  it('no vuelve a inyectar el script ni a inicializar si ya estaba arrancado', () => {
    renderApp();

    expect(initMetaPixel()).toBe(true);

    expect(document.querySelectorAll('script[src*="connect.facebook.net"]')).toHaveLength(1);
    expect(calls().filter(([method]) => method === 'init')).toHaveLength(1);
  });
});
