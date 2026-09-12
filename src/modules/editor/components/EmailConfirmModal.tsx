import React, { useEffect, useRef, useState } from 'react';
import { CornerFlourish, Ornament } from '../../../components/decor';
import { fieldClass } from '../../../components/ui/formStyles';
import { useCountdown } from '../../../utils/useCountdown';
import { email as emailRule } from '../../../utils/validation';

/**
 * Última parada antes de mandar la carta, en dos tiempos dentro del mismo modal.
 *
 * 1. **Escribir.** Se pide la dirección y se dice qué va a llegar ahí. Sin
 *    freno: aquí todavía no hay nada que releer.
 * 2. **Verificar.** El correo se enseña grande, solo, con el aviso de que no
 *    habrá vuelta atrás. Y *aquí* sí manda el freno.
 *
 * El orden importa. Cuando la cuenta arrancaba al abrirse el modal, corría
 * mientras la persona tecleaba: al terminar de escribir ya había expirado y el
 * botón estaba listo, así que el freno no frenaba nada. Puesto después, los
 * tres segundos caen justo cuando hay una dirección delante que mirar — que es
 * todo el propósito.
 *
 * No se pide escribirlo dos veces: nadie relee lo que acaba de teclear, se copia
 * y se pega, y el error de tipeo se duplica intacto. Se enseña y se deja volver
 * a corregirlo.
 *
 * **Se monta solo mientras está abierto**, y no lleva `open`: así el campo nace
 * con el valor correcto sin sincronizar nada.
 */

/** El aviso del validador, sin montar un formulario entero para un campo. */
const EMAIL_CHECK = emailRule('Escribe un correo válido, como ana@ejemplo.com.');

/** Segundos que el botón de enviar permanece bloqueado en el paso de verificar. */
export const CONFIRM_DELAY_SECONDS = 3;

const PRIMARY =
  'w-full py-3.5 rounded-full bg-wine text-white font-semibold text-sm shadow-lg hover:bg-primary transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-wine';
const SECONDARY =
  'w-full py-3 rounded-full border border-wine/25 text-wine font-semibold text-sm hover:bg-blush/50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

interface VerifyStepProps {
  email: string;
  submitting: boolean;
  /** Volver a escribir. Enviar lo dispara el `submit` del formulario. */
  onBack: () => void;
}

/**
 * El alto: la dirección delante y el botón que no responde durante tres
 * segundos.
 *
 * Va en su propio componente porque `useCountdown` arranca al montar y se
 * reinicia montando otra vez. Así volver atrás a corregir y entrar de nuevo
 * vuelve a cobrar el freno: no hay forma de saltárselo yendo y viniendo.
 */
const VerifyStep: React.FC<VerifyStepProps> = ({ email, submitting, onBack }) => {
  const left = useCountdown(CONFIRM_DELAY_SECONDS);
  const locked = left > 0;
  const panel = useRef<HTMLDivElement>(null);

  /*
   * El foco entra en la pantalla, no en el botón de enviar.
   *
   * Enfocar el botón en cuanto se libera sería regalar el envio a quien venga
   * con la tecla Intro apretada, que es exactamente de quien protege el freno.
   * Así el lector de pantalla anuncia el paso, y para enviar hay que llegar al
   * botón a propósito.
   */
  useEffect(() => {
    panel.current?.focus();
  }, []);

  return (
    <div ref={panel} tabIndex={-1} className="w-full outline-none">
      <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
        Vas a enviar tu carta a esta dirección. Léela entera antes de seguir:
      </p>

      {/*
        Grande, sola y en una caja propia. Repetida en el mismo cuerpo de texto
        que el resto se lee por encima; el punto de esta pantalla es justo que
        no se lea por encima.
      */}
      <p className="mt-3 w-full rounded-2xl bg-blush/45 px-4 py-3 text-center text-base font-semibold text-wine wrap-break-word ring-1 ring-wine/10">
        {email}
      </p>

      <p className="font-body-md text-xs text-on-surface-variant/90 leading-relaxed mt-3">
        Ahí llegan el código QR, el enlace y el archivo descargable. Una vez enviada,{' '}
        <strong className="text-wine">NO</strong> podrás cambiar la carta ni la dirección.
      </p>

      <div className="mt-6 w-full flex flex-col gap-2.5">
        <button type="submit" disabled={locked || submitting} className={PRIMARY}>
          {submitting ? 'Enviando tu carta…' : locked ? `Espera ${left}…` : 'Sí, es correcto: enviar'}
          <span className="material-symbols-outlined text-[18px]">
            {locked && !submitting ? 'hourglass_top' : 'check'}
          </span>
        </button>
        <button type="button" onClick={onBack} disabled={submitting} className={SECONDARY}>
          No, corregir el correo
        </button>
      </div>

      {/*
        El contador vive en la etiqueta del botón, que es donde se mira.
        Anunciar cada tic por voz sería un martilleo; se anuncia el desenlace.
      */}
      <p className="sr-only" aria-live="polite">
        {locked ? '' : 'Ya puedes enviar.'}
      </p>
    </div>
  );
};

interface EmailConfirmModalProps {
  /** Correo tal como está en el formulario al pulsar "Guardar y compartir". */
  email: string;
  submitting: boolean;
  error: string | null;
  onConfirm: (email: string) => void;
  onCancel: () => void;
}

export const EmailConfirmModal: React.FC<EmailConfirmModalProps> = ({
  email,
  submitting,
  error,
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState(email);
  /** El aviso del correo no sale mientras se teclea, solo al intentar seguir. */
  const [tried, setTried] = useState(false);
  const [step, setStep] = useState<'write' | 'verify'>('write');
  const field = useRef<HTMLInputElement>(null);

  const check = EMAIL_CHECK.safeParse(value);
  const emailError = tried && !check.success ? check.error?.issues[0]?.message : null;
  const verifying = step === 'verify';

  // El foco va al correo, que es lo que hay que escribir.
  useEffect(() => {
    if (!verifying) field.current?.focus();
  }, [verifying]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [submitting, onCancel]);

  /** El Enter hace lo mismo que el botón del paso en el que se esté. */
  const submit = () => {
    if (submitting) return;
    if (verifying) {
      onConfirm(value.trim());
      return;
    }
    setTried(true);
    if (!check.success) {
      field.current?.focus();
      return;
    }
    setStep('verify');
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 z-100 flex items-center justify-center px-4 py-8 bg-wine-deep/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-email-title"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        noValidate
        className="modal-panel relative w-full max-w-md bg-white rounded-4xl shadow-2xl border border-wine/15 px-7 py-8 md:px-9 overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-wine-deep via-wine to-tertiary" />
        <CornerFlourish corner="tl" tone="gold" size={54} className="opacity-65" />
        <CornerFlourish corner="br" tone="gold" size={54} className="opacity-65" />

        <div className="relative flex flex-col items-center text-center">
          <span className="w-14 h-14 rounded-full bg-blush flex items-center justify-center ring-4 ring-blush/50 mb-3">
            <span
              className="material-symbols-outlined text-wine text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {verifying ? 'mark_email_read' : 'forward_to_inbox'}
            </span>
          </span>

          <h2 id="confirm-email-title" className="font-headline-md text-xl font-bold text-on-background">
            {verifying ? (
              <>
                Verifica tu{' '}
                <span className="font-script font-normal text-wine text-[1.5em] leading-none">
                  correo
                </span>
              </>
            ) : (
              <>
                ¿A dónde te la{' '}
                <span className="font-script font-normal text-wine text-[1.5em] leading-none">
                  enviamos
                </span>
                ?
              </>
            )}
          </h2>
          <Ornament tone="gold" width={150} className="mx-auto mt-1 mb-3" />

          {verifying ? (
            <VerifyStep email={value.trim()} submitting={submitting} onBack={() => setStep('write')} />
          ) : (
            <>
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                A esta dirección llegan el <strong className="text-wine">enlace</strong> de la carta,
                el <strong className="text-wine">código QR</strong> y el{' '}
                <strong className="text-wine">archivo descargable</strong>. Es lo que vas a entregar,
                así que escríbela bien.
              </p>

              <div className="w-full mt-5 text-left">
                <label
                  className="block text-[11px] font-bold text-wine/75 uppercase tracking-wider mb-1.5"
                  htmlFor="confirm-email"
                >
                  {/*
                    El correo es el de quien compra, no el de su pareja, salvo
                    que él quiera. Decirlo en el propio rótulo evita el error más
                    caro del producto: mandarle la sorpresa a quien iba a
                    recibirla.
                  */}
                  Tu correo (o donde quieras recibir el regalo para entregarlo tú)
                </label>
                <input
                  ref={field}
                  id="confirm-email"
                  type="email"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="tucorreo@ejemplo.com"
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? 'confirm-email-error' : undefined}
                  className={fieldClass(emailError ? 'error' : 'idle', 'text-center font-medium')}
                />
                {emailError && (
                  <p id="confirm-email-error" className="text-sm text-error mt-1.5" role="alert">
                    {emailError}
                  </p>
                )}
              </div>

              <div className="mt-6 w-full flex flex-col gap-2.5">
                <button type="submit" className={PRIMARY}>
                  Continuar
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <button type="button" onClick={onCancel} className={SECONDARY}>
                  No, quiero revisar la carta
                </button>
              </div>
            </>
          )}

          {/*
            El fallo del servidor se queda donde se pulsó enviar, que es el paso
            de verificar: ahí sigue el botón para reintentar sin volver a
            escribir nada.
          */}
          {error && (
            <p className="text-sm text-error font-medium mt-4" role="alert">
              {error}
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
