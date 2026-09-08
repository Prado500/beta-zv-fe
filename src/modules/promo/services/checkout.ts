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

/**
 * Rango que exige el backend en `Register.password` (`be/app/schemas/auth.py`).
 *
 * Son espejo, no una opinión de esta pantalla: si aquí se pide más de lo que
 * allí se acepta, el formulario deja pasar contraseñas que el servidor devuelve
 * con un 422 y la persona no entiende por qué. No hay ninguna otra regla —ni
 * mayúsculas, ni dígitos, ni símbolos— a propósito: se quieren contraseñas que
 * se recuerden.
 */
export const MIN_PASSWORD = 4;
export const MAX_PASSWORD = 10;

/**
 * Alta de la cuenta.
 *
 * El cuerpo se arma campo a campo y no se reenvía el objeto del formulario tal
 * cual: `Register` declara `extra="forbid"`, así que cualquier campo de más
 * —`confirmPassword`, sin ir más lejos— tumbaría la petición con un 422.
 */
export const register = ({ name, email, password }: Credentials): Promise<UserResponse> =>
  apiPost<UserResponse>('/api/v1/auth/register', { name, email, password });

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
