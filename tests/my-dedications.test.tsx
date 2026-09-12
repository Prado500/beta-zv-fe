import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { ApiError, apiUrl } from '../src/utils/api';
import { listDedications, type Dedication } from '../src/modules/dedications/services/dedications';
import { fetchPublicLetter, type PublicLetter } from '../src/modules/viewer/services/publicLetters';
import { downloadCardHtml } from '../src/utils/export';
import { DEFAULT_NOTE } from '../src/utils/qrCard';
import {
  DRAFT_EMPTY,
  DRAFT_STARTED,
  PUBLISHED,
  cards,
  gate,
  renderPanel,
} from './dedicationsHarness';
import { asButton, deferred, setupUser } from './testUtils';

/**
 * El panel: lo que devuelve `GET /api/v1/me/dedications` tiene que acabar en
 * tarjetas con las acciones de su estado, y cada forma de que no haya nada que
 * enseñar (vacío, caído, sin sesión) tiene que decirlo con palabras.
 *
 * La postal del QR y el archivo HTML salen con la carta de verdad —firma,
 * primera frase, canción y fotos—, que el listado no trae: se pide por slug al
 * abrir la postal o al pulsar la descarga, y nunca antes.
 */

vi.mock('../src/modules/dedications/services/dedications', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/dedications/services/dedications')>()),
  listDedications: vi.fn(),
  resendDelivery: vi.fn(),
}));

vi.mock('../src/modules/auth/services/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/auth/services/auth')>()),
  login: vi.fn(),
  logout: vi.fn(),
}));

// La carta entera llega por el visor público: es la frontera con la red que se simula.
vi.mock('../src/modules/viewer/services/publicLetters', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/viewer/services/publicLetters')>()),
  fetchPublicLetter: vi.fn(),
}));

// jsdom no implementa canvas: se captura qué código se dibuja, no el trazado.
vi.mock('qrcode.react', () => ({
  QRCodeCanvas: ({ value }: { value: string }) => (
    <canvas data-testid="qr-canvas" data-value={value} />
  ),
}));

// El exportador se prueba aparte; aquí importa con qué carta se le llama.
vi.mock('../src/utils/export', () => ({ downloadCardHtml: vi.fn() }));

const SLUG = PUBLISHED.publicSlug ?? '';

/** La carta pública de PUBLISHED, con firma y canción dentro del cuerpo, como las guarda el backend. */
const LETTER: PublicLetter = {
  letterId: PUBLISHED.letterId ?? '',
  publishedVersion: 1,
  title: PUBLISHED.title ?? '',
  recipientName: 'Ana',
  body: 'Eres mi lugar favorito. Gracias por cada día.\n\nDe parte de: Sebastián\n\nCanción: https://youtu.be/dQw4w9WgXcQ',
  theme: 'classic',
  photos: [{ position: 0, caption: 'uno.jpg', url: `/api/v1/public/letters/${SLUG}/photos/0` }],
  publishedAt: PUBLISHED.publishedAt ?? '',
};

const PUBLISHED_B: Dedication = {
  ...PUBLISHED,
  purchaseId: 'c3e0f5b2-8a41-4f7d-b6c9-0d1e2f3a4b5c',
  letterId: '1f8b6d44-3c2a-4e0b-9f7d-6a5b4c3d2e1f',
  title: 'Nuestra estrella',
  recipientName: 'Lucía',
  theme: 'starry',
  publicSlug: 'Zt4_8kQ1bR7mNc2y',
  publicUrl: 'https://brave-sky-0fa9ccf0f.6.azurestaticapps.net/carta/Zt4_8kQ1bR7mNc2y',
};

const LETTER_B: PublicLetter = {
  ...LETTER,
  letterId: PUBLISHED_B.letterId ?? '',
  title: 'Nuestra estrella',
  recipientName: 'Lucía',
  body: 'Eres la estrella que me guía.\n\nDe parte de: Carlos',
  theme: 'starry',
  photos: [],
};

const qrDialog = () => screen.findByRole('dialog', { name: /El QR de tu/i });
const postcard = (scope: HTMLElement) => within(scope).findByTestId('qr-canvas');
const htmlButton = (scope: HTMLElement) => within(scope).getByRole('button', { name: /Carta HTML/ });

beforeEach(() => {
  vi.mocked(listDedications).mockReset();
  vi.mocked(fetchPublicLetter).mockReset();
  vi.mocked(downloadCardHtml).mockReset();
  vi.mocked(downloadCardHtml).mockResolvedValue(undefined);
});

describe('MyDedicationsPage', () => {
  it('pinta cada fila con la insignia y las acciones de su estado', async () => {
    vi.mocked(listDedications).mockResolvedValue([DRAFT_EMPTY, PUBLISHED]);
    renderPanel();

    const [draft, published] = await screen.findAllByRole('article');
    expect(cards()).toHaveLength(2);

    // Borrador: solo se puede retomar.
    expect(draft.textContent).toContain('Borrador');
    expect(within(draft).getByRole('link', { name: /Retomar edición/ })).toBeTruthy();
    expect(within(draft).queryByRole('link', { name: /Ver carta/ })).toBeNull();
    expect(within(draft).queryByRole('button', { name: /QR|HTML|Reenviar/ })).toBeNull();

    // Publicada: ver, postal, archivo y reenviar; nunca retomar.
    expect(published.textContent).toContain('Publicada');
    expect(published.textContent).toContain('Para Ana');
    expect(published.textContent).toContain('Romántico Clásico');
    const view = within(published).getByRole('link', { name: /Ver carta/ });
    expect(view.getAttribute('href')).toBe(`/carta/${SLUG}`);
    expect(view.getAttribute('target')).toBe('_blank');
    expect(within(published).getByRole('button', { name: /Postal QR/ })).toBeTruthy();
    expect(within(published).getByRole('button', { name: /Carta HTML/ })).toBeTruthy();
    expect(within(published).getByRole('button', { name: /Reenviar correo/ })).toBeTruthy();
    expect(within(published).queryByRole('link', { name: /Retomar/ })).toBeNull();
    // Pintar la tarjeta no pide la carta: eso ocurre solo al pulsar.
    expect(fetchPublicLetter).not.toHaveBeenCalled();
  });

  it('una compra pagada sin carta se pinta sin reventar por los nulos', async () => {
    vi.mocked(listDedications).mockResolvedValue([DRAFT_EMPTY]);
    renderPanel();

    const [draft] = await screen.findAllByRole('article');
    expect(draft.textContent).toContain('Carta sin empezar');
    expect(draft.textContent).toContain('Pagaste, pero todavía no escribiste la carta');
    expect(draft.textContent).toContain('septiembre de 2026');
    expect(draft.textContent).not.toContain('null');
  });

  it('un borrador con carta empezada avisa de que retomar es empezar de cero', async () => {
    vi.mocked(listDedications).mockResolvedValue([DRAFT_STARTED]);
    renderPanel();

    const [draft] = await screen.findAllByRole('article');
    expect(draft.textContent).toContain('Casi lista');
    expect(draft.textContent).toContain('Para Lucía');
    expect(draft.textContent).toContain('Noche Estrellada');
    expect(draft.textContent).toContain('empiezas de cero');
    expect(within(draft).getByRole('link', { name: /Retomar edición/ })).toBeTruthy();
  });

  it('"Retomar edición" abre el editor con el purchaseId en el estado de la ruta', async () => {
    const user = setupUser();
    vi.mocked(listDedications).mockResolvedValue([DRAFT_EMPTY]);
    renderPanel();

    await user.click(await screen.findByRole('link', { name: /Retomar edición/ }));

    expect(await screen.findByText(`EDITOR:${DRAFT_EMPTY.purchaseId}`)).toBeTruthy();
    // La llave viaja en la navegación, no se deja en el almacenamiento.
    expect(window.sessionStorage.getItem('checkout:purchaseId')).toBeNull();
  });

  it('lista vacía: lo dice e invita a comprar la primera', async () => {
    vi.mocked(listDedications).mockResolvedValue([]);
    renderPanel();

    expect(await screen.findByText(/Todavía no tienes/)).toBeTruthy();
    const cta = screen.getByRole('link', { name: /Crear mi primera dedicatoria/ });
    expect(cta.getAttribute('href')).toBe('/#pricing');
    expect(cards()).toHaveLength(0);
    expect(gate()).toBeNull();
  });

  it('si la API falla, lo explica y "Reintentar" vuelve a pedir el listado', async () => {
    const user = setupUser();
    vi.mocked(listDedications)
      .mockRejectedValueOnce(new ApiError(503, 'SERVICE_UNAVAILABLE', 'Caído.'))
      .mockResolvedValue([PUBLISHED]);
    renderPanel();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('no está disponible');
    expect(cards()).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: /Reintentar/ }));

    await waitFor(() => expect(cards()).toHaveLength(1));
    expect(listDedications).toHaveBeenCalledTimes(2);
  });

  it('"Postal QR" abre la postal de la carta: el código apunta al enlace público y lleva los nombres y la primera frase', async () => {
    const user = setupUser();
    vi.mocked(listDedications).mockResolvedValue([PUBLISHED]);
    vi.mocked(fetchPublicLetter).mockResolvedValue(LETTER);
    renderPanel();

    await user.click(await screen.findByRole('button', { name: /Postal QR/ }));

    const dialog = await qrDialog();
    const canvas = await postcard(dialog);
    expect(canvas.getAttribute('data-value')).toBe(PUBLISHED.publicUrl);
    // La carta se pidió por su slug, sin sesión.
    expect(fetchPublicLetter).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetchPublicLetter).mock.calls[0][0]).toBe(SLUG);
    // Nombres y nota de la carta de verdad, no los de respaldo de la postal.
    expect(dialog.textContent).toContain('Ana');
    expect(dialog.textContent).toContain('Sebastián');
    expect(dialog.textContent).toContain('Eres mi lugar favorito');
    // Ya no hay imagen del servidor en blanco y negro; el enlace sigue a la vista.
    expect(within(dialog).queryByRole('img', { name: /Código QR/i })).toBeNull();
    expect(dialog.querySelector(`a[href="${PUBLISHED.publicUrl}"]`)).not.toBeNull();

    await user.click(within(dialog).getByRole('button', { name: /Listo/ }));
    // Se destruye al cerrar, no se esconde.
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('si la carta pública no carga, la postal sale con lo que el listado sabe y se puede descargar igual', async () => {
    const user = setupUser();
    vi.mocked(listDedications).mockResolvedValue([PUBLISHED]);
    vi.mocked(fetchPublicLetter).mockRejectedValue(
      new ApiError(404, 'LETTER_NOT_FOUND', 'No existe.'),
    );
    renderPanel();

    await user.click(await screen.findByRole('button', { name: /Postal QR/ }));

    const dialog = await qrDialog();
    const canvas = await postcard(dialog);
    expect(canvas.getAttribute('data-value')).toBe(PUBLISHED.publicUrl);
    expect(dialog.textContent).toContain('Ana');
    // Sin firma ni mensaje, la postal usa sus respaldos: nunca un hueco ni un "null".
    expect(dialog.textContent).toContain('Alguien que te quiere');
    expect(dialog.textContent).toContain(DEFAULT_NOTE);
    expect(dialog.textContent).not.toContain('null');
    expect(
      asButton(within(dialog).getByRole('button', { name: /Descargar postal QR/ })).disabled,
    ).toBe(false);
  });

  it('abrir la carta A, cerrar y abrir la B pinta la B con sus datos y cancela la petición de A', async () => {
    const user = setupUser();
    vi.mocked(listDedications).mockResolvedValue([PUBLISHED, PUBLISHED_B]);
    // La carta A se queda en vuelo: lo que se comprueba es que nada suyo llegue a la B.
    vi.mocked(fetchPublicLetter)
      .mockReturnValueOnce(new Promise<PublicLetter>(() => undefined))
      .mockResolvedValueOnce(LETTER_B);
    renderPanel();

    const [first, second] = await screen.findAllByRole('article');
    await user.click(within(first).getByRole('button', { name: /Postal QR/ }));

    let dialog = await qrDialog();
    expect(within(dialog).getByRole('status').textContent).toContain('Preparando tu postal');
    // Mientras no hay postal, no hay nada que descargar.
    expect(
      asButton(within(dialog).getByRole('button', { name: /Descargar postal QR/ })).disabled,
    ).toBe(true);
    const signalA = vi.mocked(fetchPublicLetter).mock.calls[0][1];
    expect(signalA?.aborted).toBe(false);

    await user.click(within(dialog).getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(signalA?.aborted).toBe(true);

    await user.click(within(second).getByRole('button', { name: /Postal QR/ }));
    dialog = await qrDialog();
    const canvas = await postcard(dialog);
    expect(canvas.getAttribute('data-value')).toBe(PUBLISHED_B.publicUrl);
    expect(vi.mocked(fetchPublicLetter).mock.calls[1][0]).toBe(PUBLISHED_B.publicSlug);
    expect(dialog.textContent).toContain('Lucía');
    expect(dialog.textContent).toContain('Carlos');
    expect(dialog.textContent).toContain('Eres la estrella que me guía');
    expect(dialog.textContent).not.toContain('Sebastián');
  });

  it('"Carta HTML" pide la carta por slug y compone el archivo con firma, canción y fotos por la ruta pública', async () => {
    const user = setupUser();
    vi.mocked(listDedications).mockResolvedValue([PUBLISHED]);
    vi.mocked(fetchPublicLetter).mockResolvedValue(LETTER);
    renderPanel();

    const [card] = await screen.findAllByRole('article');
    await user.click(htmlButton(card));

    await waitFor(() => expect(downloadCardHtml).toHaveBeenCalledTimes(1));
    expect(vi.mocked(fetchPublicLetter).mock.calls[0][0]).toBe(SLUG);
    expect(downloadCardHtml).toHaveBeenCalledWith({
      title: PUBLISHED.title,
      recipient: 'Ana',
      recipientEmail: '',
      sender: 'Sebastián',
      message: 'Eres mi lugar favorito. Gracias por cada día.',
      songUrl: 'https://youtu.be/dQw4w9WgXcQ',
      themeId: 'classic',
      photos: [
        {
          tempId: null,
          previewUrl: apiUrl(LETTER.photos[0].url),
          fileName: 'uno.jpg',
          status: 'ready',
        },
      ],
    });
    // La descarga sale de la tarjeta: no se abre ningún modal.
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(asButton(htmlButton(card)).disabled).toBe(false));
  });

  it('un doble clic en "Carta HTML" pide la carta y compone el archivo una sola vez', async () => {
    const user = setupUser();
    vi.mocked(listDedications).mockResolvedValue([PUBLISHED]);
    const pending = deferred<PublicLetter>();
    vi.mocked(fetchPublicLetter).mockReturnValue(pending.promise);
    renderPanel();

    const [card] = await screen.findAllByRole('article');
    await user.dblClick(htmlButton(card));

    // Ocupado y deshabilitado mientras la carta viaja.
    const generating = within(card).getByRole('button', { name: /Generando/ });
    expect(asButton(generating).disabled).toBe(true);
    pending.resolve(LETTER);

    await waitFor(() => expect(downloadCardHtml).toHaveBeenCalledTimes(1));
    expect(fetchPublicLetter).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(asButton(htmlButton(card)).disabled).toBe(false));
  });

  it('si la API falla al pedir la carta, "Carta HTML" lo dice en la tarjeta y vuelve a quedar libre', async () => {
    const user = setupUser();
    vi.mocked(listDedications).mockResolvedValue([PUBLISHED]);
    vi.mocked(fetchPublicLetter).mockRejectedValue(
      new ApiError(503, 'SERVICE_UNAVAILABLE', 'Caído.'),
    );
    renderPanel();

    const [card] = await screen.findAllByRole('article');
    await user.click(htmlButton(card));

    const alert = await within(card).findByRole('alert');
    expect(alert.textContent).toContain('No pudimos generar el archivo');
    expect(downloadCardHtml).not.toHaveBeenCalled();
    await waitFor(() => expect(asButton(htmlButton(card)).disabled).toBe(false));
  });

  it('"Descargar postal QR" pasa por el manejador de la postal, sin duplicar su botón interno', async () => {
    const user = setupUser();
    vi.mocked(listDedications).mockResolvedValue([PUBLISHED]);
    vi.mocked(fetchPublicLetter).mockResolvedValue(LETTER);
    renderPanel();

    await user.click(await screen.findByRole('button', { name: /Postal QR/ }));
    const dialog = await qrDialog();
    await postcard(dialog);

    const buttons = within(dialog).getAllByRole('button', { name: /Descargar postal QR/ });
    expect(buttons).toHaveLength(1);
    await user.click(buttons[0]);

    await waitFor(() =>
      expect(
        asButton(within(dialog).getByRole('button', { name: /Descargar postal QR|Generando/ }))
          .disabled,
      ).toBe(false),
    );
    expect(within(dialog).queryByRole('alert')).toBeNull();
  });

  it('cancela la petición en vuelo al salir de la página', async () => {
    vi.mocked(listDedications).mockReturnValue(new Promise(() => undefined));
    const { unmount } = renderPanel();

    await waitFor(() => expect(listDedications).toHaveBeenCalledTimes(1));
    const signal = vi.mocked(listDedications).mock.calls[0][0];
    expect(signal?.aborted).toBe(false);

    unmount();

    expect(signal?.aborted).toBe(true);
  });
});
