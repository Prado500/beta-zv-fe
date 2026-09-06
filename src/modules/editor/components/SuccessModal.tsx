import React, { useEffect, useRef, useState } from 'react';
import { CornerFlourish, HeartConfetti, Ornament } from '../../../components/decor';
import { ThemeQRCode } from './ThemeQRCode';
import type { DedicationForm } from '../types';

/**
 * Éxito inmediato: el backend respondió `201`/`200` con la carta ya escrita.
 *
 * Solo se llega aquí cuando existe un enlace de verdad. Si el sistema está en
 * modo asíncrono la respuesta es `202` y quien se muestra es `QueuedModal`: esa
 * decisión la toma el código de estado, no esta pantalla.
 *
 * El QR es el del servidor cuando lo manda; si no, se dibuja en el navegador con
 * el tema elegido. En los dos casos apunta al mismo enlace público.
 */

interface SuccessModalProps {
  open: boolean;
  publicUrl: string;
  /** Imagen de QR generada por el backend. `null` si toca dibujarla aquí. */
  qrUrl: string | null;
  recipientEmail: string;
  /** Datos de la carta, para que el QR salga con el tema y el nombre. */
  letter: DedicationForm;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  open,
  publicUrl,
  qrUrl,
  recipientEmail,
  letter,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeButton.current?.focus();
  }, [open]);

  if (!open) return null;

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
    <div
      className="fixed inset-0 z-100 flex items-center justify-center px-4 py-8 bg-wine-deep/55 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-title"
    >
      <div className="relative w-full max-w-lg bg-white rounded-4xl shadow-2xl border border-wine/15 px-7 py-9 md:px-10 text-center overflow-hidden my-auto">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-wine-deep via-wine to-tertiary" />
        <HeartConfetti count={10} tone="rose" opacity={0.16} className="z-0" />
        <CornerFlourish corner="tl" tone="gold" size={60} className="opacity-70" />
        <CornerFlourish corner="br" tone="gold" size={60} className="opacity-70" />

        <div className="relative z-10 flex flex-col items-center">
          <span className="w-16 h-16 rounded-full bg-blush flex items-center justify-center ring-4 ring-blush/50 mb-4">
            <span
              className="material-symbols-outlined text-wine text-[32px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
          </span>

          <h2 id="success-title" className="font-headline-md text-2xl font-bold text-on-background">
            ¡Tu carta está{' '}
            <span className="font-script font-normal text-wine text-[1.4em] leading-none">
              lista
            </span>
            !
          </h2>
          <Ornament tone="gold" width={170} className="mx-auto my-3" />

          <p className="font-body-md text-on-surface-variant leading-relaxed">
            {recipientEmail ? (
              <>
                También la enviamos a <strong className="text-wine">{recipientEmail}</strong>.
              </>
            ) : (
              'Ya puedes compartirla.'
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
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="Código QR de la carta"
                className="w-56 h-56 mx-auto rounded-2xl ring-1 ring-wine/15 bg-white p-2"
              />
            ) : (
              <ThemeQRCode data={letter} cardUrl={publicUrl} size={220} />
            )}
          </div>

          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            className="mt-8 px-8 py-3.5 rounded-full bg-wine text-white font-semibold text-sm shadow-lg hover:bg-primary transition-colors flex items-center gap-2 cursor-pointer"
          >
            Volver al inicio
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
