import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CornerFlourish, HeartConfetti, Ornament, Rose } from '../../../components/decor';
import { DedicationCard } from '../components/DedicationCard';
import { QrModal } from '../components/QrModal';
import { ResendModal } from '../components/ResendModal';
import { SessionGate } from '../components/SessionGate';
import { useMyDedications } from '../hooks/useMyDedications';
import { useSignOut } from '../../auth/hooks/useSignOut';
import type { Dedication } from '../services/dedications';

/**
 * Panel posventa: "Mis dedicatorias". Solo pinta.
 *
 * Quien pide el listado, interpreta el 401 y decide si hay sesión es
 * `useMyDedications`; quien cierra la sesión es `useSignOut`. Aquí no hay ni un
 * `fetch` ni un `if` sobre códigos de estado: la página recibe un estado y le
 * pone cara.
 *
 * La puerta de sesión no es un envoltorio de la ruta sino un modal que la
 * página monta encima cuando el listado dice 401, igual que la landing monta el
 * de compra. Así hay una sola sonda (el listado) y una sola puerta, también
 * cuando la sesión caduca a medio uso o se cierra desde la cabecera.
 *
 * Los modales (puerta, postal del QR y reenvío) se montan solo mientras están
 * abiertos, como en el editor: cada apertura nace con los datos de la fila que
 * la abrió y no hay nada que sincronizar al cambiar de tarjeta. La postal lleva
 * además una `key` por compra: si la fila cambiara sin pasar por cerrar, se
 * remonta entera y nada de la carta anterior se queda en la siguiente.
 */

const Loading = () => (
  <div className="flex flex-col items-center py-16" role="status" aria-live="polite">
    <span className="material-symbols-outlined text-wine text-[32px] animate-spin">
      progress_activity
    </span>
    <p className="text-sm text-wine/70 mt-3">Buscando tus dedicatorias…</p>
  </div>
);

interface ErrorCardProps {
  message: string | null;
  onRetry: () => void;
}

const ErrorCard = ({ message, onRetry }: ErrorCardProps) => (
  <div className="relative max-w-lg mx-auto bg-white rounded-4xl border border-wine/12 shadow-[0_26px_56px_-24px_rgba(94,10,27,0.45)] px-7 py-9 text-center overflow-hidden">
    <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-wine-deep via-wine to-tertiary" />
    <CornerFlourish corner="tl" tone="gold" size={52} className="opacity-60" />
    <CornerFlourish corner="br" tone="gold" size={52} className="opacity-60" />
    <span className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center ring-4 ring-error/10 mx-auto mb-4">
      <span className="material-symbols-outlined text-error text-[28px]">error</span>
    </span>
    <h2 className="font-headline-md text-xl font-bold text-on-background">
      No pudimos cargar tus dedicatorias
    </h2>
    <Ornament tone="gold" width={150} className="mx-auto my-3" />
    <p className="font-body-md text-sm text-on-surface-variant leading-relaxed" role="alert">
      {message}
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-6 px-7 py-3.5 rounded-full bg-wine text-white font-semibold text-sm shadow-lg hover:bg-primary transition-colors inline-flex items-center gap-2 cursor-pointer"
    >
      <span className="material-symbols-outlined text-[18px]">refresh</span>
      Reintentar
    </button>
  </div>
);

const EmptyState = () => (
  <div className="relative max-w-lg mx-auto bg-white rounded-4xl border border-wine/12 shadow-[0_26px_56px_-24px_rgba(94,10,27,0.45)] px-7 py-10 text-center overflow-hidden">
    <Rose
      size={110}
      className="pointer-events-none absolute -left-8 -bottom-10 opacity-20 -rotate-12"
    />
    <Rose
      size={90}
      className="pointer-events-none absolute -right-6 -bottom-8 opacity-20 rotate-[24deg]"
    />
    <span className="relative w-14 h-14 rounded-full bg-blush flex items-center justify-center ring-4 ring-blush/50 mx-auto mb-4">
      <span className="material-symbols-outlined text-wine text-[28px]">history_edu</span>
    </span>
    <h2 className="relative font-headline-md text-xl font-bold text-on-background">
      Todavía no tienes{' '}
      <span className="font-script font-normal text-wine text-[1.5em] leading-none">
        dedicatorias
      </span>
    </h2>
    <Ornament tone="gold" width={150} className="mx-auto my-3" />
    <p className="relative font-body-md text-sm text-on-surface-variant leading-relaxed">
      Cuando compres tu primera carta aparecerá aquí, con su enlace, su QR y la opción de
      reenviarla.
    </p>
    {/*
      Enlace completo y no `Link`: el ancla `#pricing` solo desplaza la página
      si el navegador la carga entera; con una navegación del router se
      quedaría arriba del todo.
    */}
    <a
      href="/#pricing"
      className="relative mt-6 px-7 py-3.5 rounded-full bg-wine text-white font-semibold text-sm shadow-lg hover:bg-primary transition-colors inline-flex items-center gap-2"
    >
      Crear mi primera dedicatoria
      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
    </a>
  </div>
);

export default function MyDedicationsPage() {
  const panel = useMyDedications();
  const session = useSignOut(panel.expire);
  const [qrFor, setQrFor] = useState<Dedication | null>(null);
  const [resendFor, setResendFor] = useState<Dedication | null>(null);

  const gated = panel.status === 'unauthenticated';

  /** Un 401 dentro del reenvío: se cierra el modal y la puerta vuelve a aparecer. */
  const expireFromResend = () => {
    setResendFor(null);
    panel.expire();
  };

  return (
    <div className="relative w-full min-h-screen paper-sheet paper-vignette text-on-background flex flex-col">
      <HeartConfetti count={16} tone="rose" opacity={0.06} fixed className="z-0" />

      <header className="w-full bg-paper/95 border-b border-wine/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span
              className="material-symbols-outlined text-[#D4AF37] text-[20px] transition-transform group-hover:scale-110"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
            <span className="font-script text-wine text-3xl leading-none pb-1">
              Eternal Dedications
            </span>
          </Link>
          <div className="flex items-center gap-4 shrink-0">
            <Link
              to="/"
              className="text-xs font-semibold text-wine hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span> Inicio
            </Link>
            {!gated && (
              <button
                type="button"
                onClick={() => void session.signOut()}
                disabled={session.busy}
                className="text-xs font-semibold text-wine hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-wait"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                {session.busy ? 'Saliendo…' : 'Cerrar sesión'}
              </button>
            )}
          </div>
        </div>
        <div className="h-px w-full rule-gold"></div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 md:py-10">
        <div className="text-center mb-8">
          <h1 className="font-headline-md text-2xl md:text-3xl font-bold text-on-background">
            Mis{' '}
            <span className="font-script font-normal text-wine text-[1.5em] leading-none">
              dedicatorias
            </span>
          </h1>
          <Ornament tone="gold" width={170} className="mx-auto my-2" />
          <p className="font-body-md text-sm md:text-base text-on-surface-variant">
            Tus cartas publicadas y las que dejaste a medias, listas para retomar.
          </p>
        </div>

        {session.error && (
          <p className="text-sm text-error font-medium text-center mb-6" role="alert">
            {session.error}
          </p>
        )}

        {panel.status === 'loading' && <Loading />}
        {panel.status === 'error' && <ErrorCard message={panel.error} onRetry={panel.reload} />}
        {panel.status === 'ready' && panel.items.length === 0 && <EmptyState />}
        {panel.status === 'ready' && panel.items.length > 0 && (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0">
            {panel.items.map((dedication) => (
              <li key={dedication.purchaseId}>
                <DedicationCard
                  dedication={dedication}
                  onShowQr={setQrFor}
                  onResend={setResendFor}
                />
              </li>
            ))}
          </ul>
        )}
      </main>

      {gated && <SessionGate onLoggedIn={panel.reload} />}

      {qrFor && (
        <QrModal key={qrFor.purchaseId} dedication={qrFor} onClose={() => setQrFor(null)} />
      )}

      {resendFor && resendFor.letterId && (
        <ResendModal
          dedication={resendFor}
          letterId={resendFor.letterId}
          onClose={() => setResendFor(null)}
          onUnauthorized={expireFromResend}
        />
      )}
    </div>
  );
}
