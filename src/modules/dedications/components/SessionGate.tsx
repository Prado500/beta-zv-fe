import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ModalShell } from '../../../components/ui/ModalShell';
import { FieldError } from '../../../components/ui/FieldError';
import { fieldClass, fieldTone, LABEL } from '../../../components/ui/formStyles';
import { Ornament } from '../../../components/decor';
import { useSessionGate } from '../hooks/useSessionGate';

/**
 * La puerta del panel: "Inicia sesión para ver tus dedicatorias".
 *
 * Se monta cuando el listado responde 401 y se desmonta en cuanto la sesión
 * existe; por eso no lleva `open` ni botón de cerrar: sin sesión no hay nada
 * detrás que ver, y la única salida honesta es volver al inicio.
 *
 * No hay registro aquí a propósito. La cuenta se crea al comprar (es el único
 * camino que deja una compra pagada que listar), así que a quien no tiene cuenta
 * se le manda a la página principal, no a un formulario que acabaría en un panel
 * vacío.
 */

interface SessionGateProps {
  /** Se llama con la sesión ya abierta; el panel vuelve a pedir el listado. */
  onLoggedIn: () => void;
}

export const SessionGate: React.FC<SessionGateProps> = ({ onLoggedIn }) => {
  const { form, busy, error, submit } = useSessionGate(onLoggedIn);
  const {
    register,
    setFocus,
    formState: { errors, dirtyFields },
  } = form;

  // El foco entra con la puerta: quien llega por teclado empieza a escribir sin
  // tener que buscar el primer campo detrás de un fondo difuminado.
  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  const tone = (field: 'email' | 'password') =>
    fieldTone(Boolean(errors[field]), Boolean(dirtyFields[field]));

  return (
    <ModalShell labelledBy="session-gate-title">
      <div className="flex flex-col items-center text-center mb-5">
        <span className="w-14 h-14 rounded-full bg-blush flex items-center justify-center ring-4 ring-blush/50 mb-3">
          <span
            className="material-symbols-outlined text-wine text-[28px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            lock_open
          </span>
        </span>
        <h2
          id="session-gate-title"
          className="font-headline-md text-xl font-bold text-on-background"
        >
          Inicia sesión para ver tus{' '}
          <span className="font-script font-normal text-wine text-[1.6em] leading-none">
            dedicatorias
          </span>
        </h2>
        <Ornament tone="gold" width={140} className="mx-auto mt-1" />
        <p className="font-body-md text-sm text-on-surface-variant leading-relaxed mt-3">
          Entra con el correo y la contraseña que usaste al comprar.
        </p>
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div>
          <label className={LABEL} htmlFor="session-email">
            Tu correo
          </label>
          <input
            id="session-email"
            type="email"
            {...register('email')}
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'session-email-error' : undefined}
            className={fieldClass(tone('email'))}
          />
          <FieldError id="session-email-error" message={errors.email?.message} />
        </div>

        <div>
          <label className={LABEL} htmlFor="session-password">
            Contraseña
          </label>
          <input
            id="session-password"
            type="password"
            {...register('password')}
            autoComplete="current-password"
            maxLength={128}
            placeholder="Tu contraseña"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'session-password-error' : undefined}
            className={fieldClass(tone('password'))}
          />
          <FieldError id="session-password-error" message={errors.password?.message} />
        </div>

        {error && (
          <p className="text-sm text-error font-medium text-center" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 w-full py-3.5 rounded-full bg-wine text-white font-semibold text-sm shadow-lg hover:bg-primary transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-wait disabled:opacity-70"
        >
          {busy ? 'Entrando…' : 'Entrar'}
          <span className="material-symbols-outlined text-[18px]">
            {busy ? 'hourglass_top' : 'login'}
          </span>
        </button>

        <Link
          to="/"
          className="w-full py-3 rounded-full border border-wine/25 text-wine font-semibold text-sm hover:bg-blush/50 transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver al inicio
        </Link>

        <p className="text-xs text-wine/60 leading-relaxed text-center">
          ¿Todavía no tienes cuenta? Se crea sola al comprar tu primera dedicatoria desde la
          página principal.
        </p>
      </form>
    </ModalShell>
  );
};
