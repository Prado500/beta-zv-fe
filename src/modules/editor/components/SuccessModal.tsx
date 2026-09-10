import React, { useEffect, useRef, useState } from 'react';
import { CornerFlourish, HeartConfetti, Ornament, Rose } from '../../../components/decor';
import { ThemeQRCode } from './ThemeQRCode';
import { useCardExports } from '../hooks/useCardExports';
import type { DedicationForm } from '../types';

/**
 * Éxito inmediato: el backend respondió `201`/`200` con la carta ya escrita.
 *
 * Solo se llega aquí cuando existe un enlace de verdad. Si el sistema está en
 * modo asíncrono la respuesta es `202` y quien se muestra es `QueuedModal`: esa
 * decisión la toma el código de estado, no esta pantalla.
 *
 * Dos columnas: a la izquierda el enlace, el acuse del correo y las descargas
 * para entregarla en mano; a la derecha la postal del QR con el tema y los
 * nombres de la carta. Las descargas las gobierna `useCardExports`: aquí no
 * hay más que botones.
 */

interface SuccessModalProps {
  open: boolean;
  publicUrl: string;
  recipientEmail: string;
  /** Datos de la carta, para que la postal salga con el tema y los nombres. */
  letter: DedicationForm;
  onClose: () => void;
}

type CopyState = 'idle' | 'copied' | 'failed';

const LABEL =
  'flex items-center gap-1.5 text-[10px] font-bold text-wine/75 uppercase tracking-wider mb-1';

const GHOST =
  'h-11 inline-flex items-center justify-center gap-1.5 px-3 rounded-lg border-[1.5px] border-wine/30 text-wine font-semibold text-[13px] hover:bg-blush/70 hover:border-wine transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait';

export const SuccessModal: React.FC<SuccessModalProps> = ({
  open,
  publicUrl,
  recipientEmail,
  letter,
  onClose,
}) => {
  const [copy, setCopy] = useState<CopyState>('idle');
  const closeButton = useRef<HTMLButtonElement>(null);
  const copyTimer = useRef<number | null>(null);
  // El ref de la postal va aparte del estado: el estado se lee al pintar, el ref no.
  const { postcardRef, busy, error, downloadHtml, downloadPostcard } = useCardExports(letter);

  useEffect(() => {
    if (open) closeButton.current?.focus();
  }, [open]);

  // Cerrar con Escape mientras está abierto
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(publicUrl);
      setCopy('copied');
    } catch {
      // Sin permiso de portapapeles el enlace sigue visible y seleccionable.
      setCopy('failed');
    }
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopy('idle'), 2400);
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 z-100 flex items-center justify-center p-3 md:p-5 bg-wine-deep/60 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      {/*
        El panel acota el alto y NO desplaza: el scroll vive en el hijo. Así la
        X y la cinta de arriba, que son absolutas contra el panel, se quedan
        quietas en su sitio aunque el contenido corra por debajo.
      */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-title"
        onClick={(event) => event.stopPropagation()}
        className="modal-panel relative w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden rounded-4xl bg-white shadow-[0_50px_110px_-35px_rgba(94,10,27,0.75)] border border-wine/15"
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-wine-deep via-wine to-tertiary rounded-t-4xl z-20"></div>

        {/*
          Fondo del panel. Va suelto, detrás del hijo que desplaza, así que no
          se mueve al hacer scroll ni estorba a los controles. Los rubores son
          degradados radiales y no círculos con `blur`: el desenfoque obliga a
          componer una capa aparte por cada uno.
        */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-4xl">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(58% 42% at 88% 10%, rgba(243,216,216,0.6), transparent 72%),' +
                'radial-gradient(46% 38% at 4% 94%, rgba(239,228,220,0.85), transparent 72%),' +
                'radial-gradient(40% 30% at 50% 100%, rgba(243,216,216,0.35), transparent 75%)',
            }}
          />
          <CornerFlourish corner="tl" tone="gold" size={78} placement="top-5 left-5" className="opacity-30" />
          <CornerFlourish corner="br" tone="gold" size={78} placement="bottom-5 right-5" className="opacity-30" />
          {/* Rosas asomando por las esquinas de abajo, muy apagadas: quedan
              bajo el texto de los controles y no deben competir con él. */}
          <Rose size={124} className="absolute -left-9 -bottom-10 opacity-[0.14] -rotate-[16deg]" />
          <Rose size={104} className="absolute -right-7 -bottom-12 opacity-[0.11] rotate-[19deg] hidden md:block" />
          <Ornament tone="gold" width={120} className="absolute left-1/2 -translate-x-1/2 bottom-3 opacity-25 hidden md:block" />
        </div>

        <HeartConfetti count={14} tone="rose" opacity={0.07} className="z-0" />

        {/* Fondo propio y z alto: sigue siendo visible y pulsable aunque la
            postal quede justo debajo. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3 right-3 md:top-4 md:right-4 z-50 w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm ring-1 ring-wine/10 shadow-sm flex items-center justify-center text-wine hover:bg-blush transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/*
          En móvil, una columna con la postal arriba y los controles debajo. La
          postal va primera en el marcado, que es como se ve en móvil; en
          escritorio `md:order-last` la manda a la columna derecha. `pt-14` en
          móvil: la X ocupa hasta los 48px de arriba y la postal, centrada,
          llegaba a rozarla en pantallas de 360px.
        */}
        <div className="relative z-10 flex-1 min-h-0 overflow-y-auto p-5 pt-14 md:p-8">
          <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-8 md:items-center">
            <div className="modal-stagger-2 flex items-center justify-center md:order-last">
              {/* Tope de ancho: la postal se encoge sola hasta caber aquí */}
              <div className="w-full max-w-[260px] md:max-w-[300px] mx-auto shrink-0">
                <ThemeQRCode
                  ref={postcardRef}
                  data={letter}
                  cardUrl={publicUrl}
                  size={212}
                  showDownload={false}
                />
              </div>
            </div>

            <div className="modal-stagger-1 min-w-0 flex flex-col gap-4 text-left">
              <header>
                <span className="inline-flex items-center gap-1.5 bg-blush text-wine-deep text-[11px] font-bold px-2.5 py-0.5 rounded-full ring-1 ring-wine/15 mb-2">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    favorite
                  </span>
                  Tu carta está lista
                </span>

                <h2 id="success-title" className="font-headline-md text-xl md:text-2xl text-on-background">
                  Ya puedes{' '}
                  <span className="font-script font-normal text-wine text-[1.4em] leading-none">compartirla</span>
                </h2>
                <Ornament tone="gold" width={150} className="mt-2" />
              </header>

              {/* Enlace */}
              <section>
                <label htmlFor="success-url" className={LABEL}>
                  <span className="material-symbols-outlined text-[15px]">link</span>
                  Enlace de la carta
                </label>
                <div className="flex gap-2">
                  <input
                    id="success-url"
                    readOnly
                    value={publicUrl}
                    onFocus={(event) => event.currentTarget.select()}
                    className="min-w-0 flex-1 bg-paper/60 border border-wine/15 h-11 rounded-lg px-3 text-[13px] text-on-surface outline-none focus:border-wine focus:bg-white focus:ring-2 focus:ring-wine/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    className="shrink-0 h-11 inline-flex items-center gap-1.5 px-3.5 rounded-lg font-semibold text-[13px] bg-wine text-white hover:bg-primary transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copy === 'copied' ? 'check' : 'content_copy'}
                    </span>
                    {copy === 'copied' ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <p className="text-[11px] mt-1 min-h-4 text-wine/60" role="status">
                  {copy === 'copied' && 'Enlace copiado al portapapeles.'}
                  {copy === 'failed' && 'No se pudo copiar. Cópialo a mano.'}
                  {copy === 'idle' && (
                    <a href={publicUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-wine">
                      Abrirla en una pestaña nueva
                    </a>
                  )}
                </p>
              </section>

              {/* Acuse del correo */}
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                {recipientEmail ? (
                  <>
                    Tu carta ha sido enviada exitosamente a:{' '}
                    <strong className="text-wine break-all">{recipientEmail}</strong>
                  </>
                ) : (
                  'Tu carta ya está publicada.'
                )}
              </p>

              <div className="h-px rule-gold shrink-0"></div>

              {/* Descargas: la carta y la postal del QR, una al lado de la otra */}
              <section>
                <span className={LABEL}>
                  <span className="material-symbols-outlined text-[15px]">draft</span>
                  Entregarla en mano
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void downloadHtml()}
                    disabled={busy !== null}
                    className={GHOST}
                  >
                    <span className="material-symbols-outlined text-[16px]">description</span>
                    {busy === 'html' ? 'Generando…' : 'Carta HTML'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void downloadPostcard()}
                    disabled={busy !== null}
                    className={GHOST}
                  >
                    <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                    {busy === 'postcard' ? 'Generando…' : 'Postal QR'}
                  </button>
                </div>
                <p className="text-[11px] mt-1 text-wine/60">
                  La carta abre sola en cualquier navegador, sin internet. La postal sale en PNG,
                  lista para imprimir.
                </p>
                {error && (
                  <p className="text-xs text-error font-medium mt-1" role="alert">
                    {error}
                  </p>
                )}
              </section>

              <div className="h-px rule-gold shrink-0"></div>

              <button
                ref={closeButton}
                type="button"
                onClick={onClose}
                className="self-start px-8 py-3.5 rounded-full bg-wine text-white font-semibold text-sm shadow-lg hover:bg-primary transition-colors flex items-center gap-2 cursor-pointer"
              >
                Volver al inicio
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
