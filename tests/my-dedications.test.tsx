import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { ApiError, apiUrl } from '../src/utils/api';
import { publicQrPath } from '../src/modules/editor/services/letters';
import { listDedications } from '../src/modules/dedications/services/dedications';
import {
  DRAFT_EMPTY,
  DRAFT_STARTED,
  PUBLISHED,
  cards,
  gate,
  renderPanel,
} from './dedicationsHarness';
import { setupUser } from './testUtils';

/**
 * El panel: lo que devuelve `GET /api/v1/me/dedications` tiene que acabar en
 * tarjetas con las acciones de su estado, y cada forma de que no haya nada que
 * enseñar (vacío, caído, sin sesión) tiene que decirlo con palabras.
 */

vi.mock('../src/modules/dedications/services/dedications', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/dedications/services/dedications')>()),
  listDedications: vi.fn(),
  resendDelivery: vi.fn(),
}));

vi.mock('../src/modules/promo/services/checkout', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/promo/services/checkout')>()),
  login: vi.fn(),
  logout: vi.fn(),
}));

const SLUG = PUBLISHED.publicSlug ?? '';

beforeEach(() => {
  vi.mocked(listDedications).mockReset();
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
    expect(within(draft).queryByRole('button', { name: /QR|Reenviar/ })).toBeNull();

    // Publicada: ver, QR y reenviar; nunca retomar.
    expect(published.textContent).toContain('Publicada');
    expect(published.textContent).toContain('Para Ana');
    expect(published.textContent).toContain('Romántico Clásico');
    const view = within(published).getByRole('link', { name: /Ver carta/ });
    expect(view.getAttribute('href')).toBe(`/carta/${SLUG}`);
    expect(view.getAttribute('target')).toBe('_blank');
    expect(within(published).getByRole('button', { name: /QR/ })).toBeTruthy();
    expect(within(published).getByRole('button', { name: /Reenviar correo/ })).toBeTruthy();
    expect(within(published).queryByRole('link', { name: /Retomar/ })).toBeNull();
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

  it('"QR" abre el modal con la imagen pública por slug y el enlace para compartir', async () => {
    const user = setupUser();
    vi.mocked(listDedications).mockResolvedValue([PUBLISHED]);
    renderPanel();

    await user.click(await screen.findByRole('button', { name: /QR/ }));

    const dialog = await screen.findByRole('dialog', { name: /El QR de tu/i });
    const image = within(dialog).getByRole('img', { name: /Código QR de la carta/i });
    // Siempre el endpoint público por slug, nunca un qrUrl con sesión.
    expect(image.getAttribute('src')).toBe(apiUrl(publicQrPath(SLUG)));
    expect(dialog.querySelector(`a[href="${PUBLISHED.publicUrl}"]`)).not.toBeNull();

    await user.click(within(dialog).getByRole('button', { name: /Listo/ }));
    // Se destruye al cerrar, no se esconde.
    expect(screen.queryByRole('dialog')).toBeNull();
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
