import React, { useEffect, useRef } from 'react';
import { Ornament, CornerFlourish, HeartConfetti } from '../../../components/decor';

/**
 * Acuse del 202: la carta quedó encolada.
 *
 * Sustituye al antiguo `ShareModal`, que mostraba enlace y QR nada más pulsar
 * "compartir". Ya no se puede: el backend responde antes de escribir la carta,
 * así que en este momento **no existe** ni `publicSlug` ni QR que enseñar.
 * Prometer aquí un enlace sería enseñar uno inventado o uno roto; la única
 * fuente de verdad es el correo que envía el worker al terminar.
 */

interface QueuedModalProps {
  open: boolean;
  /** Mensaje que devolvió el backend con el 202. */
  message: string;
  recipientEmail: string;
  onClose: () => void;
}

export const QueuedModal: React.FC<QueuedModalProps> = ({
  open,
  message,
  recipientEmail,
  onClose,
}) => {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeButton.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center px-4 py-8 bg-wine-deep/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="queued-title"
    >
      <div className="relative w-full max-w-lg bg-white rounded-4xl shadow-2xl border border-wine/15 px-7 py-9 md:px-10 text-center overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-wine-deep via-wine to-tertiary" />
        <HeartConfetti count={10} tone="rose" opacity={0.16} className="z-0" />
        <CornerFlourish corner="tl" tone="gold" size={60} className="opacity-70" />
        <CornerFlourish corner="tr" tone="gold" size={60} className="opacity-70" />
        <CornerFlourish corner="bl" tone="gold" size={60} className="opacity-70" />
        <CornerFlourish corner="br" tone="gold" size={60} className="opacity-70" />

        <div className="relative z-10 flex flex-col items-center">
          <span className="w-16 h-16 rounded-full bg-blush flex items-center justify-center ring-4 ring-blush/50 mb-4">
            <span
              className="material-symbols-outlined text-wine text-[32px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              mark_email_unread
            </span>
          </span>

          <h2 id="queued-title" className="font-headline-md text-2xl font-bold text-on-background">
            ¡Tu carta se está{' '}
            <span className="font-script font-normal text-wine text-[1.4em] leading-none">
              procesando
            </span>
            !
          </h2>
          <Ornament tone="gold" width={170} className="mx-auto my-3" />

          <p className="font-body-md text-on-surface-variant leading-relaxed">
            El pago fue validado y en un par de minutos{' '}
            {recipientEmail ? (
              <>
                llegará a <strong className="text-wine">{recipientEmail}</strong> un correo
              </>
            ) : (
              'recibirás un correo electrónico'
            )}{' '}
            con el enlace permanente de la carta y el archivo adjunto.
          </p>

          {message && <p className="text-xs text-wine/60 mt-3 leading-relaxed">{message}</p>}

          <div className="mt-6 w-full bg-paper/70 rounded-2xl px-5 py-4 ring-1 ring-wine/10 text-left">
            <p className="text-[11px] font-bold text-wine/70 uppercase tracking-wider mb-2">
              Qué pasa ahora
            </p>
            <ul className="flex flex-col gap-2 text-sm text-on-surface-variant">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-wine text-[18px] mt-0.5">
                  cloud_done
                </span>
                Guardamos tus fotos en su almacenamiento definitivo.
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-wine text-[18px] mt-0.5">
                  qr_code_2
                </span>
                Generamos el enlace público y su código QR.
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-wine text-[18px] mt-0.5">send</span>
                Te enviamos todo por correo. No hace falta que esperes aquí.
              </li>
            </ul>
          </div>

          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            className="mt-7 px-8 py-3.5 rounded-full bg-wine text-white font-semibold text-sm shadow-lg hover:bg-primary transition-colors flex items-center gap-2 cursor-pointer"
          >
            Entendido, volver al inicio
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
