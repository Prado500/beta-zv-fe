import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SuccessModal } from '../src/modules/editor/components/SuccessModal';
import type { DedicationForm } from '../src/modules/editor/types';
import { setupUser } from './testUtils';

/**
 * Modal de éxito: la postal del QR con el tema y los nombres de la carta,
 * apuntando al enlace público; el enlace para copiar; y las tres formas de
 * cerrar. Se afirma lo que se ve y se pulsa.
 */

// jsdom no implementa canvas; lo que se comprueba es qué QR se dibuja, no el trazado.
vi.mock('qrcode.react', () => ({
  QRCodeCanvas: ({ value }: { value: string }) => (
    <canvas data-testid="qr-canvas" data-value={value} />
  ),
}));

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

const dialog = () => screen.getByRole('dialog', { name: /lista/i });
const postcard = () => screen.queryByTestId('qr-canvas');

const clipboard = (writeText: () => Promise<void>) =>
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

afterEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
});

describe('SuccessModal · la postal', () => {
  it('dibuja la postal con el enlace público, los nombres y la primera frase como nota', () => {
    renderModal();

    expect(postcard()?.getAttribute('data-value')).toBe(PUBLIC_URL);
    const text = dialog().textContent ?? '';
    expect(text).toContain('Ana María');
    expect(text).toContain('Sebastián');
    expect(text).toContain('Gracias por cada día, mi amor');
    expect(text).toContain('Escanéalo');
    expect(screen.getByRole('button', { name: /Descargar postal QR/ })).toBeTruthy();
  });

  it('muestra el enlace público, para abrirlo y para copiarlo, y el correo al que se envió', () => {
    renderModal();

    expect(dialog().querySelector(`a[href="${PUBLIC_URL}"]`)).not.toBeNull();
    expect((screen.getByLabelText(/Enlace de la carta/) as HTMLInputElement).value).toBe(PUBLIC_URL);
    expect(dialog().textContent).toContain(LETTER.recipientEmail);
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

  it('descargar la postal no rompe donde no hay canvas, y el botón vuelve a quedar libre', async () => {
    const user = setupUser();
    renderModal();

    const button = screen.getByRole('button', { name: /Descargar postal QR/ });
    await user.click(button);

    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
    expect(screen.getByRole('button', { name: /Descargar postal QR/ })).toBeTruthy();
  });
});
