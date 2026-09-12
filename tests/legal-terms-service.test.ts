import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet } from '../src/utils/api';
import { ApiError } from '../src/utils/api';
import { fetchTerms, forgetTerms } from '../src/modules/legal/services/legal';

/**
 * El texto legal se pide una sola vez por sesión de navegador.
 *
 * Es un invariante que no se ve desde la interfaz: el modal abre igual con caché que
 * sin ella. Se prueba aquí porque lo que protege son los IOPS del backend, y porque
 * una caché que guarda un fallo dejaría el alta bloqueada hasta recargar la página.
 */

vi.mock('../src/utils/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/utils/api')>()),
  apiGet: vi.fn(),
}));

const TERMS = {
  version: '2026-09-10',
  checksum: 'a'.repeat(64),
  content: '# Términos\n\nTexto de prueba.',
};

beforeEach(() => {
  forgetTerms();
  vi.mocked(apiGet).mockReset();
});

afterEach(() => {
  forgetTerms();
});

describe('servicio de términos', () => {
  it('camino feliz: devuelve el texto que sirve la API', async () => {
    vi.mocked(apiGet).mockResolvedValue(TERMS);

    await expect(fetchTerms()).resolves.toEqual(TERMS);
    expect(apiGet).toHaveBeenCalledWith('/api/v1/public/legal/terms');
  });

  it('dos lecturas seguidas gastan una sola petición', async () => {
    vi.mocked(apiGet).mockResolvedValue(TERMS);

    const [first, second] = await Promise.all([fetchTerms(), fetchTerms()]);

    expect(first).toBe(second);
    expect(apiGet).toHaveBeenCalledTimes(1);
  });

  it('y tampoco la gasta al volver a abrir el modal más tarde', async () => {
    vi.mocked(apiGet).mockResolvedValue(TERMS);

    await fetchTerms();
    await fetchTerms();

    expect(apiGet).toHaveBeenCalledTimes(1);
  });

  it('un fallo no envenena la caché: el siguiente intento vuelve a pedirlo', async () => {
    vi.mocked(apiGet)
      .mockRejectedValueOnce(new ApiError(503, 'UNAVAILABLE', 'caído'))
      .mockResolvedValueOnce(TERMS);

    await expect(fetchTerms()).rejects.toBeInstanceOf(ApiError);
    await expect(fetchTerms()).resolves.toEqual(TERMS);
    expect(apiGet).toHaveBeenCalledTimes(2);
  });

  it('el fallo se propaga tal cual para que la pantalla decida qué decir', async () => {
    const problem = new ApiError(503, 'UNAVAILABLE', 'caído');
    vi.mocked(apiGet).mockRejectedValue(problem);

    await expect(fetchTerms()).rejects.toBe(problem);
  });
});
