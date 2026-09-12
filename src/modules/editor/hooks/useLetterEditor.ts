import { useCallback, useRef, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { describeError } from '../../../utils/apiErrors';
import { createLetter, type LetterOutcome } from '../services/letters';
import { usePhotoUploads, type PhotoUploads } from './usePhotoUploads';
import {
  EMPTY_LETTER,
  letterSchema,
  type LetterInput,
  type LetterValues,
} from '../schemas/letterSchema';

/**
 * ViewModel del editor: validación en vivo, fotos y envío de la carta.
 *
 * La pantalla no habla con la API ni conoce el esquema; pide cosas a este hook y
 * pinta lo que le devuelve. Eso permite probar el flujo entero —doble
 * confirmación incluida— sin depender de una sola clase de Tailwind.
 *
 * El envío tiene dos tiempos a propósito. `requestSubmit` valida y **se para**:
 * abre la confirmación del correo. Solo `confirmSubmit` llama al backend. Ese
 * corte existe porque el correo es irreversible — el QR, el enlace y el archivo
 * se van a una dirección que el usuario escribió una sola vez.
 */

/**
 * Campos de cada paso, para revelar sus errores al avanzar.
 *
 * `recipientEmail` no está en ninguno: no vive en el asistente. Se pide en la
 * última pantalla, junto al aviso de que la carta ya no se podrá editar, y lo
 * valida el esquema completo en `confirmSubmit`. Escribirlo en el paso 1 y
 * confirmarlo cinco minutos después es releer algo que uno ya dio por bueno.
 */
const STEP_FIELDS: Record<number, (keyof LetterInput)[]> = {
  1: ['title', 'recipient', 'sender', 'message'],
  2: ['songUrl', 'photos'],
  3: ['themeId'],
};

/** Todo lo que la carta necesita antes de preguntar dónde se manda. */
const LETTER_FIELDS: (keyof LetterInput)[] = [
  ...STEP_FIELDS[1],
  ...STEP_FIELDS[2],
  ...STEP_FIELDS[3],
];

const SUBMIT_OVERRIDES = {
  LETTER_ALREADY_EXISTS: 'Esta compra ya tiene su carta. Revisa tu correo: te la enviamos ahí.',
  PURCHASE_NOT_PAID: 'Esta compra todavía no figura como pagada. Vuelve a la página principal.',
};

export interface LetterEditor {
  form: UseFormReturn<LetterInput, unknown, LetterValues>;
  photos: PhotoUploads;
  /** Correo pendiente de confirmar; `null` cuando el modal está cerrado. */
  confirmingEmail: string | null;
  submitting: boolean;
  error: string | null;
  outcome: LetterOutcome | null;
  /** Falso mientras haya fotos en vuelo o una petición viva. */
  canSubmit: boolean;
  requestSubmit: (event?: React.BaseSyntheticEvent) => void;
  confirmSubmit: (confirmedEmail: string) => Promise<void>;
  cancelConfirm: () => void;
  revealStepErrors: (step: number) => void;
  dismissOutcome: () => void;
}

export const useLetterEditor = (purchaseId: string | null): LetterEditor => {
  const form = useForm<LetterInput, unknown, LetterValues>({
    resolver: zodResolver(letterSchema),
    // Fail-fast: el borde cambia de color mientras se escribe, no al enviar.
    mode: 'onChange',
    defaultValues: EMPTY_LETTER,
  });

  const photos = usePhotoUploads(form);

  const [confirmingEmail, setConfirmingEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<LetterOutcome | null>(null);

  /**
   * Cerrojo síncrono. `submitting` llega un render tarde, y dos clics rápidos
   * caben de sobra en ese hueco: sin esto se crearían dos cartas y se gastarían
   * dos IOPS por una sola compra.
   */
  const inFlight = useRef(false);

  /**
   * Valida la carta —todo menos el destinatario— y, en vez de enviar, levanta
   * la pantalla del correo.
   *
   * No usa `form.handleSubmit`: ese valida el esquema entero, y el correo está
   * vacío a propósito, así que nunca dejaría pasar. Se validan a mano los
   * campos que sí existen en el asistente.
   */
  const requestSubmit = useCallback(
    async (event?: React.BaseSyntheticEvent) => {
      event?.preventDefault();
      setError(null);
      if (!(await form.trigger(LETTER_FIELDS))) return;
      setConfirmingEmail(form.getValues('recipientEmail') ?? '');
    },
    [form],
  );

  const cancelConfirm = useCallback(() => {
    setConfirmingEmail(null);
    setError(null);
  }, []);

  const confirmSubmit = useCallback(
    async (confirmedEmail: string) => {
      if (!purchaseId || inFlight.current) return;

      // El modal permite corregir el correo; lo corregido vuelve al formulario y
      // se vuelve a validar entero. Nada sale sin pasar por el mismo esquema.
      form.setValue('recipientEmail', confirmedEmail, { shouldValidate: true, shouldDirty: true });
      const parsed = letterSchema.safeParse({ ...form.getValues(), recipientEmail: confirmedEmail });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Revisa los datos de la carta.');
        return;
      }

      inFlight.current = true;
      setSubmitting(true);
      setError(null);
      try {
        const result = await createLetter(purchaseId, parsed.data);
        setConfirmingEmail(null);
        setOutcome(result);
      } catch (problem) {
        setError(describeError(problem, SUBMIT_OVERRIDES));
      } finally {
        inFlight.current = false;
        setSubmitting(false);
      }
    },
    [form, purchaseId],
  );

  const revealStepErrors = useCallback(
    (step: number) => {
      void form.trigger(STEP_FIELDS[step] ?? []);
    },
    [form],
  );

  const dismissOutcome = useCallback(() => setOutcome(null), []);

  return {
    form,
    photos,
    confirmingEmail,
    submitting,
    error,
    outcome,
    canSubmit: !submitting && photos.uploading === 0 && !photos.compressing,
    requestSubmit,
    confirmSubmit,
    cancelConfirm,
    revealStepErrors,
    dismissOutcome,
  };
};
