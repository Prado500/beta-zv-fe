import React from 'react';
import type { CheckoutStatus } from '../../../hooks/useCheckoutFlow';
import { initialsOf } from '../../../../auth/initials';
import type { UserResponse } from '../../../../auth/services/auth';

/**
 * Paso exprés: hay sesión, así que no se pregunta nada.
 *
 * La compra arranca sola al abrirse el modal; esta pantalla existe para tres
 * cosas que una redirección ciega no podría hacer. Dice **quién** está comprando,
 * que es lo que protege a quien encuentra una sesión ajena en un ordenador
 * compartido ("¿No eres tú?"). Da un sitio a los fallos —pasarela caída, sesión
 * caducada— con su botón de reintentar. Y cuenta qué está pasando en el segundo
 * que tarda la pasarela en responder, para que nadie pulse dos veces.
 *
 * El error se pinta aquí, en el hueco del estado, y no al pie del modal: es la
 * respuesta a "¿qué pasó?" y tiene que estar donde se estaba mirando.
 */

interface ExpressStepProps {
  user: UserResponse;
  status: CheckoutStatus;
  busy: boolean;
  /** Por qué no se pudo; sin él, en reposo, un mensaje genérico. */
  error: string | null;
  onRetry: () => void;
  onSwitchAccount: () => void;
}

const FALLBACK = 'No pudimos preparar tu compra.';

export const ExpressStep: React.FC<ExpressStepProps> = ({
  user,
  status,
  busy,
  error,
  onRetry,
  onSwitchAccount,
}) => {
  const working = status === 'creating' || status === 'redirecting';

  return (
    <div className="flex flex-col items-center text-center">
      <span
        aria-hidden="true"
        className="w-16 h-16 rounded-full bg-wine text-white ring-4 ring-[#D4AF37]/60 flex items-center justify-center text-lg font-bold tracking-wider"
      >
        {initialsOf(user.name, user.email)}
      </span>
      <p className="font-semibold text-on-background mt-3">{user.name || user.email}</p>
      {user.name && <p className="text-sm text-on-surface-variant break-all">{user.email}</p>}

      {working ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-5 w-full rounded-2xl bg-paper/70 border border-wine/10 px-4 py-3 flex items-center justify-center gap-2 text-sm text-wine font-medium min-h-12"
        >
          <span className="material-symbols-outlined text-[20px] animate-spin">
            progress_activity
          </span>
          {status === 'redirecting' ? 'Abriendo Mercado Pago…' : 'Creando tu compra…'}
        </div>
      ) : (
        <>
          <p
            role="alert"
            className="mt-5 w-full rounded-2xl bg-error/5 border border-error/20 px-4 py-3 text-sm text-error font-medium leading-relaxed"
          >
            {error ?? FALLBACK}
          </p>
          <button
            type="button"
            onClick={onRetry}
            disabled={busy}
            className="mt-4 w-full py-3.5 rounded-full bg-wine text-white font-semibold text-sm shadow-lg hover:bg-primary transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-wait disabled:opacity-70"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Reintentar
          </button>
        </>
      )}

      <button
        type="button"
        onClick={onSwitchAccount}
        disabled={busy}
        className="mt-4 text-xs font-semibold text-wine/70 hover:text-primary underline underline-offset-4 decoration-wine/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ¿No eres tú? Cambiar de cuenta
      </button>

      <p className="text-xs text-wine/60 leading-relaxed text-center mt-4">
        Te llevamos al checkout seguro de Mercado Pago. Al volver, el pago lo confirma nuestro
        servidor: nadie desbloquea la carta desde el navegador.
      </p>
    </div>
  );
};
