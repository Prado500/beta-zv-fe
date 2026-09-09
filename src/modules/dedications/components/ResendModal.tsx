import React, { useEffect, useRef, type ChangeEvent } from 'react';
import { ModalShell } from '../../../components/ui/ModalShell';
import { FieldError } from '../../../components/ui/FieldError';
import { fieldClass, fieldTone, LABEL } from '../../../components/ui/formStyles';
import { Ornament } from '../../../components/decor';
import { useResendDelivery } from '../hooks/useResendDelivery';
import type { Dedication } from '../services/dedications';

/**
 * Reenviar el correo de una carta publicada.
 *
 * Es la confirmación: pulsar "Reenviar correo" en la tarjeta no manda nada,
 * abre esto, y la petición solo sale al confirmar aquí. Un correo que sale es
 * irreversible, y a una dirección que quizá no sea la de siempre: por eso la
 * opción de "otro correo" se escribe y se valida antes de que salga nada.
 *
 * Se monta al abrirse y se destruye al cerrar, como el resto de modales del
 * panel: reabrirlo arranca con "el mismo correo" marcado y sin el error de la
 * vez anterior.
 */

interface ResendModalProps {
  dedication: Dedication;
  /** Carta publicada: el listado la trae con `letterId`, que es lo que pide la API. */
  letterId: string;
  onClose: () => void;
  /** La sesión caducó a medio uso: la página cierra este modal y abre la puerta. */
  onUnauthorized: () => void;
}

const OPTION =
  'flex items-start gap-3 p-3 rounded-2xl border border-wine/15 bg-paper/50 cursor-pointer hover:border-wine/40 transition-colors has-checked:border-wine has-checked:bg-blush/40';

const RADIO = 'w-4 h-4 mt-0.5 accent-wine cursor-pointer';

export const ResendModal: React.FC<ResendModalProps> = ({
  dedication,
  letterId,
  onClose,
  onUnauthorized,
}) => {
  const { form, status, sentTo, error, submit } = useResendDelivery(letterId, onUnauthorized);
  const {
    register,
    watch,
    clearErrors,
    formState: { errors, dirtyFields },
  } = form;
  const confirmButton = useRef<HTMLButtonElement>(null);
  const doneButton = useRef<HTMLButtonElement>(null);

  const sending = status === 'sending';
  const sent = status === 'sent';
  const target = watch('target');
  const title = dedication.title ?? 'tu carta';

  useEffect(() => {
    confirmButton.current?.focus();
  }, []);

  useEffect(() => {
    if (sent) doneButton.current?.focus();
  }, [sent]);

  /** Volver a "el mismo correo" deja sin sentido el error del otro: se limpia al cambiar. */
  const onTargetChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.value === 'same') clearErrors('email');
  };

  return (
    <ModalShell labelledBy="resend-title" onClose={onClose} busy={sending}>
      <div className="flex flex-col items-center text-center">
        <span className="w-14 h-14 rounded-full bg-blush flex items-center justify-center ring-4 ring-blush/50 mb-3">
          <span
            className="material-symbols-outlined text-wine text-[28px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            forward_to_inbox
          </span>
        </span>
        <h2 id="resend-title" className="font-headline-md text-xl font-bold text-on-background">
          Reenviar el{' '}
          <span className="font-script font-normal text-wine text-[1.6em] leading-none">
            correo
          </span>
        </h2>
        <Ornament tone="gold" width={150} className="mx-auto mt-1 mb-3" />
      </div>

      {sent ? (
        <div className="flex flex-col items-center text-center" role="status" aria-live="polite">
          <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
            Listo. Volvimos a enviar <strong className="text-wine">{title}</strong> a{' '}
            <strong className="text-wine break-all">{sentTo}</strong>, con el enlace, el QR y el
            archivo.
          </p>
          <button
            ref={doneButton}
            type="button"
            onClick={onClose}
            className="mt-6 px-8 py-3.5 rounded-full bg-wine text-white font-semibold text-sm shadow-lg hover:bg-primary transition-colors flex items-center gap-2 cursor-pointer"
          >
            Entendido
            <span className="material-symbols-outlined text-[18px]">check</span>
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <p className="font-body-md text-sm text-on-surface-variant leading-relaxed text-center">
            Te mandamos otra vez el correo de <strong className="text-wine">{title}</strong>
            {dedication.recipientName && (
              <>
                {' '}
                para <strong className="text-wine">{dedication.recipientName}</strong>
              </>
            )}
            , con el enlace, el QR y el archivo. No gasta otra compra.
          </p>

          <fieldset className="flex flex-col gap-2" disabled={sending}>
            <legend className={LABEL}>¿A qué correo?</legend>
            <label className={OPTION}>
              <input
                type="radio"
                value="same"
                {...register('target', { onChange: onTargetChange })}
                className={RADIO}
              />
              <span className="text-sm text-on-surface">
                <span className="font-semibold block">Al mismo correo de la primera vez</span>
                <span className="text-xs text-wine/60">
                  La dirección que escribiste al crear la carta.
                </span>
              </span>
            </label>
            <label className={OPTION}>
              <input
                type="radio"
                value="other"
                {...register('target', { onChange: onTargetChange })}
                className={RADIO}
              />
              <span className="text-sm text-on-surface">
                <span className="font-semibold block">A otro correo</span>
                <span className="text-xs text-wine/60">
                  Por ejemplo, el de tu pareja o uno que escribiste mal.
                </span>
              </span>
            </label>

            {target === 'other' && (
              <div className="mt-1">
                <label className={LABEL} htmlFor="resend-email">
                  Correo de destino
                </label>
                <input
                  id="resend-email"
                  type="email"
                  {...register('email')}
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="otro@ejemplo.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'resend-email-error' : undefined}
                  className={fieldClass(
                    fieldTone(Boolean(errors.email), Boolean(dirtyFields.email)),
                  )}
                />
                <FieldError id="resend-email-error" message={errors.email?.message} />
              </div>
            )}
          </fieldset>

          {error && (
            <p className="text-sm text-error font-medium text-center" role="alert">
              {error}
            </p>
          )}

          <button
            ref={confirmButton}
            type="submit"
            disabled={sending}
            className="w-full py-3.5 rounded-full bg-wine text-white font-semibold text-sm shadow-lg hover:bg-primary transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-wait disabled:opacity-70"
          >
            {sending ? 'Enviando…' : 'Sí, reenviar'}
            <span className="material-symbols-outlined text-[18px]">
              {sending ? 'hourglass_top' : 'send'}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="w-full py-3 rounded-full border border-wine/25 text-wine font-semibold text-sm hover:bg-blush/50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </form>
      )}
    </ModalShell>
  );
};
