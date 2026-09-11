import React, { type BaseSyntheticEvent } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { CheckoutInput, CheckoutStatus, CheckoutValues } from '../../../hooks/useCheckoutFlow';
import { MAX_PASSWORD, MIN_PASSWORD } from '../../../../auth/services/auth';
import type { Terms } from '../../../../legal/services/legal';
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
 *
 * Aquí va también el consentimiento, porque es el paso en el que se crea la cuenta.
 * Sigue siendo una **vista pura**: no pide los términos ni sabe que existe una API,
 * se los dan hechos.
 */

interface PasswordStepProps {
  form: UseFormReturn<CheckoutInput, unknown, CheckoutValues>;
  status: CheckoutStatus;
  busy: boolean;
  /** Términos vigentes; `null` mientras cargan o si fallaron. */
  terms: Terms | null;
  termsError: string | null;
  onReadTerms: () => void;
  onRetryTerms: () => void;
  onSubmit: (event: BaseSyntheticEvent) => void;
  onBack: () => void;
}

export const PasswordStep: React.FC<PasswordStepProps> = ({
  form,
  status,
  busy,
  terms,
  termsError,
  onReadTerms,
  onRetryTerms,
  onSubmit,
  onBack,
}) => {
  const {
    register,
    formState: { errors, dirtyFields, isSubmitted },
  } = form;

  /**
   * La casilla nace sin marcar y eso es un error del esquema desde el primer render.
   * Enseñarlo antes de que nadie la haya visto sería gritarle a quien todavía está
   * escribiendo la contraseña, así que el aviso espera a que se intente enviar o a
   * que la casilla se toque.
   */
  const consentProblem =
    isSubmitted || dirtyFields.acceptsTerms ? errors.acceptsTerms?.message : undefined;

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

      {/*
        El consentimiento va pegado al botón que crea la cuenta, no tres pantallas
        antes: la autorización se otorga en el momento del acto, que es lo que la
        Ley 1581 llama "previa, expresa e informada".

        La casilla NUNCA nace marcada. Una casilla premarcada no es consentimiento
        válido, y además es el patrón que sanciona la SIC.
      */}
      <div className="border-t border-wine/10 pt-4">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            {...register('acceptsTerms')}
            aria-invalid={Boolean(consentProblem)}
            aria-describedby={consentProblem ? 'buy-terms-error' : undefined}
            className="mt-0.5 size-4 shrink-0 accent-wine cursor-pointer"
          />
          <span className="text-sm text-on-surface-variant leading-snug">
            Acepto los{' '}
            <button
              type="button"
              onClick={onReadTerms}
              disabled={!terms}
              className="font-semibold text-wine underline underline-offset-4 decoration-wine/40 hover:text-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            >
              Términos y la Política de Tratamiento de Datos
            </button>
            .
          </span>
        </label>
        <FieldError id="buy-terms-error" message={consentProblem} />

        {/*
          El resumen es lo que de verdad informa: nadie lee cuatro páginas, y
          "informada" es un requisito legal, no una cortesía. Estas son las dos
          cláusulas que el negocio necesita que se entiendan.
        */}
        <ul className="mt-2.5 space-y-1 text-xs text-wine/70 leading-relaxed">
          <li className="flex items-start gap-1.5">
            <span className="material-symbols-outlined text-[14px] mt-px">photo_camera</span>
            Nos autorizas a procesar tus fotografías para componer tu carta.
          </li>
          <li className="flex items-start gap-1.5">
            <span className="material-symbols-outlined text-[14px] mt-px">download</span>
            Tu Carta HTML la descargas y la guardas tú: no la alojamos para siempre.
          </li>
        </ul>

        {/*
          Sin la versión vigente no se puede registrar a nadie: guardaríamos un
          consentimiento sin saber a qué texto corresponde. Por eso hay reintento y
          no solo un aviso: si no, un corte de red dejaría el alta muerta.
        */}
        {termsError && (
          <p className="text-sm text-error font-medium mt-2 flex items-center gap-2" role="alert">
            <span>{termsError}</span>
            <button
              type="button"
              onClick={onRetryTerms}
              className="font-semibold text-wine underline underline-offset-4 decoration-wine/40 hover:text-primary transition-colors cursor-pointer"
            >
              Reintentar
            </button>
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={busy || !terms}
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
