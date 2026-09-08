import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { CheckoutInput, CheckoutValues } from '../../../hooks/useCheckoutFlow';
import { FieldError } from '../../../../../components/ui/FieldError';
import { fieldClass, LABEL } from '../../../../../components/ui/formStyles';
import { useCountdown } from '../../../../../utils/useCountdown';

/**
 * Paso 2: el freno.
 *
 * El correo es lo único de esta pantalla que no tiene arreglo después —ahí llega
 * el enlace de la carta, y una errata no da ningún síntoma hasta que ya es
 * tarde—. Así que se enseña escrito, se dice qué va a llegar ahí y se deja
 * corregir en el sitio.
 *
 * No se pide teclearlo dos veces: nadie relee lo que acaba de escribir; se copia
 * y se pega, y la errata se duplica intacta.
 *
 * **Los tres segundos son el punto.** Quien viene en piloto automático de dar a
 * "siguiente" se encuentra con un botón que no responde y, durante ese rato, lo
 * único que puede hacer es leer su propio correo. Si se pudiera pulsar al
 * instante, esta pantalla sería un trámite más que se salta sin mirar.
 */

/** Segundos que el botón permanece bloqueado al entrar. */
export const CONFIRM_DELAY_SECONDS = 3;

interface EmailConfirmStepProps {
  form: UseFormReturn<CheckoutInput, unknown, CheckoutValues>;
  onConfirm: () => void;
  onBack: () => void;
}

export const EmailConfirmStep: React.FC<EmailConfirmStepProps> = ({ form, onConfirm, onBack }) => {
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  // `PurchaseModal` monta este paso solo mientras se está en él, así que la
  // cuenta arranca con la pantalla y vuelve a arrancar si se sale y se entra
  // otra vez: rebotar entre pasos no sirve para saltarse el freno.
  const left = useCountdown(CONFIRM_DELAY_SECONDS);
  const locked = left > 0;

  // Se lee del formulario, no de un estado local: el input de abajo es el mismo
  // campo `email` del paso anterior, así que lo que se corrija aquí es lo que se
  // registra. Copiarlo a un `useState` es cómo se acaba enviando el viejo.
  const value = watch('email');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        // El Enter respeta el bloqueo igual que el ratón; si no, el freno duraría
        // lo que tarda alguien en apoyar el meñique en la tecla.
        if (!locked) onConfirm();
      }}
      noValidate
      className="relative flex flex-col items-center text-center"
    >
      <span className="w-14 h-14 rounded-full bg-blush flex items-center justify-center ring-4 ring-blush/50 mb-3">
        <span
          className="material-symbols-outlined text-wine text-[28px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          forward_to_inbox
        </span>
      </span>

      <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
        ¿Estás seguro de que este es tu correo? A esta dirección (
        <strong className="text-wine break-all">{value}</strong>) llegará el enlace de tu carta y
        el comprobante de tu compra. Revisa que no haya errores de tipeo.
      </p>

      <div className="w-full mt-5 text-left">
        <label className={LABEL} htmlFor="buy-email-confirm">
          Corrígelo aquí si hace falta
        </label>
        <input
          id="buy-email-confirm"
          type="email"
          {...register('email')}
          autoComplete="email"
          spellCheck={false}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'buy-email-confirm-error' : undefined}
          className={fieldClass(errors.email ? 'error' : 'idle', 'text-center font-medium')}
        />
        <FieldError id="buy-email-confirm-error" message={errors.email?.message} />
      </div>

      <div className="mt-6 w-full flex flex-col gap-2.5">
        <button
          type="submit"
          disabled={locked}
          className="w-full py-3.5 rounded-full bg-wine text-white font-semibold text-sm shadow-lg hover:bg-primary transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-wine"
        >
          {locked ? `Continuar en ${left}...` : 'Sí, continuar'}
          <span className="material-symbols-outlined text-[18px]">
            {locked ? 'hourglass_top' : 'check'}
          </span>
        </button>
        <button
          type="button"
          onClick={onBack}
          className="w-full py-3 rounded-full border border-wine/25 text-wine font-semibold text-sm hover:bg-blush/50 transition-colors cursor-pointer"
        >
          No, quiero corregirlo
        </button>
      </div>

      {/*
        El contador vive en la etiqueta del botón, que es donde se mira. Anunciar
        cada tic por voz sería un martilleo; lo que se anuncia es el desenlace.
      */}
      <p className="sr-only" aria-live="polite">
        {locked ? '' : 'Ya puedes continuar.'}
      </p>
    </form>
  );
};
