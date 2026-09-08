import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CardViewerPage from '../src/modules/viewer/page/CardViewerPage';
import { apiUrl } from '../src/utils/api';

/**
 * Visor público: lo que devuelve `GET /api/v1/public/letters/{slug}` tiene que
 * acabar en pantalla, y cualquier fallo tiene que decirlo con palabras.
 *
 * Se sustituye `fetch` y no el cliente de la API: así se prueba también que la
 * petición sale a la ruta pública correcta y que las fotos apuntan a la API.
 */

const SLUG = 'ana-maria-x1';

const LETTER = {
  letterId: '11111111-2222-3333-4444-555555555555',
  publishedVersion: 1,
  title: 'Feliz Aniversario',
  recipientName: 'Ana María',
  body: 'Gracias por cada día a tu lado, mi amor.\n\nDe parte de: Sebastián',
  theme: 'pastel-pink',
  photos: [
    { position: 0, caption: 'uno', url: `/api/v1/public/letters/${SLUG}/photos/0` },
    { position: 1, caption: null, url: `/api/v1/public/letters/${SLUG}/photos/1` },
  ],
  publishedAt: '2026-09-08T00:00:00Z',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const mockFetch = (impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) => {
  const mock = vi.fn(impl);
  vi.stubGlobal('fetch', mock);
  return mock;
};

const renderViewer = (path = `/carta/${SLUG}`) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/carta/:slug" element={<CardViewerPage />} />
      </Routes>
    </MemoryRouter>,
  );

const notFound = () => screen.findByText(/No encontramos esta/i);

afterEach(() => vi.unstubAllGlobals());

describe('CardViewerPage', () => {
  it('con un 200 pinta título, destinatario, mensaje y fotos vía la API', async () => {
    const fetchMock = mockFetch(async () => json(200, LETTER));
    renderViewer();

    expect((await screen.findAllByText(LETTER.title)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(LETTER.recipientName).length).toBeGreaterThan(0);
    expect(screen.getByText(/Gracias por cada día a tu lado/)).toBeTruthy();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe(apiUrl(`/api/v1/public/letters/${SLUG}`));

    const photos = Array.from(document.querySelectorAll<HTMLImageElement>('img[alt^="Foto"]'));
    expect(photos.map((img) => img.getAttribute('src'))).toEqual(
      LETTER.photos.map((photo) => apiUrl(photo.url)),
    );
  });

  it('un 404 muestra que la carta no existe, sin pantalla en blanco', async () => {
    mockFetch(async () => json(404, { code: 'LETTER_NOT_FOUND', message: 'No existe.' }));
    renderViewer();
    expect(await notFound()).toBeTruthy();
  });

  it('sin red muestra el mismo aviso en vez de romper el componente', async () => {
    mockFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    renderViewer();
    expect(await notFound()).toBeTruthy();
  });

  it('sin slug en la ruta no llama a la API', () => {
    const fetchMock = mockFetch(async () => json(200, LETTER));
    render(
      <MemoryRouter>
        <CardViewerPage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/No encontramos esta/i)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('al salir de la página cancela la petición en vuelo', async () => {
    let signal: AbortSignal | null = null;
    mockFetch((_input, init) => {
      signal = init?.signal ?? null;
      return new Promise(() => undefined); // nunca responde
    });
    const { unmount } = renderViewer();
    await waitFor(() => expect(signal).not.toBeNull());

    unmount();

    expect((signal as AbortSignal | null)?.aborted).toBe(true);
  });
});
