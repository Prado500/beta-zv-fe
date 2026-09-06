import React, { useEffect } from 'react';
import { useCheckoutFlow } from '../../hooks/useCheckoutFlow';
import { MIN_PASSWORD } from '../../services/checkout';
import { Ornament, CornerFlourish } from '../../../../components/decor';
import { FieldError } from '../../../../components/ui/FieldError';
import { fieldClass, fieldTone, HINT, LABEL } from '../../../../components/ui/formStyles';

/**
 * Puerta de entrada a la compra: crear la cuenta y salir hacia Mercado Pago.
 *
 * Este componente no habla con la API. Pinta lo que `useCheckoutFlow` le dice y
 * le devuelve los eventos; toda la secuencia —registro, sesión, intención de
 * compra y redirección— vive en el hook (View / ViewModel).
 *
 * Ya no existe el botón de "simular pago". El pago ocurre fuera, en la pasarela,
 * y se confirma a la vuelta en `/pago/retorno` contra el servidor: esta pantalla
 * nunca decide que algo está pagado.
 */

interface PurchaseModalProps {
  open: boolean;
  onClose: () => void;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({ open, onClose }) => {
  const { form, status, busy, error, submit, reset } = useCheckoutFlow();
  const {
    register,
    setFocus,
    formState: { errors, dirtyFields },
  } = form;

  // Cada apertura empieza limpia: ni el error de ayer ni la clave de idempotencia
  // del intento anterior deberían sobrevivir a cerrar el modal.
  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (open) setFocus('name');
  }, [open, setFocus]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const tone = (field: 'name' | 'email' | 'password') =>
    fieldTone(Boolean(errors[field]), Boolean(dirtyFields[field]));

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center px-4 py-8 bg-wine-deep/45 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-title"
      onClick={() => !busy && onClose()}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-4xl shadow-2xl border border-wine/15 p-7 md:p-8 overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-wine-deep via-wine to-tertiary" />
        <CornerFlourish corner="tl" tone="gold" size={56} className="opacity-60" />
        <CornerFlourish corner="br" tone="gold" size={56} className="opacity-60" />

        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-wine/60 hover:text-wine transition-colors disabled:opacity-40 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="text-center mb-5">
          <h2 id="purchase-title" className="font-headline-md text-xl font-bold text-on-background">
            Crea tu{' '}
            <span className="font-script font-normal text-wine text-[1.6em] leading-none">
              cuenta
            </span>
          </h2>
          <Ornament tone="gold" width={140} className="mx-auto mt-1" />
        </div>

        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
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

          <div>
            <label className={LABEL} htmlFor="buy-password">
              Contraseña
            </label>
            <input
              id="buy-password"
              type="password"
              {...register('password')}
              maxLength={128}
              autoComplete="new-password"
              placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'buy-password-error' : undefined}
              className={fieldClass(tone('password'))}
            />
            <FieldError id="buy-password-error" message={errors.password?.message} />
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

          <p className="text-xs text-wine/60 leading-relaxed text-center">
            Te llevamos al checkout seguro de Mercado Pago. Al volver, el pago lo confirma
            nuestro servidor: nadie desbloquea la carta desde el navegador.
          </p>
        </form>

        {error && (
          <p className="text-sm text-error font-medium text-center mt-4" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
