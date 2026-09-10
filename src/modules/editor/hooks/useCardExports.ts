import { useCallback, useRef, useState, type RefObject } from 'react';
import type { DedicationForm } from '../types';
import type { ThemeQRCodeHandle } from '../components/ThemeQRCode';
import { downloadCardHtml } from '../../../utils/export';

/**
 * ViewModel de "Entregarla en mano": la carta en HTML y la postal del QR.
 *
 * El modal solo pinta dos botones; aquí vive lo que pasa al pulsarlos. Las dos
 * descargas se componen en el navegador —la carta con las fotos y las flores
 * incrustadas, la postal en canvas— y ninguna toca el backend. Un cerrojo
 * síncrono evita que un doble clic componga dos archivos a la vez.
 */

export type ExportKind = 'html' | 'postcard';

export interface CardExports {
  /** Ref para la postal: es ella quien sabe componer su propio PNG. */
  postcardRef: RefObject<ThemeQRCodeHandle | null>;
  /** Descarga en curso, o `null`. */
  busy: ExportKind | null;
  error: string | null;
  downloadHtml: () => Promise<void>;
  downloadPostcard: () => Promise<void>;
}

const FAILED: Record<ExportKind, string> = {
  html: 'No pudimos generar el archivo de la carta. Inténtalo de nuevo.',
  postcard: 'No pudimos generar la postal. Inténtalo de nuevo.',
};

export const useCardExports = (letter: DedicationForm): CardExports => {
  const postcardRef = useRef<ThemeQRCodeHandle>(null);
  const [busy, setBusy] = useState<ExportKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const run = useCallback(async (kind: ExportKind, job: () => Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(kind);
    setError(null);
    try {
      await job();
    } catch {
      setError(FAILED[kind]);
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }, []);

  const downloadHtml = useCallback(() => run('html', () => downloadCardHtml(letter)), [run, letter]);

  const downloadPostcard = useCallback(
    () =>
      run('postcard', async () => {
        await postcardRef.current?.download();
      }),
    [run],
  );

  return { postcardRef, busy, error, downloadHtml, downloadPostcard };
};
