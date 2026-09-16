import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * El servicio de cupos, sin el doble global de `tests/setup.ts`.
 *
 * Existe porque ese doble dejaba el módulo real con cobertura cero, y ahí se escondía el
 * fallo que congelaba la cifra durante toda la sesión: la landing se remontaba, pedía de
 * nuevo y recibía una promesa cacheada con el número de la primera visita.
 */

vi.mock('../src/utils/api', () => ({ apiGet: vi.fn() }));

const load = async () => {
  const api = await import('../src/utils/api');
  const service = await vi.importActual<typeof import('../src/modules/promo/services/spots')>(
    '../src/modules/promo/services/spots',
  );
  return { apiGet: vi.mocked(api.apiGet), ...service };
};

const CUPOS = { total: 10000, taken: 1636, remaining: 8364 };

beforeEach(() => vi.resetAllMocks());

describe('servicio de cupos', () => {
  it('cada visita a la landing pregunta de nuevo: la cifra cambia con cada compra', async () => {
    const { apiGet, fetchSpots } = await load();
    apiGet.mockResolvedValueOnce(CUPOS);
    expect((await fetchSpots()).remaining).toBe(8364);

    // El usuario compra; el backend ya sirve una unidad menos.
    apiGet.mockResolvedValueOnce({ total: 10000, taken: 1637, remaining: 8363 });
    expect((await fetchSpots()).remaining).toBe(8363);
    expect(apiGet).toHaveBeenCalledTimes(2);
  });

  it('propaga el fallo de red para que quien pinta se quede con su respaldo', async () => {
    const { apiGet, fetchSpots } = await load();
    apiGet.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(fetchSpots()).rejects.toBeTruthy();
  });

  it('rechaza un cuerpo incompleto en vez de reventar al pintarlo', async () => {
    const { apiGet, fetchSpots } = await load();
    apiGet.mockResolvedValueOnce({} as never);
    await expect(fetchSpots()).rejects.toThrow(/no se pueden pintar/);
  });

  it('rechaza los tres ceros del contador sin fila: no es "agotado", es "no hay dato"', async () => {
    const { apiGet, fetchSpots } = await load();
    apiGet.mockResolvedValueOnce({ total: 0, taken: 0, remaining: 0 });
    await expect(fetchSpots()).rejects.toThrow(/no se pueden pintar/);
  });
});
