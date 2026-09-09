import React, { useEffect } from 'react';
import { ModalShell } from '../../../../components/ui/ModalShell';
import { Ornament } from '../../../../components/decor';
import { useCheckoutFlow, type CheckoutIntent, type CheckoutStep } from '../../hooks/useCheckoutFlow';
import { AccountStep } from './steps/AccountStep';
import { EmailConfirmStep } from './steps/EmailConfirmStep';
import { ExpressStep } from './steps/ExpressStep';
import { LoginStep } from './steps/LoginStep';
import { PasswordStep } from './steps/PasswordStep';

/**
 * Puerta de entrada a la compra: cuenta nueva, cuenta de siempre o sesión ya
 * abierta, y de ahí a Mercado Pago.
 *
 * Este componente no habla con la API ni valida nada. Es la cáscara —overlay,
 * cierre, foco, título— y decide qué paso se pinta; la secuencia entera
 * —registro, sesión, intención de compra y redirección— vive en
 * `useCheckoutFlow` (View / ViewModel).
 *
 * El diálogo se monta solo mientras está abierto. Así cada apertura nace limpia
 * —ni el error de ayer, ni el paso en el que se quedó, ni la clave de
 * idempotencia del intento anterior— sin tener que sincronizar nada, y el paso
 * inicial se decide con la sesión que hay en ese momento.
 *
 * Ya no existe el botón de "simular pago". El pago ocurre fuera, en la pasarela,
 * y se confirma a la vuelta en `/pago/retorno` contra el servidor: esta pantalla
 * nunca decide que algo está pagado.
 */

interface PurchaseModalProps {
  open: boolean;
  onClose: () => void;
  /** Comprar (por defecto) o solo entrar, desde la cabecera. */
  intent?: CheckoutIntent;
}

/** Título de cada tramo: el encabezado dice dónde está la persona. */
const HEADINGS: Record<CheckoutStep, { lead: string; accent: string }> = {
  account: { lead: 'Crea tu', accent: 'cuenta' },
  'confirm-email': { lead: 'Confirma tu', accent: 'correo' },
  password: { lead: 'Elige tu', accent: 'contraseña' },
  login: { lead: 'Inicia', accent: 'sesión' },
  express: { lead: 'Preparando tu', accent: 'pago' },
};

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  open,
  onClose,
  intent = 'checkout',
}) => (open ? <PurchaseDialog onClose={onClose} intent={intent} /> : null);

interface PurchaseDialogProps {
  onClose: () => void;
  intent: CheckoutIntent;
}

const PurchaseDialog: React.FC<PurchaseDialogProps> = ({ onClose, intent }) => {
  const {
    form,
    step,
    status,
    busy,
    error,
    notice,
    user,
    next,
    confirmEmail,
    back,
    submit,
    switchMode,
    retry,
    switchAccount,
  } = useCheckoutFlow({ intent, onSignedIn: onClose });
  const { setFocus, getValues } = form;

  // El foco viaja con el paso; si no, tras avanzar se queda en un botón que ya
  // no existe y quien navega con teclado vuelve al principio del documento.
  useEffect(() => {
    if (step === 'account') setFocus('name');
    else if (step === 'confirm-email') setFocus('email');
    else if (step === 'password') setFocus('password');
    // Al entrar con el correo ya puesto (vuelta de un 409 o de una sesión
    // caducada) lo que falta es la contraseña.
    else if (step === 'login') setFocus(getValues('email') ? 'password' : 'email');
  }, [step, setFocus, getValues]);

  const heading = HEADINGS[step];

  return (
    <ModalShell labelledBy="purchase-title" onClose={onClose} busy={busy}>
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
        El aviso explica por qué la pantalla cambió sola ("ya tienes cuenta",
        "caducó tu sesión"). No es un error: va en vino sobre rubor, no en rojo.
      */}
      {notice && (
        <p
          role="status"
          className="text-sm text-wine-deep bg-blush/60 border border-wine/15 rounded-xl px-3.5 py-2.5 text-center mb-4 flex items-start justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px] mt-px">info</span>
          <span>{notice}</span>
        </p>
      )}

      {/*
        Cada paso monta su propio `<form>`: así el Enter hace en cada pantalla
        lo que hace su botón —avanzar, confirmar, entrar o enviar— en vez de
        disparar siempre el submit del final.
      */}
      {step === 'account' && (
        <AccountStep form={form} onNext={next} onSwitchToLogin={() => switchMode('login')} />
      )}
      {step === 'confirm-email' && (
        <EmailConfirmStep form={form} onConfirm={confirmEmail} onBack={back} />
      )}
      {step === 'password' && (
        <PasswordStep form={form} status={status} busy={busy} onSubmit={submit} onBack={back} />
      )}
      {step === 'login' && (
        <LoginStep
          form={form}
          status={status}
          busy={busy}
          intent={intent}
          onSubmit={submit}
          onSwitchToRegister={() => switchMode('register')}
        />
      )}
      {step === 'express' && user && (
        <ExpressStep
          user={user}
          status={status}
          busy={busy}
          error={error}
          onRetry={retry}
          onSwitchAccount={switchAccount}
        />
      )}

      {/* El exprés pinta su propio error en el hueco del estado, no al pie. */}
      {error && step !== 'express' && (
        <p className="text-sm text-error font-medium text-center mt-4" role="alert">
          {error}
        </p>
      )}
    </ModalShell>
  );
};
