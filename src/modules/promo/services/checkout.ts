import { apiGet, apiPost } from '../../../utils/api';

/**
 * Compra: registro, sesión, intención de pago y verificación.
 *
 * El estado de la compra **lo decide el servidor**. El navegador solo aporta el
 * identificador del pago; que el usuario vuelva de la pasarela no confirma nada
 * (IOP #3). Por eso `verifyPurchase` devuelve lo que responde el backend y el
 * editor se desbloquea solo si ahí pone `paid`.
 */

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: string;
}

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

export interface Credentials {
  email: string;
  password: string;
  name: string;
}

/** Mínimo que exige el backend (`Register.password`); validarlo aquí evita un 422. */
export const MIN_PASSWORD = 12;

export const register = (credentials: Credentials): Promise<UserResponse> =>
  apiPost<UserResponse>('/api/v1/auth/register', credentials);

export const login = (email: string, password: string): Promise<UserResponse> =>
  apiPost<UserResponse>('/api/v1/auth/login', { email, password });

export const currentUser = (): Promise<UserResponse> => apiGet<UserResponse>('/api/v1/me');

/**
 * Clave de idempotencia de la compra.
 *
 * La genera el cliente y se reutiliza mientras dure el intento: si el usuario da
 * dos veces al botón, o la respuesta se pierde y se reintenta, el backend
 * devuelve **la misma compra** en vez de cobrar dos veces.
 */
export const newIdempotencyKey = (): string =>
  `web-${(crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/[^A-Za-z0-9]/g, '').slice(0, 40)}`;

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
