import React, { useEffect, useRef, useState } from 'react';
import { ModalShell } from '../../../components/ui/ModalShell';
import { Ornament } from '../../../components/decor';
import { ThemeQRCode } from '../../editor/components/ThemeQRCode';
import { themeFromSlug, type DedicationForm } from '../../editor/types';
import { qrUrlFor, viewerPathFor, type Dedication } from '../services/dedications';

/**
 * El QR de una carta publicada, desde el panel.
 *
 * Mismo criterio que `SuccessModal`: la imagen del servidor cuando hay slug y,
 * si no la hay o no carga, el QR dibujado en el navegador con el tema de la
 * carta. En los dos casos apunta al mismo enlace público, que es el que viaja en
 * el correo. Se monta al abrirse y se destruye al cerrar: cada apertura arranca
 * sin el "Copiado" ni el fallo de imagen de la anterior.
 */

interface QrModalProps {
  dedication: Dedication;
  onClose: () => void;
}

/** Lo mínimo que el QR temático necesita saber de la carta. */
const toForm = (dedication: Dedication): DedicationForm => ({
  title: dedication.title ?? '',
  recipient: dedication.recipientName ?? '',
  recipientEmail: '',
  sender: '',
  message: '',
  songUrl: '',
  themeId: themeFromSlug(dedication.theme ?? 'classic'),
  photos: [],
});

export const QrModal: React.FC<QrModalProps> = ({ dedication, onClose }) => {
  const [copied, setCopied] = useState(false);
  /** La imagen del servidor no cargó: se dibuja el QR en el navegador. */
  const [qrFailed, setQrFailed] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButton.current?.focus();
  }, []);

  const slug = dedication.publicSlug;
  const publicUrl =
    dedication.publicUrl ?? (slug ? `${window.location.origin}${viewerPathFor(slug)}` : '');
  const qrUrl = slug ? qrUrlFor(slug) : null;

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles el enlace sigue visible y seleccionable.
      setCopied(false);
    }
  };

  return (
    <ModalShell labelledBy="qr-title" onClose={onClose} size="lg" className="text-center">
      <div className="flex flex-col items-center">
        <span className="w-14 h-14 rounded-full bg-blush flex items-center justify-center ring-4 ring-blush/50 mb-3">
          <span className="material-symbols-outlined text-wine text-[28px]">qr_code_2</span>
        </span>

        <h2 id="qr-title" className="font-headline-md text-xl font-bold text-on-background">
          El QR de tu{' '}
          <span className="font-script font-normal text-wine text-[1.6em] leading-none">
            carta
          </span>
        </h2>
        <Ornament tone="gold" width={150} className="mx-auto mt-1 mb-3" />

        <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
          Escanéalo o comparte el enlace: los dos abren{' '}
          {dedication.recipientName ? (
            <>
              la carta para <strong className="text-wine">{dedication.recipientName}</strong>.
            </>
          ) : (
            'la carta.'
          )}
        </p>

        <div className="mt-5 w-full bg-paper/70 rounded-2xl px-4 py-3 ring-1 ring-wine/10 flex items-center gap-2">
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 text-sm text-wine font-medium underline break-all text-left"
          >
            {publicUrl}
          </a>
          <button
            type="button"
            onClick={copy}
            className="shrink-0 px-3 py-2 rounded-full bg-wine text-white text-xs font-semibold flex items-center gap-1 hover:bg-primary transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>

        <div className="mt-7">
          {qrUrl && !qrFailed ? (
            <img
              src={qrUrl}
              alt="Código QR de la carta"
              onError={() => setQrFailed(true)}
              className="w-56 h-56 mx-auto rounded-2xl ring-1 ring-wine/15 bg-white p-2"
            />
          ) : (
            <ThemeQRCode data={toForm(dedication)} cardUrl={publicUrl} size={220} />
          )}
        </div>

        {qrUrl && !qrFailed && (
          // Misma imagen que llega por correo. En otro origen el navegador la abre
          // en una pestaña en vez de descargarla; desde ahí se guarda igual.
          <a
            href={qrUrl}
            download={`qr-${slug}.png`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-wine hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Descargar QR (PNG)
          </a>
        )}

        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          className="mt-7 px-8 py-3.5 rounded-full bg-wine text-white font-semibold text-sm shadow-lg hover:bg-primary transition-colors flex items-center gap-2 cursor-pointer"
        >
          Listo
          <span className="material-symbols-outlined text-[18px]">check</span>
        </button>
      </div>
    </ModalShell>
  );
};
