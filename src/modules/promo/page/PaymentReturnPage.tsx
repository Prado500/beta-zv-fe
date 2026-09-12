import { Link } from 'react-router-dom';
import { usePaymentReturn } from '../hooks/usePaymentReturn';
import { CornerFlourish, HeartConfetti, Ornament } from '../../../components/decor';

/**
 * Pantalla de vuelta de la pasarela (`/pago/retorno`).
 *
 * Solo pinta: quien pregunta al servidor si el pago es real es
 * `usePaymentReturn`. Cuando la respuesta es `paid` esta pantalla no llega a
 * verse — el hook manda al editor —, así que todo lo que hay aquí es la espera y
 * las tres formas de que la cosa no salga: pendiente, rechazado o error.
 *
 * Nunca dice "pagado" por su cuenta. El navegador vuelve de Mercado Pago con
 * unos parámetros en la URL que cualquiera puede escribir a mano.
 */

const ICONS: Record<string, string> = {
  pending: 'hourglass_top',
  rejected: 'credit_card_off',
  error: 'error',
};

const TITLES: Record<string, string> = {
  pending: 'Tu pago está en camino',
  rejected: 'El pago no se completó',
  error: 'No pudimos confirmar el pago',
};

export default function PaymentReturnPage() {
  const { stage, message, purchaseId, retry } = usePaymentReturn();
  const verifying = stage === 'verifying';

  return (
    <div className="relative min-h-screen paper-sheet paper-vignette text-on-background flex items-center justify-center px-4 py-10">
      <HeartConfetti count={14} tone="rose" opacity={0.07} fixed className="z-0" />

      <div className="relative z-10 w-full max-w-lg bg-white rounded-4xl shadow-[0_26px_56px_-24px_rgba(94,10,27,0.45)] border border-wine/12 px-7 py-10 md:px-10 text-center overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-wine-deep via-wine to-tertiary" />
        <CornerFlourish corner="tl" tone="gold" size={58} className="opacity-65" />
        <CornerFlourish corner="br" tone="gold" size={58} className="opacity-65" />

        {verifying ? (
          <div className="flex flex-col items-center" role="status" aria-live="polite">
            <span className="w-16 h-16 rounded-full bg-blush flex items-center justify-center ring-4 ring-blush/50 mb-4">
              <span className="material-symbols-outlined text-wine text-[30px] animate-spin">
                progress_activity
              </span>
            </span>
            <h1 className="font-headline-md text-2xl font-bold">
              Confirmando tu{' '}
              <span className="font-script font-normal text-wine text-[1.4em] leading-none">
                pago
              </span>
            </h1>
            <Ornament tone="gold" width={160} className="mx-auto my-3" />
            <p className="font-body-md text-on-surface-variant leading-relaxed">
              Estamos verificando con Mercado Pago. No cierres ni recargues esta pestaña; tarda
              solo unos segundos.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center ring-4 ring-error/10 mb-4">
              <span className="material-symbols-outlined text-error text-[30px]">
                {ICONS[stage] ?? 'error'}
              </span>
            </span>
            <h1 className="font-headline-md text-2xl font-bold">{TITLES[stage] ?? TITLES.error}</h1>
            <Ornament tone="gold" width={160} className="mx-auto my-3" />

            <p className="font-body-md text-on-surface-variant leading-relaxed" role="alert">
              {message}
            </p>

            {purchaseId && (
              <p className="text-[11px] text-wine/50 mt-3">
                Referencia de tu compra: <span className="font-mono">{purchaseId}</span>
              </p>
            )}

            <div className="mt-7 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={retry}
                className="px-7 py-3.5 rounded-full bg-wine text-white font-semibold text-sm shadow-lg hover:bg-primary transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                Volver a comprobar
              </button>
              <Link
                to="/"
                className="px-7 py-3.5 rounded-full border border-wine/25 text-wine font-semibold text-sm hover:bg-blush/50 transition-colors flex items-center gap-2"
              >
                Volver al inicio
              </Link>
            </div>

            <p className="text-xs text-wine/55 mt-6 leading-relaxed">
              Si el dinero ya salió de tu cuenta, escríbenos con la referencia de arriba: la
              compra queda registrada en el servidor y podemos recuperarla.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
