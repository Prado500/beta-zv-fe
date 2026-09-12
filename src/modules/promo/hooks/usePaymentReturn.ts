import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { describeError } from '../../../utils/apiErrors';
import { verifyPurchase } from '../services/checkout';
import { forgetPurchaseId, recallPurchaseId } from '../services/purchaseSession';

/**
 * Vuelta de Mercado Pago (IOP #3).
 *
 * Que el navegador aterrice aquí no significa que se haya pagado: cualquiera
 * puede escribir esta URL a mano. Lo único que aporta el cliente es el
 * `payment_id`; el importe, la referencia y el estado los comprueba el servidor,
 * y el editor se abre **solo** si responde `paid`.
 *
 * La verificación se lanza una vez por montaje. El `ref` no es cosmético: en
 * desarrollo React monta dos veces y sin él se gastarían dos IOPS por visita.
 */

export type ReturnStage = 'verifying' | 'pending' | 'rejected' | 'error';

export interface PaymentReturn {
  stage: ReturnStage;
  message: string | null;
  /** Compra que se estaba verificando; se muestra como referencia de soporte. */
  purchaseId: string | null;
  retry: () => void;
}

const NO_PURCHASE =
  'No encontramos la compra de esta pestaña. Si ya pagaste, revisa tu correo: te enviamos el enlace para continuar.';

const NO_PAYMENT =
  'El pago no se completó en Mercado Pago. No te cobramos nada; puedes intentarlo de nuevo.';

const PENDING =
  'Mercado Pago aún no acredita tu pago. Suele tardar unos minutos: vuelve a comprobarlo o espera nuestro correo.';

const REJECTED = 'El pago no quedó aprobado. Revisa tu medio de pago e inténtalo de nuevo.';

export const usePaymentReturn = (): PaymentReturn => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [stage, setStage] = useState<ReturnStage>('verifying');
  const [message, setMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const running = useRef(false);

  // `collection_id` es el nombre viejo del mismo dato; Mercado Pago manda los dos
  // según la integración, y quedarse solo con uno rompe la mitad de las vueltas.
  const paymentId = params.get('payment_id') ?? params.get('collection_id');
  // La pestaña es la fuente normal; el parámetro cubre al que vuelve desde el
  // correo de la pasarela o con el almacenamiento bloqueado.
  const purchaseId = params.get('purchaseId') ?? params.get('purchase_id') ?? recallPurchaseId();

  useEffect(() => {
    if (running.current) return;
    running.current = true;

    const verify = async () => {
      if (!purchaseId) {
        setStage('error');
        setMessage(NO_PURCHASE);
        return;
      }
      if (!paymentId || paymentId === 'null') {
        setStage('rejected');
        setMessage(NO_PAYMENT);
        return;
      }

      try {
        const result = await verifyPurchase(purchaseId, paymentId);

        if (result.purchase.status === 'paid') {
          // La referencia ya cumplió su función; dejarla puesta invita a reusarla.
          forgetPurchaseId();
          // El editor necesita saber qué compra habilita su carta. Va en el estado
          // de la ruta, no en el almacenamiento: es la llave de una compra pagada.
          navigate('/editor', { state: { purchaseId: result.purchase.id }, replace: true });
          return;
        }

        const payment = result.payment?.status ?? null;
        setStage(payment === 'pending' || payment === 'in_process' ? 'pending' : 'rejected');
        setMessage(payment === 'pending' || payment === 'in_process' ? PENDING : REJECTED);
      } catch (problem) {
        setStage('error');
        setMessage(describeError(problem));
      }
    };

    void verify();
    // `attempt` es el disparador de "volver a comprobar"; el resto se lee una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const retry = useCallback(() => {
    running.current = false;
    setStage('verifying');
    setMessage(null);
    setAttempt((value) => value + 1);
  }, []);

  return { stage, message, purchaseId, retry };
};
