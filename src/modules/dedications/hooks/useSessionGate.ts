import { useCallback, useRef, useState, type BaseSyntheticEvent } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { describeError } from '../../../utils/apiErrors';
import { email } from '../../../utils/validation';
import { login } from '../../promo/services/checkout';

/**
 * ViewModel de la puerta de sesión: correo, contraseña y entrar.
 *
 * Reutiliza el `login` de la compra porque es la misma cuenta y la misma cookie;
 * lo único distinto es el motivo por el que se entra. La validación es la de
 * siempre (Zod + React Hook Form, veredicto en cada tecla), pero sin las reglas
 * del alta: aquí no se decide cómo debe ser una contraseña, solo que haya una.
 * Rechazar en el navegador una contraseña que el servidor sí aceptaría dejaría
 * fuera a quien la creó con otra regla.
 */

export const loginSchema = z.object({
  email: email(),
  password: z.string().min(1, 'Escribe tu contraseña.'),
});

export type LoginInput = z.input<typeof loginSchema>;
export type LoginValues = z.output<typeof loginSchema>;

/**
 * El 401 genérico dice "tu sesión expiró", que aquí sería mentira: no había
 * sesión, lo que falló fue la contraseña. Se cubre por código y por estado
 * porque ambos llegan según el camino del backend.
 */
const WRONG_CREDENTIALS = 'Correo o contraseña incorrectos. Revísalos e intenta de nuevo.';

export interface SessionGateModel {
  form: UseFormReturn<LoginInput, unknown, LoginValues>;
  busy: boolean;
  error: string | null;
  submit: (event: BaseSyntheticEvent) => void;
}

export const useSessionGate = (onLoggedIn: () => void): SessionGateModel => {
  const form = useForm<LoginInput, unknown, LoginValues>({
    resolver: zodResolver(loginSchema),
    // Fail-fast: el borde cambia de color mientras se escribe, no al enviar.
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * Cerrojo síncrono. `busy` llega un render tarde y dos clics rápidos caben en
   * ese hueco: sin esto saldrían dos inicios de sesión por una sola intención, y
   * el segundo se comería un intento del límite de la API.
   */
  const inFlight = useRef(false);

  const run = useCallback(
    async (values: LoginValues) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setBusy(true);
      setError(null);
      try {
        await login(values.email, values.password);
        onLoggedIn();
      } catch (problem) {
        setError(
          describeError(problem, {
            INVALID_CREDENTIALS: WRONG_CREDENTIALS,
            '401': WRONG_CREDENTIALS,
          }),
        );
      } finally {
        inFlight.current = false;
        setBusy(false);
      }
    },
    [onLoggedIn],
  );

  /** Se compone al pulsar, no al pintar (mismo motivo que en `useCheckoutFlow`). */
  const submit = (event: BaseSyntheticEvent) => {
    void form.handleSubmit(run)(event);
  };

  return { form, busy, error, submit };
};
