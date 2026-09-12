import { useCallback, useRef, useState, type BaseSyntheticEvent } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApiError } from '../../../utils/api';
import { describeError } from '../../../utils/apiErrors';
import { email } from '../../../utils/validation';
import { resendDelivery } from '../services/dedications';

/**
 * ViewModel del reenvío del correo de una carta publicada.
 *
 * Dos destinos posibles: el correo con el que se envió la primera vez (el
 * listado no lo trae, y no hace falta: el backend lo tiene guardado) u otro que
 * se escribe aquí. El campo solo se valida cuando se elige "otro correo";
 * mientras no, no hay nada que pueda estar mal.
 *
 * **El 202 no significa "enviado".** El backend registra el intento y responde
 * antes de saber si el correo salió; el veredicto viaja en `status`. Un `failed`
 * se trata como error aunque el HTTP sea de éxito: decirle a la persona que su
 * carta ya va en camino cuando no es verdad es peor que pedirle que reintente.
 */

export const resendSchema = z
  .object({
    target: z.enum(['same', 'other']),
    email: z.string().trim(),
  })
  .refine((values) => values.target === 'same' || email().safeParse(values.email).success, {
    error: 'Escribe un correo válido, como ana@ejemplo.com.',
    path: ['email'],
  });

export type ResendInput = z.input<typeof resendSchema>;
export type ResendValues = z.output<typeof resendSchema>;

export type ResendStatus = 'idle' | 'sending' | 'sent' | 'error';

const OVERRIDES = {
  LETTER_NOT_PUBLISHED: 'Esta carta todavía no está publicada, así que no hay correo que reenviar.',
  RECIPIENT_EMAIL_REQUIRED:
    'Esta carta no tiene un correo guardado. Elige "otro correo" y escribe uno.',
  LETTER_NOT_FOUND: 'No encontramos esta carta en tu cuenta.',
  PURCHASE_NOT_FOUND: 'No encontramos esta carta en tu cuenta.',
};

const MAIL_FAILED =
  'Registramos el intento, pero el correo no llegó a salir. Inténtalo de nuevo en un momento.';

export interface ResendDeliveryModel {
  form: UseFormReturn<ResendInput, unknown, ResendValues>;
  status: ResendStatus;
  /** Dirección a la que salió el correo, tal como la confirma el backend. */
  sentTo: string | null;
  error: string | null;
  submit: (event: BaseSyntheticEvent) => void;
}

export const useResendDelivery = (
  letterId: string,
  onUnauthorized: () => void,
): ResendDeliveryModel => {
  const form = useForm<ResendInput, unknown, ResendValues>({
    resolver: zodResolver(resendSchema),
    mode: 'onChange',
    defaultValues: { target: 'same', email: '' },
  });

  const [status, setStatus] = useState<ResendStatus>('idle');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Cerrojo síncrono contra el doble clic: un solo correo por confirmación. */
  const inFlight = useRef(false);

  const run = useCallback(
    async (values: ResendValues) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setStatus('sending');
      setError(null);
      try {
        const delivery = await resendDelivery(
          letterId,
          values.target === 'other' ? values.email : undefined,
        );
        if (delivery.status === 'failed') {
          setError(MAIL_FAILED);
          setStatus('error');
          return;
        }
        setSentTo(delivery.recipientEmail);
        setStatus('sent');
      } catch (problem) {
        // Sin sesión no hay nada que reintentar aquí: el panel abre la puerta.
        if (problem instanceof ApiError && problem.status === 401) {
          setStatus('idle');
          onUnauthorized();
          return;
        }
        setError(describeError(problem, OVERRIDES));
        setStatus('error');
      } finally {
        inFlight.current = false;
      }
    },
    [letterId, onUnauthorized],
  );

  const submit = (event: BaseSyntheticEvent) => {
    void form.handleSubmit(run)(event);
  };

  return { form, status, sentTo, error, submit };
};
