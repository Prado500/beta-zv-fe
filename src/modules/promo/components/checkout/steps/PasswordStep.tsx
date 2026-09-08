import React, { type BaseSyntheticEvent } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { CheckoutInput, CheckoutStatus, CheckoutValues } from '../../../hooks/useCheckoutFlow';
import { MAX_PASSWORD, MIN_PASSWORD } from '../../../services/checkout';
import { FieldError } from '../../../../../components/ui/FieldError';
import { fieldClass, fieldTone, HINT, LABEL } from '../../../../../components/ui/formStyles';

/**
 * Paso 3: la contraseña, dos veces.
 *
 * Aquí sí se teclea dos veces, y por el motivo contrario al del correo: lo que
 * se escribe está oculto, así que la persona no puede releerlo ni copiarlo. La
 * segunda casilla es la única forma de que una errata salga a la luz antes de
 * que la cuenta quede creada con una contraseña que nadie sabe cuál es.
 *
 * Entre 4 y 10 caracteres y ninguna regla más: ni mayúsculas, ni dígitos, ni
 * símbolos. El `maxLength` corta antes de llegar al límite, así que el tope no
 * se descubre con un error en rojo sino porque el campo deja de escribir.
 */

interface PasswordStepProps {
  form: UseFormReturn<CheckoutInput, unknown, CheckoutValues>;
  status: CheckoutStatus;
  busy: boolean;
  onSubmit: (event: BaseSyntheticEvent) => void;
  onBack: () => void;
}

export const PasswordStep: React.FC<PasswordStepProps> = ({
  form,
  status,
  busy,
  onSubmit,
  onBack,
}) => {
  const {
    register,
    formState: { errors, dirtyFields },
  } = form;

  const tone = (field: 'password' | 'confirmPassword') =>
    fieldTone(Boolean(errors[field]), Boolean(dirtyFields[field]));

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label className={LABEL} htmlFor="buy-password">
          Contraseña
        </label>
        <input
          id="buy-password"
          type="password"
          {...register('password')}
          maxLength={MAX_PASSWORD}
          autoComplete="new-password"
          placeholder={`Entre ${MIN_PASSWORD} y ${MAX_PASSWORD} caracteres`}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'buy-password-error' : undefined}
          className={fieldClass(tone('password'))}
        />
        <FieldError id="buy-password-error" message={errors.password?.message} />
        <p className={HINT}>
          <span className="material-symbols-outlined text-[15px]">lock</span>
          Que sea fácil de recordar: no pedimos mayúsculas, números ni símbolos.
        </p>
      </div>

      <div>
        <label className={LABEL} htmlFor="buy-password-confirm">
          Confirmar contraseña
        </label>
        <input
          id="buy-password-confirm"
          type="password"
          {...register('confirmPassword')}
          maxLength={MAX_PASSWORD}
          autoComplete="new-password"
          placeholder="Escríbela otra vez"
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={errors.confirmPassword ? 'buy-password-confirm-error' : undefined}
          className={fieldClass(tone('confirmPassword'))}
        />
        <FieldError id="buy-password-confirm-error" message={errors.confirmPassword?.message} />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="mt-1 w-full py-3.5 rounded-full bg-wine text-white font-semibold text-sm shadow-lg hover:bg-primary transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-wait disabled:opacity-70"
      >
        {status === 'redirecting'
          ? 'Abriendo Mercado Pago…'
          : status === 'creating'
            ? 'Creando tu compra…'
            : 'Continuar al pago'}
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </button>

      <button
        type="button"
        onClick={onBack}
        disabled={busy}
        className="w-full py-3 rounded-full border border-wine/25 text-wine font-semibold text-sm hover:bg-blush/50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Volver
      </button>

      <p className="text-xs text-wine/60 leading-relaxed text-center">
        Te llevamos al checkout seguro de Mercado Pago. Al volver, el pago lo confirma nuestro
        servidor: nadie desbloquea la carta desde el navegador.
      </p>
    </form>
  );
};
