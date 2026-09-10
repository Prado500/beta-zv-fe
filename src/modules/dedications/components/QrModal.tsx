import React, { useEffect, useRef, useState } from 'react';
import { ModalShell } from '../../../components/ui/ModalShell';
import { Ornament } from '../../../components/decor';
import { ThemeQRCode } from '../../editor/components/ThemeQRCode';
import { useCardExports } from '../../editor/hooks/useCardExports';
import { themeFromSlug, type DedicationForm } from '../../editor/types';
import { usePublicLetter } from '../../viewer/hooks/usePublicLetter';
import { viewerPathFor, type Dedication } from '../services/dedications';

/**
 * La postal del QR de una carta publicada, desde el panel.
 *
 * Es la misma postal que se entrega al terminar la carta en el editor —papel y
 * flores del tema, "Para" y "De" con los nombres, la primera frase como nota— y
 * se descarga por el mismo camino, `useCardExports`. Antes aquí se pintaba el
 * PNG en blanco y negro del servidor y la postal solo entraba de respaldo.
 *
 * El listado del panel no trae ni la firma ni el mensaje, así que al abrirse se
 * pide la carta pública por slug, la misma petición que hace el visor. Mientras
 * llega, el enlace ya se puede copiar y la descarga espera; si no llega, la
 * postal sale con lo que el listado sí sabe: destinatario y tema.
 *
 * Se monta al abrirse y se destruye al cerrar: cada apertura arranca sin el
 * "Copiado" de la anterior, con su propia petición y su propia postal.
 */

interface QrModalProps {
  dedication: Dedication;
  onClose: () => void;
}

const LABEL =
  'flex items-center gap-1.5 text-[10px] font-bold text-wine/75 uppercase tracking-wider mb-1';

const GHOST =
  'h-11 w-full inline-flex items-center justify-center gap-1.5 px-3 rounded-lg border-[1.5px] border-wine/30 text-wine font-semibold text-[13px] hover:bg-blush/70 hover:border-wine transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait';

/** Lo que el listado sabe de la carta: basta para el código, no para la firma ni la nota. */
const provisionalForm = (dedication: Dedication): DedicationForm => ({
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
  const closeButton = useRef<HTMLButtonElement>(null);

  const slug = dedication.publicSlug;
  const publicUrl =
    dedication.publicUrl ?? (slug ? `${window.location.origin}${viewerPathFor(slug)}` : '');

  // La carta entera, por el mismo camino que el visor. Cancela sola al cerrar.
  const letter = usePublicLetter(slug ?? undefined);
  const loading = letter.kind === 'loading';
  const form = letter.kind === 'ready' ? letter.data : provisionalForm(dedication);
  const { postcardRef, busy, error, downloadPostcard } = useCardExports(form);

  useEffect(() => {
    closeButton.current?.focus();
  }, []);

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
    <ModalShell labelledBy="qr-title" onClose={onClose} size="xl">
      <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-8 md:items-center">
        {/*
          La postal va primera en el marcado, que es como se ve en móvil; en
          escritorio `md:order-last` la manda a la columna derecha, igual que
          en el modal de éxito del editor. El `pt-5` de móvil la aparta de la X.
        */}
        <div className="flex items-center justify-center pt-5 md:pt-0 md:order-last">
          {/* Tope de ancho: la postal se encoge sola hasta caber aquí */}
          <div className="w-full max-w-[260px] md:max-w-[300px] mx-auto shrink-0">
            {loading ? (
              <div
                className="flex flex-col items-center justify-center py-16"
                role="status"
                aria-live="polite"
              >
                <span className="material-symbols-outlined text-wine text-[32px] animate-spin">
                  progress_activity
                </span>
                <p className="text-sm text-wine/70 mt-3">Preparando tu postal…</p>
              </div>
            ) : (
              <ThemeQRCode
                ref={postcardRef}
                data={form}
                cardUrl={publicUrl}
                size={212}
                showDownload={false}
              />
            )}
          </div>
        </div>

        <div className="min-w-0 flex flex-col gap-4 text-left">
          <header>
            <span className="w-12 h-12 rounded-full bg-blush flex items-center justify-center ring-4 ring-blush/50 mb-3">
              <span className="material-symbols-outlined text-wine text-[24px]">qr_code_2</span>
            </span>
            <h2
              id="qr-title"
              className="font-headline-md text-xl md:text-2xl font-bold text-on-background"
            >
              El QR de tu{' '}
              <span className="font-script font-normal text-wine text-[1.6em] leading-none">
                carta
              </span>
            </h2>
            <Ornament tone="gold" width={150} className="mt-2" />
          </header>

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

          <div className="w-full bg-paper/70 rounded-2xl px-4 py-3 ring-1 ring-wine/10 flex items-center gap-2">
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 min-w-0 text-sm text-wine font-medium underline break-all"
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

          <div className="h-px rule-gold shrink-0"></div>

          {/* La descarga: la postal en PNG, compuesta en canvas por la propia postal */}
          <section>
            <span className={LABEL}>
              <span className="material-symbols-outlined text-[15px]">draft</span>
              Entregarla en mano
            </span>
            <button
              type="button"
              onClick={() => void downloadPostcard()}
              disabled={loading || busy !== null}
              className={GHOST}
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              {busy === 'postcard' ? 'Generando…' : 'Descargar postal QR (PNG)'}
            </button>
            <p className="text-[11px] mt-1 text-wine/60">
              Sale en PNG con el tema de la carta, lista para imprimir. El archivo de la carta se
              descarga desde la tarjeta.
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
            Listo
            <span className="material-symbols-outlined text-[18px]">check</span>
          </button>
        </div>
      </div>
    </ModalShell>
  );
};
