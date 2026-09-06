import { useCallback, useRef, useState, type BaseSyntheticEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApiError } from '../../../utils/api';
import { describeError } from '../../../utils/apiErrors';
import { redirectTo } from '../../../utils/navigation';
import { email, personName } from '../../../utils/validation';
import { createPurchase, login, MIN_PASSWORD, newIdempotencyKey, register } from '../services/checkout';
import { rememberPurchaseId } from '../services/purchaseSession';

/**
 * ViewModel de la compra: cuenta, intención de pago y salida hacia Mercado Pago.
 *
 * El modal solo pinta; toda la secuencia de los IOPS #1 y #2 vive aquí, de modo
 * que se puede probar sin montar un solo `div` y el JSX no tiene que saber que
 * existe una API.
 *
 * La pasarela es real: no se simula ningún pago. Este hook llega hasta la puerta
 * —guarda el identificador de la compra y manda el navegador al `checkoutUrl`—
 * y la confirmación ocurre a la vuelta, en `/pago/retorno`, contra el servidor.
 * Aquí no se marca nada como pagado: el navegador no tiene autoridad para eso.
 */

export const checkoutSchema = z.object({
  name: personName('Tu nombre', 120),
  email: email(),
  password: z
    .string()
    .min(MIN_PASSWORD, `La contraseña necesita al menos ${MIN_PASSWORD} caracteres.`)
    .max(128, 'La contraseña no puede pasar de 128 caracteres.'),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutValues = z.output<typeof checkoutSchema>;

/** `creating` habla con la API; `redirecting` ya no vuelve: el navegador se va. */
export type CheckoutStatus = 'idle' | 'creating' | 'redirecting';

const EXISTING_ACCOUNT =
  'Ese correo ya tiene cuenta y la contraseña no coincide. Usa otro correo o la contraseña correcta.';

const NO_GATEWAY =
  'La pasarela de pago no está disponible ahora mismo. Vuelve a intentarlo en un momento.';

export const useCheckoutFlow = () => {
  const form = useForm<CheckoutInput, unknown, CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    // Fail-fast: el veredicto se actualiza en cada tecla, no al enviar.
    mode: 'onChange',
    defaultValues: { name: '', email: '', password: '' },
  });

  const [status, setStatus] = useState<CheckoutStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  /** Misma clave mientras dure el intento: dos clics no crean dos compras. */
  const idempotencyKey = useRef<string>(newIdempotencyKey());

  const busy = status !== 'idle';

  const run = async (values: CheckoutValues): Promise<void> => {
    setStatus('creating');
    setError(null);

    // Si la cuenta ya existía, un fallo posterior de sesión significa "contraseña
    // equivocada", no "no pudimos registrarte". Sin este dato el mensaje mentiría.
    let accountExisted = false;

    try {
      try {
        await register(values);
      } catch (problem) {
        if (!(problem instanceof ApiError) || problem.status !== 409) throw problem;
        accountExisted = true;
      }

      await login(values.email, values.password);
      const purchase = await createPurchase(idempotencyKey.current);

      // Sin `checkoutUrl` no hay a dónde ir. Antes de esta línea existía un botón
      // que simulaba el pago; mandar al usuario a una pantalla falsa de éxito es
      // peor que decirle que la pasarela está caída.
      if (!purchase.checkoutUrl) {
        throw new ApiError(503, 'CHECKOUT_UNAVAILABLE', NO_GATEWAY);
      }

      // Se apunta ANTES de salir: al volver de Mercado Pago esta pestaña habrá
      // perdido todo su estado y este identificador es lo único que queda.
      rememberPurchaseId(purchase.id);
      setStatus('redirecting');
      redirectTo(purchase.checkoutUrl);
    } catch (problem) {
      setError(
        describeError(problem, {
          // El 503 genérico ("el servicio no está disponible") no le dice a la
          // persona qué pasó; este sí, y es nuestro, no del backend.
          CHECKOUT_UNAVAILABLE: NO_GATEWAY,
          ...(accountExisted
            ? { INVALID_CREDENTIALS: EXISTING_ACCOUNT, '401': EXISTING_ACCOUNT }
            : {}),
        }),
      );
      // Se devuelve el control: el botón vuelve a estar vivo para reintentar.
      setStatus('idle');
    }
  };

  /**
   * `handleSubmit` se compone al pulsar, no al pintar: `run` mira la clave de
   * idempotencia, que vive en un ref, y leer un ref durante el render es
   * exactamente lo que hace que React no vuelva a pintar cuando debe.
   */
  const submit = (event: BaseSyntheticEvent) => {
    void form.handleSubmit(run)(event);
  };

  const reset = useCallback(() => {
    form.reset();
    setStatus('idle');
    setError(null);
    idempotencyKey.current = newIdempotencyKey();
  }, [form]);

  return { form, status, busy, error, submit, reset };
};
