import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet, apiPost, apiUrl } from '../src/utils/api';
import {
  fetchPublishedLetter,
  listDedications,
  resendDelivery,
  viewerPathFor,
} from '../src/modules/dedications/services/dedications';
import { logout } from '../src/modules/auth/services/auth';

/**
 * Servicios del panel: que cada función hable con la ruta correcta y con el
 * cuerpo correcto, y que no interprete lo que no le toca.
 */

vi.mock('../src/utils/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/utils/api')>()),
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

const LETTER_ID = '0e7a5c33-2b1f-4d9a-8e6c-5f4a3b2c1d0e';
const SLUG = 'Qx9_2mV0aP3kLd8w';

beforeEach(() => {
  vi.mocked(apiGet).mockReset();
  vi.mocked(apiPost).mockReset();
});

describe('servicios de "Mis dedicatorias"', () => {
  it('listDedications pide el listado del panel con la señal de cancelación', async () => {
    const { signal } = new AbortController();
    vi.mocked(apiGet).mockResolvedValue([]);

    expect(await listDedications(signal)).toEqual([]);
    expect(apiGet).toHaveBeenCalledWith('/api/v1/me/dedications', signal);
  });

  it('resendDelivery sin correo manda un cuerpo vacío: el backend usa la dirección guardada', async () => {
    vi.mocked(apiPost).mockResolvedValue({ status: 'sent' });

    await resendDelivery(LETTER_ID);

    expect(apiPost).toHaveBeenCalledWith(`/api/v1/letters/${LETTER_ID}/deliveries`, {});
  });

  it('resendDelivery con correo lo manda como recipientEmail', async () => {
    vi.mocked(apiPost).mockResolvedValue({ status: 'sent' });

    await resendDelivery(LETTER_ID, 'otra@ejemplo.com');

    expect(apiPost).toHaveBeenCalledWith(`/api/v1/letters/${LETTER_ID}/deliveries`, {
      recipientEmail: 'otra@ejemplo.com',
    });
  });

  it('resendDelivery devuelve el acuse sin interpretarlo: el veredicto va en status', async () => {
    vi.mocked(apiPost).mockResolvedValue({ status: 'failed', lastError: 'SMTPException' });

    expect(await resendDelivery(LETTER_ID)).toMatchObject({ status: 'failed' });
  });

  it('fetchPublishedLetter pide la carta pública por slug y la traduce con firma, canción y fotos por la ruta pública', async () => {
    const { signal } = new AbortController();
    vi.mocked(apiGet).mockResolvedValue({
      letterId: LETTER_ID,
      publishedVersion: 1,
      title: 'Para ti',
      recipientName: 'Ana',
      body: 'Eres mi lugar favorito.\n\nDe parte de: Sebastián\n\nCanción: https://youtu.be/dQw4w9WgXcQ',
      theme: 'pastel-pink',
      photos: [{ position: 0, caption: 'uno.jpg', url: `/api/v1/public/letters/${SLUG}/photos/0` }],
      publishedAt: '2026-09-07T18:09:12.774Z',
    });

    const letter = await fetchPublishedLetter(SLUG, signal);

    // Sin sesión y sin CSRF: es el mismo endpoint que abre el visor.
    expect(apiGet).toHaveBeenCalledWith(`/api/v1/public/letters/${SLUG}`, signal);
    expect(letter).toEqual({
      title: 'Para ti',
      recipient: 'Ana',
      recipientEmail: '',
      sender: 'Sebastián',
      message: 'Eres mi lugar favorito.',
      songUrl: 'https://youtu.be/dQw4w9WgXcQ',
      themeId: 'pastelPink',
      photos: [
        {
          tempId: null,
          previewUrl: apiUrl(`/api/v1/public/letters/${SLUG}/photos/0`),
          fileName: 'uno.jpg',
          status: 'ready',
        },
      ],
    });
  });

  it('viewerPathFor apunta al visor interno con el slug codificado', () => {
    expect(viewerPathFor(SLUG)).toBe(`/carta/${SLUG}`);
    expect(viewerPathFor('con espacio')).toBe('/carta/con%20espacio');
  });

  it('logout cierra la sesión con un POST: lleva CSRF como toda escritura', async () => {
    vi.mocked(apiPost).mockResolvedValue({ message: 'Sesión cerrada.' });

    expect(await logout()).toEqual({ message: 'Sesión cerrada.' });
    expect(apiPost).toHaveBeenCalledWith('/api/v1/auth/logout');
  });
});
