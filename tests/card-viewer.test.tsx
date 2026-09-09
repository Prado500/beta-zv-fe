import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CardViewerPage from '../src/modules/viewer/page/CardViewerPage';
import { apiUrl } from '../src/utils/api';
import { installYouTubeMock, type YouTubeMock } from './youtubeMock';

/**
 * Visor público: lo que devuelve `GET /api/v1/public/letters/{slug}` tiene que
 * acabar en pantalla, y cualquier fallo tiene que decirlo con palabras.
 *
 * Se sustituye `fetch` y no el cliente de la API: así se prueba también que la
 * petición sale a la ruta pública correcta y que las fotos apuntan a la API.
 *
 * El cuerpo guardado lleva la firma y la canción como líneas finales, tal como
 * las escribe el editor. El visor tiene que sacarlas de ahí: antes las pintaba
 * como texto, firmaba "Alguien que te quiere" y la carta salía muda.
 */

const SLUG = 'ana-maria-x1';
const VIDEO_ID = 'dQw4w9WgXcQ';

const LETTER = {
  letterId: '11111111-2222-3333-4444-555555555555',
  publishedVersion: 1,
  title: 'Feliz Aniversario',
  recipientName: 'Ana María',
  body: `Gracias por cada día a tu lado, mi amor.\n\nDe parte de: Sebastián\n\nCanción: https://youtu.be/${VIDEO_ID}`,
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

let yt: YouTubeMock;

beforeEach(() => {
  yt = installYouTubeMock();
});

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

  it('firma con quien la envía y no pinta las marcas del cuerpo como texto', async () => {
    mockFetch(async () => json(200, LETTER));
    renderViewer();

    expect((await screen.findAllByText('Sebastián')).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Alguien que te quiere/)).toBeNull();
    expect(screen.queryByText(/De parte de:/)).toBeNull();
    expect(screen.queryByText(/Canción:/)).toBeNull();
    expect(document.body.textContent).not.toContain('youtu.be');
  });

  it('monta el reproductor con la canción que venía dentro del cuerpo', async () => {
    mockFetch(async () => json(200, LETTER));
    renderViewer();

    expect(await screen.findByLabelText('Canción de la dedicatoria')).toBeTruthy();
    await waitFor(() => expect(yt.players).toHaveLength(1));
    expect(yt.last().options.videoId).toBe(VIDEO_ID);
    expect(document.querySelector('iframe.hidden')).toBeNull();
  });

  it('una carta sin canción no monta reproductor', async () => {
    mockFetch(async () =>
      json(200, { ...LETTER, body: 'Gracias por cada día a tu lado, mi amor.\n\nDe parte de: Sebastián' }),
    );
    renderViewer();

    expect((await screen.findAllByText('Sebastián')).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText('Canción de la dedicatoria')).toBeNull();
    expect(yt.players).toHaveLength(0);
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
