import React, { type BaseSyntheticEvent } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type {
  CheckoutInput,
  CheckoutIntent,
  CheckoutStatus,
  CheckoutValues,
} from '../../../hooks/useCheckoutFlow';
import { CredentialFields } from '../../../../auth/components/CredentialFields';

/**
 * La puerta de quien vuelve: correo y contraseña, y ya.
 *
 * Sin nombre, sin freno de tres segundos, sin segunda contraseña: todo eso
 * protegía un alta, y aquí no se da de alta nada. Lo que se protege es el
 * tiempo de la persona, que ya pasó por todo eso la primera vez.
 *
 * Los campos son los mismos que en la puerta del panel (`CredentialFields`):
 * misma cara, mismo gestor de contraseñas, misma validación.
 */

interface LoginStepProps {
  form: UseFormReturn<CheckoutInput, unknown, CheckoutValues>;
  status: CheckoutStatus;
  busy: boolean;
  intent: CheckoutIntent;
  onSubmit: (event: BaseSyntheticEvent) => void;
  onSwitchToRegister: () => void;
}

const label = (status: CheckoutStatus, intent: CheckoutIntent): string => {
  if (status === 'redirecting') return 'Abriendo Mercado Pago…';
  if (status === 'creating') return 'Creando tu compra…';
  if (status === 'authenticating') return 'Entrando…';
  return intent === 'checkout' ? 'Entrar y continuar al pago' : 'Entrar';
};

export const LoginStep: React.FC<LoginStepProps> = ({
  form,
  status,
  busy,
  intent,
  onSubmit,
  onSwitchToRegister,
}) => {
  const {
    register,
    formState: { errors, dirtyFields },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <CredentialFields
        idPrefix="buy"
        email={register('email')}
        password={register('password')}
        emailError={errors.email?.message}
        passwordError={errors.password?.message}
        emailTouched={Boolean(dirtyFields.email)}
        passwordTouched={Boolean(dirtyFields.password)}
      />

      <button
        type="submit"
        disabled={busy}
        className="mt-1 w-full py-3.5 rounded-full bg-wine text-white font-semibold text-sm shadow-lg hover:bg-primary transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-wait disabled:opacity-70"
      >
        {label(status, intent)}
        <span className="material-symbols-outlined text-[18px]">
          {busy ? 'hourglass_top' : 'login'}
        </span>
      </button>

      <p className="text-sm text-on-surface-variant text-center">
        ¿Primera vez aquí?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          disabled={busy}
          className="font-semibold text-wine underline underline-offset-4 decoration-wine/40 hover:text-primary hover:decoration-primary transition-colors cursor-pointer disabled:opacity-50"
        >
          Crea tu cuenta
        </button>
      </p>

      {intent === 'checkout' && (
        <p className="text-xs text-wine/60 leading-relaxed text-center">
          Te llevamos al checkout seguro de Mercado Pago. Al volver, el pago lo confirma nuestro
          servidor: nadie desbloquea la carta desde el navegador.
        </p>
      )}
    </form>
  );
};
