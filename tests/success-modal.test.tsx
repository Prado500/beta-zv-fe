import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SuccessModal } from '../src/modules/editor/components/SuccessModal';
import { downloadCardHtml } from '../src/utils/export';
import type { DedicationForm } from '../src/modules/editor/types';
import { setupUser } from './testUtils';

/**
 * Modal de éxito: la estructura acordada —título, enlace, acuse del correo y
 * "Entregarla en mano"—, la postal con el tema de la carta, y las dos
 * descargas que se componen en el navegador sin tocar el backend.
 */

// jsdom no implementa canvas; lo que se comprueba es qué QR se dibuja, no el trazado.
vi.mock('qrcode.react', () => ({
  QRCodeCanvas: ({ value }: { value: string }) => (
    <canvas data-testid="qr-canvas" data-value={value} />
  ),
}));

// El exportador se prueba aparte; aquí solo importa que el botón lo llame con la carta.
vi.mock('../src/utils/export', () => ({ downloadCardHtml: vi.fn() }));

const LETTER: DedicationForm = {
  title: 'Feliz Aniversario',
  recipient: 'Ana María',
  recipientEmail: 'sebas@ejemplo.com',
  sender: 'Sebastián',
  message: 'Gracias por cada día, mi amor. Te quiero.',
  songUrl: '',
  themeId: 'classic',
  photos: [],
};

const PUBLIC_URL = 'https://front.test/carta/ana-maria';

const renderModal = (props: Partial<ComponentProps<typeof SuccessModal>> = {}) => {
  const onClose = vi.fn();
  render(
    <SuccessModal
      open
      publicUrl={PUBLIC_URL}
      recipientEmail={LETTER.recipientEmail}
      letter={LETTER}
      onClose={onClose}
      {...props}
    />,
  );
  return { onClose };
};

const dialog = () => screen.getByRole('dialog', { name: /compartirla/i });
const postcard = () => screen.queryByTestId('qr-canvas');
const htmlButton = () => screen.getByRole('button', { name: /Carta HTML|Generando/ });

/** `a` está antes que `b` en el documento. */
const before = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

const clipboard = (writeText: () => Promise<void>) =>
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

beforeEach(() => {
  vi.mocked(downloadCardHtml).mockReset();
  vi.mocked(downloadCardHtml).mockResolvedValue(undefined);
});

afterEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
});

describe('SuccessModal', () => {
  it('ordena la columna: título, enlace, acuse del correo y "Entregarla en mano", con la postal al lado', () => {
    renderModal();

    const title = screen.getByRole('heading', { name: /Ya puedes\s+compartirla/ });
    const link = screen.getByLabelText(/Enlace de la carta/);
    const sent = screen.getByText(/Tu carta ha sido enviada exitosamente a:/);
    const handover = screen.getByText(/Entregarla en mano/);

    expect(before(title, link)).toBe(true);
    expect(before(link, sent)).toBe(true);
    expect(before(sent, handover)).toBe(true);
    expect(postcard()?.getAttribute('data-value')).toBe(PUBLIC_URL);
    expect(dialog().textContent).toContain('Ana María');
  });

  it('muestra el enlace para abrirlo y copiarlo, y el correo al que se envió', () => {
    renderModal();

    expect(dialog().querySelector(`a[href="${PUBLIC_URL}"]`)).not.toBeNull();
    expect((screen.getByLabelText(/Enlace de la carta/) as HTMLInputElement).value).toBe(PUBLIC_URL);
    expect(dialog().textContent).toContain(`Tu carta ha sido enviada exitosamente a: ${LETTER.recipientEmail}`);
  });

  it('"Copiar" deja el enlace en el portapapeles y lo dice', async () => {
    const user = setupUser();
    const writeText = vi.fn().mockResolvedValue(undefined);
    clipboard(writeText);
    renderModal();

    await user.click(screen.getByRole('button', { name: /Copiar/ }));

    expect(await screen.findByText(/Enlace copiado/)).toBeTruthy();
    expect(writeText).toHaveBeenCalledWith(PUBLIC_URL);
  });

  it('si el portapapeles falla, pide copiarlo a mano y el enlace sigue a la vista', async () => {
    const user = setupUser();
    clipboard(vi.fn().mockRejectedValue(new Error('sin permiso')));
    renderModal();

    await user.click(screen.getByRole('button', { name: /Copiar/ }));

    expect(await screen.findByText(/Cópialo a mano/)).toBeTruthy();
    expect((screen.getByLabelText(/Enlace de la carta/) as HTMLInputElement).value).toBe(PUBLIC_URL);
  });

  it('"Carta HTML" compone el archivo con la carta y vuelve a quedar libre', async () => {
    const user = setupUser();
    renderModal();

    await user.click(htmlButton());

    await waitFor(() => expect(downloadCardHtml).toHaveBeenCalledTimes(1));
    expect(downloadCardHtml).toHaveBeenCalledWith(LETTER);
    await waitFor(() => expect((htmlButton() as HTMLButtonElement).disabled).toBe(false));
  });

  it('"Postal QR" descarga la postal por su manejador, sin duplicar el botón interno de la postal', async () => {
    const user = setupUser();
    renderModal();

    expect(screen.queryByRole('button', { name: /Descargar postal QR/ })).toBeNull();
    const button = screen.getByRole('button', { name: /Postal QR/ });
    await user.click(button);

    await waitFor(() => expect((screen.getByRole('button', { name: /Postal QR/ }) as HTMLButtonElement).disabled).toBe(false));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('si una descarga falla, lo dice y deja reintentar', async () => {
    const user = setupUser();
    vi.mocked(downloadCardHtml).mockRejectedValue(new Error('sin memoria'));
    renderModal();

    await user.click(htmlButton());

    expect((await screen.findByRole('alert')).textContent).toContain('No pudimos generar el archivo');
    await waitFor(() => expect((htmlButton() as HTMLButtonElement).disabled).toBe(false));
  });

  it('cerrado no pinta nada', () => {
    renderModal({ open: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('"Volver al inicio", la X y Escape avisan al padre', async () => {
    const user = setupUser();
    const { onClose } = renderModal();

    await user.click(screen.getByRole('button', { name: /Volver al inicio/i }));
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
