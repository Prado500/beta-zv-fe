import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DedicationForm } from '../types';
import { ThemeQRCode } from './ThemeQRCode';
import { downloadCardHtml } from '../../../utils/export';
import { HeartConfetti } from '../../../components/decor';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  data: DedicationForm;
  /** Enlace público devuelto por `publishDedication`. */
  cardUrl: string;
}

type CopyState = 'idle' | 'copied' | 'failed';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Copia con Clipboard API y respaldo por selección para contextos sin permiso. */
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* cae al respaldo */
  }
  try {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(field);
    return ok;
  } catch {
    return false;
  }
};

const FIELD =
  'min-w-0 bg-paper/60 border border-wine/15 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-wine focus:bg-white focus:ring-2 focus:ring-wine/15 transition-all';

const LABEL =
  'flex items-center gap-1.5 text-[11px] font-bold text-wine/75 uppercase tracking-wider mb-1.5';

/** Debe coincidir con la duración de `.modal-panel.is-closing` en index.css. */
const CLOSE_MS = 180;

export const ShareModal: React.FC<ShareModalProps> = ({ open, onClose, data, cardUrl }) => {
  const [copy, setCopy] = useState<CopyState>('idle');
  const [exporting, setExporting] = useState(false);
  const [email, setEmail] = useState('');
  const [closing, setClosing] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const copyTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  const recipient = data.recipient?.trim() || 'esa persona';
  const title = data.title?.trim() || 'Una carta especial';
  const sender = data.sender?.trim();

  const emailValid = EMAIL_RE.test(email.trim());

  /**
   * El desmontaje espera a que corra la animación de salida. El padre no se
   * entera hasta el final, así que `open` sigue en true mientras cierra.
   */
  const handleClose = useCallback(() => {
    if (closeTimer.current) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      setClosing(false);
      setCopy('idle');
      onClose();
    }, CLOSE_MS);
  }, [onClose]);

  // Cerrar con Escape y bloquear el scroll del fondo mientras está abierto
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, handleClose]);

  useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    setCopy((await copyToClipboard(cardUrl)) ? 'copied' : 'failed');
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopy('idle'), 2400);
  }, [cardUrl]);

  const handleDownloadHtml = useCallback(async () => {
    setExporting(true);
    try {
      await downloadCardHtml(data);
    } finally {
      setExporting(false);
    }
  }, [data]);

  /**
   * Abre el cliente de correo con destinatario, asunto y cuerpo ya redactados.
   * mailto: no admite adjuntos, así que viaja el enlace: el QR y el .html se
   * descargan aparte y se adjuntan a mano, o los envía el backend cuando exista.
   */
  const mailtoHref = useMemo(() => {
    const body = [
      `Hola ${recipient},`,
      '',
      'Te escribí algo. Ábrelo aquí:',
      cardUrl,
      '',
      sender ? `— ${sender}` : 'Con cariño.',
    ].join('\n');

    const params = new URLSearchParams({ subject: `${title} — para ${recipient}`, body });
    return `mailto:${encodeURIComponent(email.trim())}?${params.toString().replace(/\+/g, '%20')}`;
  }, [cardUrl, email, recipient, sender, title]);

  if (!open) return null;

  return (
    <div
      className={`modal-backdrop fixed inset-0 z-100 flex items-center justify-center p-3 md:p-5 bg-wine-deep/60 backdrop-blur-sm ${
        closing ? 'is-closing' : ''
      }`}
      onClick={handleClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        onClick={(e) => e.stopPropagation()}
        className={`modal-panel relative w-full max-w-4xl max-h-[96vh] overflow-y-auto rounded-4xl bg-white shadow-[0_50px_110px_-35px_rgba(94,10,27,0.75)] border border-wine/15 ${
          closing ? 'is-closing' : ''
        }`}
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-wine-deep via-wine to-tertiary rounded-t-4xl"></div>
        <HeartConfetti count={12} tone="rose" opacity={0.06} className="z-0" />

        <button
          ref={closeRef}
          type="button"
          onClick={handleClose}
          aria-label="Cerrar"
          className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full flex items-center justify-center text-wine hover:bg-blush transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="relative z-10 px-6 md:px-9 py-7 grid lg:grid-cols-[1fr_auto] gap-8 lg:gap-11 items-center">
          {/* El QR va a la derecha en escritorio y arriba cuando la columna colapsa */}
          <div className="modal-stagger-2 order-first lg:order-last flex justify-center pt-7 lg:pt-4">
            <ThemeQRCode data={data} cardUrl={cardUrl} size={244} />
          </div>

          <div className="modal-stagger-1 flex flex-col gap-5 min-w-0">
            <header>
              <span className="inline-flex items-center gap-1.5 bg-blush text-wine-deep text-[11px] font-bold px-3 py-1 rounded-full ring-1 ring-wine/15 mb-2.5">
                <span
                  className="material-symbols-outlined text-[14px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  favorite
                </span>
                Tu dedicatoria está lista
              </span>

              <h2 id="share-modal-title" className="font-headline-md text-2xl text-on-background">
                Ya puedes{' '}
                <span className="font-script font-normal text-wine text-[1.4em] leading-none">
                  compartirla
                </span>
              </h2>
            </header>

            {/* Enlace */}
            <section>
              <label htmlFor="share-url" className={LABEL}>
                <span className="material-symbols-outlined text-[15px]">link</span>
                Enlace de la carta
              </label>
              <div className="flex gap-2">
                <input
                  id="share-url"
                  readOnly
                  value={cardUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className={`${FIELD} flex-1 text-on-surface`}
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 inline-flex items-center gap-1.5 px-4 rounded-xl bg-wine text-white font-semibold text-sm hover:bg-primary transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">
                    {copy === 'copied' ? 'check' : 'content_copy'}
                  </span>
                  {copy === 'copied' ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs mt-1.5 min-h-4 text-wine/60" role="status">
                {copy === 'copied' && 'Enlace copiado al portapapeles.'}
                {copy === 'failed' && 'No se pudo copiar. Cópialo a mano.'}
                {copy === 'idle' && 'Se abre a pantalla completa, con música y fotos.'}
              </p>
            </section>

            <div className="h-px rule-gold"></div>

            {/* Correo */}
            <section>
              <label htmlFor="share-email" className={LABEL}>
                <span className="material-symbols-outlined text-[15px]">mail</span>
                Enviar por correo
              </label>
              <div className="flex gap-2">
                <input
                  id="share-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={email.length > 0 && !emailValid}
                  className={`${FIELD} flex-1`}
                />
                <a
                  href={emailValid ? mailtoHref : undefined}
                  aria-disabled={!emailValid}
                  onClick={(e) => {
                    if (!emailValid) e.preventDefault();
                  }}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-4 rounded-xl font-semibold text-sm transition-colors ${
                    emailValid
                      ? 'bg-wine text-white hover:bg-primary cursor-pointer'
                      : 'bg-wine/25 text-white/80 cursor-not-allowed'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">send</span>
                  Enviar
                </a>
              </div>
              <p className="text-xs mt-1.5 min-h-4 text-wine/60">
                {email.length > 0 && !emailValid
                  ? 'Revisa el correo: falta el @ o el dominio.'
                  : 'Se abre tu app de correo con el mensaje redactado.'}
              </p>
            </section>

            <div className="h-px rule-gold"></div>

            {/* Descarga de la carta */}
            <section>
              <span className={LABEL}>
                <span className="material-symbols-outlined text-[15px]">draft</span>
                Entregarla en mano
              </span>
              <button
                type="button"
                onClick={handleDownloadHtml}
                disabled={exporting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-[1.5px] border-wine/35 text-wine font-semibold text-sm hover:bg-blush/70 hover:border-wine transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
              >
                <span className="material-symbols-outlined text-[17px]">download</span>
                {exporting ? 'Generando…' : 'Descargar carta HTML'}
              </button>
              <p className="text-xs mt-1.5 text-wine/60">
                Un archivo que abre solo en cualquier navegador, sin internet.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
