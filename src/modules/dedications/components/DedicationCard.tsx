import React, { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CornerFlourish } from '../../../components/decor';
import { formatDate } from '../../../utils/dates';
import { useCardExports } from '../../editor/hooks/useCardExports';
import { THEME_PRESETS, themeFromSlug } from '../../editor/types';
import { fetchPublishedLetter, viewerPathFor, type Dedication } from '../services/dedications';
import { DEDICATION_STATES } from './dedicationStates';

/**
 * Una fila del panel, como tarjeta.
 *
 * Solo pinta: recibe la fila tal como la manda el backend y decide qué enseñar
 * con el diccionario de estados. Las dos acciones que abren un modal (postal
 * del QR y reenvío) las delega a la página, que es quien monta los modales;
 * las que navegan (ver la carta, retomar) son enlaces, porque eso es lo que
 * son. La única que trabaja aquí es "Carta HTML", y la gobierna
 * `useCardExports`: la tarjeta no sabe cómo se pide la carta ni cómo se compone
 * el archivo, solo si el botón está ocupado y si algo falló.
 *
 * `draft` y `published` no son dos tarjetas con un `if` gigante: es una tarjeta
 * con dos vestimentas —marco punteado de sticker para lo que está a medias,
 * franja y filigrana para lo terminado— y un pie de acciones distinto.
 *
 * Retomar no carga nada: el editor arranca vacío y el backend sobrescribe el
 * borrador. Por eso la tarjeta lo dice antes de que se pulse, y por eso el
 * `purchaseId` viaja en el estado de la ruta y no en la URL, igual que a la
 * vuelta del pago.
 */

interface DedicationCardProps {
  dedication: Dedication;
  onShowQr: (dedication: Dedication) => void;
  onResend: (dedication: Dedication) => void;
}

const PRIMARY =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-wine text-white font-semibold text-xs shadow-[0_10px_24px_-10px_rgba(140,17,40,0.8)] hover:bg-primary transition-colors cursor-pointer';

const SECONDARY =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-wine/25 text-wine font-semibold text-xs hover:bg-blush/50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait disabled:hover:bg-transparent';

/** Nombre legible del tema a partir del slug que guarda el backend. */
const themeName = (slug: string | null): string | null =>
  slug ? THEME_PRESETS[themeFromSlug(slug)].name : null;

interface PublishedActionsProps {
  dedication: Dedication;
  /** Publicada con enlace: es lo que piden la postal, el archivo y el visor. */
  slug: string;
  onShowQr: (dedication: Dedication) => void;
  onResend: (dedication: Dedication) => void;
}

/**
 * Pie de una carta publicada. Va aparte para que el hook de las descargas
 * exista solo donde hay algo que descargar: un borrador no tiene carta que pedir.
 *
 * La carta entera se pide al pulsar "Carta HTML", no al pintar: el listado no
 * la trae, y pedir una por tarjeta solo para tener el botón listo sería gastar
 * peticiones en cartas que quizá nadie descargue.
 */
const PublishedActions: React.FC<PublishedActionsProps> = ({
  dedication,
  slug,
  onShowQr,
  onResend,
}) => {
  const { busy, error, downloadHtml } = useCardExports(() => fetchPublishedLetter(slug));

  return (
    <>
      {/* Nueva pestaña: el visor ocupa toda la pantalla y no tiene vuelta al panel. */}
      <a href={viewerPathFor(slug)} target="_blank" rel="noreferrer" className={PRIMARY}>
        <span className="material-symbols-outlined text-[16px]">visibility</span>
        Ver carta
      </a>
      <button type="button" onClick={() => onShowQr(dedication)} className={SECONDARY}>
        <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
        Postal QR
      </button>
      <button
        type="button"
        onClick={() => void downloadHtml()}
        disabled={busy !== null}
        className={SECONDARY}
      >
        <span className="material-symbols-outlined text-[16px]">description</span>
        {busy === 'html' ? 'Generando…' : 'Carta HTML'}
      </button>
      <button type="button" onClick={() => onResend(dedication)} className={SECONDARY}>
        <span className="material-symbols-outlined text-[16px]">forward_to_inbox</span>
        Reenviar correo
      </button>
      {error && (
        <p className="w-full text-xs text-error font-medium" role="alert">
          {error}
        </p>
      )}
    </>
  );
};

export const DedicationCard: React.FC<DedicationCardProps> = ({
  dedication,
  onShowQr,
  onResend,
}) => {
  const meta = DEDICATION_STATES[dedication.state];
  const published = dedication.state === 'published';
  /** Con `letterId` la carta se empezó alguna vez; sin él, la compra nunca llegó al editor. */
  const started = dedication.letterId !== null;
  const theme = themeName(dedication.theme);
  const paidAt = formatDate(dedication.paidAt);
  const publishedAt = formatDate(dedication.publishedAt);
  const titleId = `dedication-${dedication.purchaseId}-title`;
  const slug = dedication.publicSlug;

  let actions: ReactNode;
  if (published && slug) {
    actions = (
      <PublishedActions
        dedication={dedication}
        slug={slug}
        onShowQr={onShowQr}
        onResend={onResend}
      />
    );
  } else if (published) {
    // Contrato: una publicada siempre trae slug. Si un día no lo trae, se dice
    // en vez de pintar un botón que abre `/carta/`.
    actions = (
      <p className="text-xs text-wine/60">El enlace se está generando. Vuelve en un momento.</p>
    );
  } else {
    actions = (
      <Link
        to="/editor"
        state={{ purchaseId: dedication.purchaseId }}
        className={`${PRIMARY} w-full`}
      >
        <span className="material-symbols-outlined text-[16px]">edit</span>
        Retomar edición
      </Link>
    );
  }

  return (
    <article
      aria-labelledby={titleId}
      className={`relative h-full bg-white p-5 md:p-6 flex flex-col gap-4 overflow-hidden ${
        published
          ? 'rounded-3xl border border-wine/12 shadow-[0_18px_40px_-24px_rgba(94,10,27,0.45)]'
          : 'sticker-frame shadow-[0_12px_30px_-22px_rgba(94,10,27,0.35)]'
      }`}
    >
      {published && (
        <>
          <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-wine-deep via-wine to-tertiary" />
          <CornerFlourish corner="br" tone="gold" size={48} className="opacity-50" />
        </>
      )}

      <div className="relative flex items-start justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${meta.badgeClass}`}
        >
          <span
            className="material-symbols-outlined text-[15px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {meta.icon}
          </span>
          {meta.label}
        </span>
        <span className="text-[11px] font-semibold text-wine/55 text-right">{meta.hint}</span>
      </div>

      <div className="relative">
        <h3
          id={titleId}
          className="font-headline-md text-lg font-bold text-on-background leading-snug break-words"
        >
          {dedication.title ?? (started ? 'Sin título' : 'Carta sin empezar')}
        </h3>
        {dedication.recipientName ? (
          <p className="font-script text-wine text-2xl leading-none mt-1.5">
            Para {dedication.recipientName}
          </p>
        ) : (
          <p className="text-sm text-on-surface-variant mt-1">
            Pagaste, pero todavía no escribiste la carta.
          </p>
        )}
      </div>

      <dl className="relative text-xs text-on-surface-variant flex flex-col gap-1">
        {theme && (
          <div className="flex gap-1.5">
            <dt className="font-semibold text-wine/70">Tema:</dt>
            <dd>{theme}</dd>
          </div>
        )}
        {paidAt && (
          <div className="flex gap-1.5">
            <dt className="font-semibold text-wine/70">Pagada:</dt>
            <dd>{paidAt}</dd>
          </div>
        )}
        {published && publishedAt && (
          <div className="flex gap-1.5">
            <dt className="font-semibold text-wine/70">Publicada:</dt>
            <dd>{publishedAt}</dd>
          </div>
        )}
      </dl>

      {!published && started && (
        <p className="relative text-xs text-wine/60 leading-relaxed">
          Al retomarla empiezas de cero: lo que envíes reemplaza este borrador.
        </p>
      )}

      <div className="relative mt-auto pt-4 border-t border-wine/10 flex flex-wrap gap-2">
        {actions}
      </div>
    </article>
  );
};
