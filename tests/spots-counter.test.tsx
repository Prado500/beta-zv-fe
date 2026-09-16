import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import LandingPage from '../src/modules/promo/page/LandingPage';
import { ApiError } from '../src/utils/api';
import { fetchSpots, type Spots } from '../src/modules/promo/services/spots';
import { deferred, renderAt } from './testUtils';

/**
 * El contador de cupos, ya conectado al backend.
 *
 * Lo que se prueba aquí no es el número: es que la landing enseñe **siempre** uno
 * plausible. Esta cifra sostiene todo el mensaje de escasez, así que un hueco, un cero
 * de carga o un `NaN` hacen más daño que un dato con unos segundos de retraso.
 */

const asked = vi.mocked(fetchSpots);

/** La cifra escrita en `config/campaign.ts`, que es la que se pinta sin respuesta. */
const FALLBACK_REMAINING = '8.364';

const renderLanding = () => renderAt(<LandingPage />);

beforeEach(() => {
  // El medidor se llena con una animación que arranca al entrar en pantalla. Aquí se
  // pide "reducir movimiento", que es un camino real del componente y lo pinta completo
  // de una vez: así se mide la cifra final y no un fotograma intermedio del recorrido.
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }));
  // jsdom no lo trae, y otras secciones de la landing lo usan al montarse.
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
});

/** El medidor, localizado por su barra de progreso. */
const meter = () => screen.getByRole('progressbar');

describe('contador de cupos', () => {
  it('pinta la cifra que sirve el backend, no la escrita a mano', async () => {
    asked.mockResolvedValue({ total: 10000, taken: 2500, remaining: 7500 });
    renderLanding();

    // La barra superior, en sus dos versiones (móvil y escritorio).
    await waitFor(() => {
      expect(screen.getByText(/Quedan 7\.500 cupos/)).toBeTruthy();
    });
    expect(screen.getByText(/Solo quedan 7\.500 unidades disponibles/)).toBeTruthy();

    // Y el medidor, que además dice cuántos se llevan tomados.
    await waitFor(() => {
      expect(meter().getAttribute('aria-valuenow')).toBe('2500');
    });
    expect(meter().getAttribute('aria-valuemax')).toBe('10000');
    expect(screen.getByText('7.500')).toBeTruthy();
    expect(screen.getByText('2.500')).toBeTruthy();
  });

  it('si la red falla, se queda el respaldo y la landing no se rompe', async () => {
    asked.mockRejectedValue(new TypeError('Failed to fetch'));
    renderLanding();

    expect(screen.getByText(new RegExp(`Quedan ${FALLBACK_REMAINING} cupos`))).toBeTruthy();
    // Y sigue ahí después de que el rechazo se haya procesado: no hay estado de error.
    await waitFor(() => expect(asked).toHaveBeenCalled());
    expect(screen.getByText(new RegExp(`Quedan ${FALLBACK_REMAINING} cupos`))).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('un 503 del backend se degrada igual que un corte de red', async () => {
    asked.mockRejectedValue(
      new ApiError(503, 'SERVICE_UNAVAILABLE', 'No disponible'),
    );
    renderLanding();

    await waitFor(() => expect(asked).toHaveBeenCalled());
    expect(screen.getByText(new RegExp(`Quedan ${FALLBACK_REMAINING} cupos`))).toBeTruthy();
    expect(meter().getAttribute('aria-valuemax')).toBe('10000');
  });

  it('los tres sitios que pintan la cifra gastan una sola petición', async () => {
    asked.mockResolvedValue({ total: 10000, taken: 2500, remaining: 7500 });
    renderLanding();

    // La barra, el medidor y la prosa de la sección leen del mismo proveedor.
    await waitFor(() => expect(screen.getByText(/Quedan 7\.500 cupos/)).toBeTruthy());
    expect(asked).toHaveBeenCalledTimes(1);
  });

  it('el respaldo se ve desde el primer fotograma, sin espera ni hueco', async () => {
    const pending = deferred<Spots>();
    asked.mockReturnValue(pending.promise);
    renderLanding();

    // Antes de que la API conteste ya hay un número en pantalla.
    expect(screen.getByText(new RegExp(`Quedan ${FALLBACK_REMAINING} cupos`))).toBeTruthy();
    expect(meter().getAttribute('aria-valuenow')).toBe('1636');

    pending.resolve({ total: 10000, taken: 2500, remaining: 7500 });

    await waitFor(() => {
      expect(screen.getByText(/Quedan 7\.500 cupos/)).toBeTruthy();
    });
  });

  it('agotado se dice con un cero, nunca con un número negativo', async () => {
    // Sobreventa: el backend ya recorta `remaining` a 0, y `taken` puede pasar del total.
    asked.mockResolvedValue({ total: 10000, taken: 10000, remaining: 0 });
    renderLanding();

    await waitFor(() => expect(screen.getByText(/Quedan 0 cupos/)).toBeTruthy());
    const bar = meter();
    expect(Number(bar.getAttribute('aria-valuenow'))).toBeLessThanOrEqual(
      Number(bar.getAttribute('aria-valuemax')),
    );
    expect(within(bar.parentElement as HTMLElement).queryByText(/-/)).toBeNull();
  });
});
