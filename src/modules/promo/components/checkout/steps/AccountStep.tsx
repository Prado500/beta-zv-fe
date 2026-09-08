import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { CheckoutInput, CheckoutValues } from '../../../hooks/useCheckoutFlow';
import { FieldError } from '../../../../../components/ui/FieldError';
import { fieldClass, fieldTone, HINT, LABEL } from '../../../../../components/ui/formStyles';

/**
 * Paso 1: quién es y a dónde le escribimos.
 *
 * Pinta y devuelve eventos, nada más. Ni valida ni decide cuándo se avanza: eso
 * lo resuelve `useCheckoutFlow`, que es quien sabe qué campos tiene este paso.
 */

interface AccountStepProps {
  form: UseFormReturn<CheckoutInput, unknown, CheckoutValues>;
  onNext: () => void;
}

export const AccountStep: React.FC<AccountStepProps> = ({ form, onNext }) => {
  const {
    register,
    formState: { errors, dirtyFields },
  } = form;

  const tone = (field: 'name' | 'email') =>
    fieldTone(Boolean(errors[field]), Boolean(dirtyFields[field]));

  return (
    // Enter avanza igual que el botón: en un formulario de dos campos, obligar
    // al ratón para pasar de paso es fricción gratuita.
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onNext();
      }}
      noValidate
      className="flex flex-col gap-4"
    >
      <div>
        <label className={LABEL} htmlFor="buy-name">
          Tu nombre
        </label>
        <input
          id="buy-name"
          {...register('name')}
          maxLength={120}
          autoComplete="name"
          placeholder="Sebastián"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'buy-name-error' : undefined}
          className={fieldClass(tone('name'))}
        />
        <FieldError id="buy-name-error" message={errors.name?.message} />
      </div>

      <div>
        <label className={LABEL} htmlFor="buy-email">
          Tu correo
        </label>
        <input
          id="buy-email"
          type="email"
          {...register('email')}
          autoComplete="email"
          placeholder="tucorreo@ejemplo.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'buy-email-error' : undefined}
          className={fieldClass(tone('email'))}
        />
        <FieldError id="buy-email-error" message={errors.email?.message} />
        <p className={HINT}>
          <span className="material-symbols-outlined text-[15px]">mail</span>
          Aquí te llegará el enlace de tu carta cuando esté lista.
        </p>
      </div>

      <button
        type="submit"
        className="mt-1 w-full py-3.5 rounded-full bg-wine text-white font-semibold text-sm shadow-lg hover:bg-primary transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        Siguiente
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </button>
    </form>
  );
};
