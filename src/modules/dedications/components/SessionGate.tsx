import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ModalShell } from '../../../components/ui/ModalShell';
import { Ornament } from '../../../components/decor';
import { CredentialFields } from '../../auth/components/CredentialFields';
import { useLogin } from '../../auth/hooks/useLogin';

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
 *
 * Los campos y el hook son los mismos que usa el modal de compra para entrar:
 * una sola forma de escribir el correo y la contraseña en toda la app.
 */

interface SessionGateProps {
  /** Se llama con la sesión ya abierta; el panel vuelve a pedir el listado. */
  onLoggedIn: () => void;
}

export const SessionGate: React.FC<SessionGateProps> = ({ onLoggedIn }) => {
  const { form, busy, error, submit } = useLogin(onLoggedIn);
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
        <CredentialFields
          idPrefix="session"
          email={register('email')}
          password={register('password')}
          emailError={errors.email?.message}
          passwordError={errors.password?.message}
          emailTouched={Boolean(dirtyFields.email)}
          passwordTouched={Boolean(dirtyFields.password)}
        />

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
