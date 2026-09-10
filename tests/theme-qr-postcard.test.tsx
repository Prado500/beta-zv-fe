import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeQRCode, type ThemeQRCodeHandle } from '../src/modules/editor/components/ThemeQRCode';
import type { DedicationForm } from '../src/modules/editor/types';
import { DEFAULT_NOTE, SCAN_LINE } from '../src/utils/qrCard';

/**
 * La postal del QR: el código apunta al enlace, el emblema alado va en el
 * centro, y los nombres y la nota salen de la carta con sus valores por
 * defecto cuando faltan. La descarga se ofrece con su botón o por `ref`.
 */

interface QrProps {
  value: string;
  level: string;
  imageSettings?: { src: string; width: number; height: number; excavate: boolean };
}

// jsdom no implementa canvas: se captura lo que se le pide al código, no el trazado.
vi.mock('qrcode.react', () => ({
  QRCodeCanvas: ({ value, level, imageSettings }: QrProps) => (
    <canvas
      data-testid="qr-canvas"
      data-value={value}
      data-level={level}
      data-icon={imageSettings?.src}
      data-icon-w={imageSettings?.width}
      data-icon-h={imageSettings?.height}
    />
  ),
}));

const LETTER: DedicationForm = {
  title: 'Feliz Aniversario',
  recipient: 'Ana María',
  recipientEmail: '',
  sender: 'Sebastián',
  message: 'Gracias por cada día, mi amor. Te quiero.',
  songUrl: '',
  themeId: 'starry',
  photos: [],
};

const URL_ = 'https://front.test/carta/ana-maria';

const code = () => screen.getByTestId('qr-canvas');

describe('ThemeQRCode', () => {
  it('el código apunta al enlace, con corrección alta y el emblema alado apaisado en el centro', () => {
    render(<ThemeQRCode data={LETTER} cardUrl={URL_} />);

    expect(code().getAttribute('data-value')).toBe(URL_);
    expect(code().getAttribute('data-level')).toBe('H');
    const icon = code().getAttribute('data-icon') ?? '';
    expect(icon.startsWith('data:image/svg+xml')).toBe(true);
    expect(decodeURIComponent(icon)).toContain('viewBox="0 0 128 72"');
    expect(Number(code().getAttribute('data-icon-h'))).toBeLessThan(Number(code().getAttribute('data-icon-w')));
  });

  it('lleva los nombres de la carta y la primera frase como nota, con la invitación a escanear', () => {
    render(<ThemeQRCode data={LETTER} cardUrl={URL_} />);

    expect(screen.getByText('Ana María')).toBeTruthy();
    expect(screen.getByText('Sebastián')).toBeTruthy();
    expect(screen.getByText(/Gracias por cada día, mi amor/)).toBeTruthy();
    expect(screen.getByText(new RegExp(SCAN_LINE))).toBeTruthy();
  });

  it('sin nombres ni mensaje usa los valores de la postal por defecto', () => {
    render(<ThemeQRCode data={{ ...LETTER, recipient: '', sender: '', message: '' }} cardUrl={URL_} />);

    expect(screen.getByText('ti')).toBeTruthy();
    expect(screen.getByText('Alguien que te quiere')).toBeTruthy();
    expect(screen.getByText(new RegExp(DEFAULT_NOTE.replace('.', '')))).toBeTruthy();
  });

  it('en los temas oscuros el código va sobre baldosa clara, para que lo lea cualquier lector', () => {
    render(<ThemeQRCode data={LETTER} cardUrl={URL_} />);

    const tile = code().parentElement as HTMLElement;
    expect(tile.style.backgroundColor.replace(/\s/g, '')).toBe('rgb(255,255,255)');
  });

  it('por defecto ofrece su propio botón de descarga; con showDownload en false lo esconde', () => {
    const { unmount } = render(<ThemeQRCode data={LETTER} cardUrl={URL_} />);
    expect(screen.getByRole('button', { name: /Descargar postal QR/ })).toBeTruthy();
    unmount();

    render(<ThemeQRCode data={LETTER} cardUrl={URL_} showDownload={false} />);
    expect(screen.queryByRole('button', { name: /Descargar postal QR/ })).toBeNull();
  });

  it('expone la descarga por ref y no rompe donde no hay canvas', async () => {
    const handle = createRef<ThemeQRCodeHandle>();
    render(<ThemeQRCode ref={handle} data={LETTER} cardUrl={URL_} showDownload={false} />);

    expect(handle.current).not.toBeNull();
    await expect(handle.current?.download()).resolves.toBeUndefined();
  });
});
