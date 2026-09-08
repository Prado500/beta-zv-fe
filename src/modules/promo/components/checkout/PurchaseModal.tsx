import React, { useEffect } from 'react';
import { useCheckoutFlow } from '../../hooks/useCheckoutFlow';
import { AccountStep } from './steps/AccountStep';
import { EmailConfirmStep } from './steps/EmailConfirmStep';
import { PasswordStep } from './steps/PasswordStep';
import { Ornament, CornerFlourish } from '../../../../components/decor';

/**
 * Puerta de entrada a la compra: crear la cuenta y salir hacia Mercado Pago.
 *
 * Este componente no habla con la API ni valida nada. Es la cáscara —overlay,
 * cierre, foco, título— y decide qué paso se pinta; la secuencia entera
 * —registro, sesión, intención de compra y redirección— vive en
 * `useCheckoutFlow` (View / ViewModel).
 *
 * El alta va en tres tramos y no en un solo formulario porque el correo se
 * confirma en medio: ver "nombre, correo y contraseña" de golpe invita a
 * rellenar los tres sin mirar, y el correo es el único que no tiene arreglo
 * después.
 *
 * Ya no existe el botón de "simular pago". El pago ocurre fuera, en la pasarela,
 * y se confirma a la vuelta en `/pago/retorno` contra el servidor: esta pantalla
 * nunca decide que algo está pagado.
 */

interface PurchaseModalProps {
  open: boolean;
  onClose: () => void;
}

/** Título y subtítulo de cada tramo: el encabezado dice dónde está la persona. */
const HEADINGS = {
  account: { lead: 'Crea tu', accent: 'cuenta' },
  'confirm-email': { lead: 'Confirma tu', accent: 'correo' },
  password: { lead: 'Elige tu', accent: 'contraseña' },
} as const;

export const PurchaseModal: React.FC<PurchaseModalProps> = ({ open, onClose }) => {
  const { form, step, status, busy, error, next, confirmEmail, back, submit, reset } =
    useCheckoutFlow();
  const { setFocus } = form;

  // Cada apertura empieza limpia: ni el error de ayer, ni el paso en el que se
  // quedó, ni la clave de idempotencia del intento anterior deberían sobrevivir
  // a cerrar el modal.
  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  // El foco viaja con el paso; si no, tras avanzar se queda en un botón que ya
  // no existe y quien navega con teclado vuelve al principio del documento.
  useEffect(() => {
    if (!open) return;
    if (step === 'account') setFocus('name');
    else if (step === 'confirm-email') setFocus('email');
    else setFocus('password');
  }, [open, step, setFocus]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const heading = HEADINGS[step];

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
            {heading.lead}{' '}
            <span className="font-script font-normal text-wine text-[1.6em] leading-none">
              {heading.accent}
            </span>
          </h2>
          <Ornament tone="gold" width={140} className="mx-auto mt-1" />
        </div>

        {/*
          Cada paso monta su propio `<form>`: así el Enter hace en cada pantalla
          lo que hace su botón —avanzar, confirmar o enviar— en vez de disparar
          siempre el submit del final.
        */}
        {step === 'account' && <AccountStep form={form} onNext={next} />}
        {step === 'confirm-email' && (
          <EmailConfirmStep form={form} onConfirm={confirmEmail} onBack={back} />
        )}
        {step === 'password' && (
          <PasswordStep
            form={form}
            status={status}
            busy={busy}
            onSubmit={submit}
            onBack={back}
          />
        )}

        {error && (
          <p className="text-sm text-error font-medium text-center mt-4" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
