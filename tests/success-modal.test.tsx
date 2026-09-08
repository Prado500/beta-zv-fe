import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SuccessModal } from '../src/modules/editor/components/SuccessModal';
import type { DedicationForm } from '../src/modules/editor/types';
import { setupUser } from './testUtils';

/**
 * Modal de éxito: el QR nunca puede verse como una imagen rota.
 *
 * Si el servidor manda una imagen se pinta; si no la manda, o no carga, se
 * dibuja en el navegador con el tema. El enlace público es el mismo en los dos.
 */

// jsdom no implementa canvas; lo que se comprueba es qué QR se elige, no el trazado.
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
  message: 'Gracias por cada día a tu lado, mi amor.',
  songUrl: '',
  themeId: 'classic',
  photos: [],
};

const PUBLIC_URL = 'https://front.test/carta/ana-maria';
const QR_URL = 'https://api.test/api/v1/public/letters/ana-maria/qr.png';

const renderModal = (props: Partial<ComponentProps<typeof SuccessModal>> = {}) => {
  const onClose = vi.fn();
  render(
    <SuccessModal
      open
      publicUrl={PUBLIC_URL}
      qrUrl={QR_URL}
      recipientEmail={LETTER.recipientEmail}
      letter={LETTER}
      onClose={onClose}
      {...props}
    />,
  );
  return { onClose };
};

const serverQr = () => screen.queryByRole('img', { name: /Código QR de la carta/i });
const localQr = () => screen.queryByTestId('qr-canvas');

describe('SuccessModal · QR', () => {
  it('pinta la imagen del servidor cuando llega un qrUrl', () => {
    renderModal();
    expect(serverQr()?.getAttribute('src')).toBe(QR_URL);
    expect(localQr()).toBeNull();
  });

  it('si la imagen no carga, cae al QR dibujado en el navegador con el mismo enlace', () => {
    renderModal();

    fireEvent.error(screen.getByRole('img', { name: /Código QR de la carta/i }));

    expect(serverQr()).toBeNull();
    expect(localQr()?.getAttribute('data-value')).toBe(PUBLIC_URL);
    expect(screen.getByText(/Escanea para abrirla/i)).toBeTruthy();
  });

  it('sin qrUrl dibuja el QR en el navegador directamente', () => {
    renderModal({ qrUrl: null });
    expect(serverQr()).toBeNull();
    expect(localQr()?.getAttribute('data-value')).toBe(PUBLIC_URL);
  });

  it('muestra el enlace público y el correo al que se envió', () => {
    renderModal();
    const dialog = screen.getByRole('dialog', { name: /lista/i });
    expect(dialog.querySelector(`a[href="${PUBLIC_URL}"]`)).not.toBeNull();
    expect(dialog.textContent).toContain(LETTER.recipientEmail);
  });

  it('cerrado no pinta nada', () => {
    renderModal({ open: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('"Volver al inicio" avisa al padre', async () => {
    const user = setupUser();
    const { onClose } = renderModal();
    await user.click(screen.getByRole('button', { name: /Volver al inicio/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
