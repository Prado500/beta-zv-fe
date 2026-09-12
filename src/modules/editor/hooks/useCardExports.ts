import { useCallback, useRef, useState, type RefObject } from 'react';
import type { DedicationForm } from '../types';
import type { ThemeQRCodeHandle } from '../components/ThemeQRCode';
import { downloadCardHtml } from '../../../utils/export';

/**
 * ViewModel de "Entregarla en mano": la carta en HTML y la postal del QR.
 *
 * Quien lo monta solo pinta botones; aquí vive lo que pasa al pulsarlos. Las
 * dos descargas se componen en el navegador —la carta con las fotos y las
 * flores incrustadas, la postal en canvas— y un cerrojo síncrono evita que un
 * doble clic componga dos archivos a la vez.
 *
 * La carta puede llegar hecha o por pedir. En el editor ya está en el
 * formulario; en "Mis dedicatorias" el listado no la trae y hay que pedirla al
 * backend justo antes de componer el archivo. Por eso se acepta también una
 * función que la resuelva. Se llama dentro del cerrojo, así que el botón sigue
 * ocupado mientras la carta viaja, y si pedirla falla se cuenta como un fallo
 * de la descarga, que es lo que la persona pulsó.
 */

export type ExportKind = 'html' | 'postcard';

/** La carta en mano, o la promesa de conseguirla al pulsar. */
export type LetterSource = DedicationForm | (() => Promise<DedicationForm>);

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

export const useCardExports = (letter: LetterSource): CardExports => {
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

  const downloadHtml = useCallback(
    () =>
      run('html', async () => {
        const data = typeof letter === 'function' ? await letter() : letter;
        await downloadCardHtml(data);
      }),
    [run, letter],
  );

  const downloadPostcard = useCallback(
    () =>
      run('postcard', async () => {
        await postcardRef.current?.download();
      }),
    [run],
  );

  return { postcardRef, busy, error, downloadHtml, downloadPostcard };
};
