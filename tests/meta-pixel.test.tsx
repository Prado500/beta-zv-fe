import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { MetaPixel } from '../src/components/analytics/MetaPixel';
import { CookieBanner } from '../src/components/ui/CookieBanner';
import { META_PIXEL_ID } from '../src/config/analytics';
import { initMetaPixel, trackMetaEvent, trackPageView } from '../src/utils/metaPixel';
import { writeConsent } from '../src/utils/consent';
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
  // La decisión de cookies vive en `localStorage`: sin borrarla, la primera
  // prueba que acepte dejaría el píxel encendido para todas las demás.
  window.localStorage.clear();
});

describe('Meta Pixel', () => {
  /*
   * El píxel no se enciende sin un "sí" expreso, así que lo que estas pruebas
   * miden —cuándo cuenta una pantalla y cuándo no— solo ocurre después de
   * aceptar. Que obedezca la decisión se prueba en el bloque siguiente.
   */
  beforeEach(() => writeConsent('granted'));

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

/**
 * El píxel frente a la decisión de cookies.
 *
 * Meta Pixel es tecnología no esencial: la Política de Privacidad publicada
 * dice, en su apartado 10, que «no se activará hasta que el usuario manifieste
 * su aceptación». Lo que se fija aquí es que eso sea verdad y no una promesa
 * escrita: sin un "sí" expreso no se descarga el script, no se pone ninguna
 * cookie y no sale ningún evento.
 */
describe('Meta Pixel y el consentimiento', () => {
  it('mientras no se ha preguntado, no hay píxel: ni script, ni fbq, ni eventos', () => {
    renderApp();

    expect(script()).toBeNull();
    expect(window.fbq).toBeUndefined();
    expect(pageViews()).toHaveLength(0);
  });

  it('con un "no" expreso, tampoco', async () => {
    writeConsent('denied');
    const user = setupUser();
    renderApp();

    // Ni siquiera navegando: rechazar no es "preguntar otra vez más tarde"
    await user.click(screen.getByRole('link', { name: 'Ir al editor' }));

    expect(await screen.findByText('Editor')).toBeTruthy();
    expect(script()).toBeNull();
    expect(pageViews()).toHaveLength(0);
  });

  it('al aceptar arranca en el acto y cuenta la pantalla en la que se aceptó', async () => {
    const user = setupUser();
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
        <CookieBanner />
      </MemoryRouter>,
    );

    expect(pageViews()).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    /*
     * Sin recargar. Si hubiera que esperar a la siguiente navegación, la visita
     * en la que se acepta —que es justo la que venía de un anuncio— se perdería
     * entera.
     */
    expect(script()).not.toBeNull();
    expect(calls()[0]).toEqual(['init', META_PIXEL_ID]);
    expect(pageViews()).toHaveLength(1);
  });

  it('la verja está en el módulo, no solo en el componente', () => {
    /*
     * Que la puerta viva en `utils/metaPixel` y no en quien lo llama es lo que
     * hace que no dependa de que cada pantalla se acuerde de preguntar. El día
     * que alguien mida una conversión desde otro sitio, sigue sin poder saltarse
     * la decisión.
     */
    expect(initMetaPixel()).toBe(false);
    expect(window.fbq).toBeUndefined();
    expect(script()).toBeNull();
  });

  it('ningún evento sale por la puerta de atrás', () => {
    /*
     * Con el píxel YA arrancado, que es el caso difícil: `fbq` existe y las
     * llamadas tendrían dónde ir. Si la guarda estuviera solo en el arranque,
     * esto pasaría igual sin proteger nada.
     */
    writeConsent('granted');
    initMetaPixel();
    const antes = calls().length;

    writeConsent('denied');
    trackPageView();
    trackMetaEvent('Purchase', { value: 50000, currency: 'COP' });

    expect(calls()).toHaveLength(antes);
  });

  it('el aviso deja de preguntar una vez decidido, y la decisión sobrevive al remontaje', () => {
    writeConsent('granted');
    const { unmount } = renderApp();

    expect(pageViews()).toHaveLength(1);
    unmount();
    delete window.fbq;
    delete window._fbq;
    script()?.remove();

    // Segunda visita: ya no se pregunta y el píxel arranca solo
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
        <CookieBanner />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('dialog', { name: 'Aviso de cookies' })).toBeNull();
    expect(pageViews()).toHaveLength(1);
  });
});
