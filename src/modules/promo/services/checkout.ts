import { apiPost } from '../../../utils/api';

/**
 * Compra: intención de pago y verificación.
 *
 * El estado de la compra **lo decide el servidor**. El navegador solo aporta el
 * identificador del pago; que el usuario vuelva de la pasarela no confirma nada
 * (IOP #3). Por eso `verifyPurchase` devuelve lo que responde el backend y el
 * editor se desbloquea solo si ahí pone `paid`.
 *
 * La cuenta y la sesión (alta, entrada, salida, `/me`) viven en
 * `modules/auth/services/auth.ts`: la compra las usa, pero no son suyas.
 */

export interface PurchaseResponse {
  id: string;
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  amountCents: number;
  currency: string;
  externalReference: string;
  checkoutUrl: string | null;
  hasLetter: boolean;
  paidAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface PurchaseVerification {
  purchase: PurchaseResponse;
  payment: { status: string; statusDetail: string | null } | null;
  canCreateLetter: boolean;
}

/**
 * Clave de idempotencia de la compra.
 *
 * La genera el cliente y se reutiliza mientras dure el intento: si el usuario da
 * dos veces al botón, o la respuesta se pierde y se reintenta, el backend
 * devuelve **la misma compra** en vez de cobrar dos veces.
 */
export const newIdempotencyKey = (): string =>
  `web-${(crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/[^A-Za-z0-9]/g, '').slice(0, 40)}`;

/** Crea la intención de compra. Responde 401 si la sesión no existe o caducó. */
export const createPurchase = (idempotencyKey: string): Promise<PurchaseResponse> =>
  apiPost<PurchaseResponse>('/api/v1/purchases', { idempotencyKey });

/**
 * Confirma el pago contra el proveedor. `paymentId` es lo único que aporta el
 * navegador; el importe, la referencia y el estado los comprueba el servidor.
 */
export const verifyPurchase = (
  purchaseId: string,
  paymentId: string,
): Promise<PurchaseVerification> =>
  apiPost<PurchaseVerification>(`/api/v1/purchases/${purchaseId}/verify`, { paymentId });

export const formatPrice = (cents: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `${Math.round(cents / 100)} ${currency}`;
  }
};
