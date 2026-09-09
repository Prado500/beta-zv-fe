import { apiGet, apiPost, apiUrl } from '../../../utils/api';
import { publicQrPath } from '../../editor/services/letters';

/**
 * "Mis dedicatorias": el panel posventa del comprador.
 *
 * El contrato es el de `GET /api/v1/me/dedications` (HANDOFF_MIS_DEDICATORIAS.md):
 * una fila por compra pagada, con su carta si existe, de la compra más reciente a
 * la más antigua y sin paginar. El listado **no trae** cuerpo, fotos ni entregas,
 * y es a propósito: el panel enseña estado y enlace; el detalle sigue en
 * `GET /api/v1/letters/{id}` para cuando haga falta.
 *
 * Aquí no se decide nada: se pide, se devuelve tal cual y se construyen las dos
 * URL que la tarjeta necesita. La interpretación de los estados vive en el
 * diccionario de la vista, y la del reenvío en su hook.
 */

/**
 * Los dos únicos estados del panel. No existe `completed`: es el mismo
 * vocabulario que `letters.status`, para no tener dos nombres para lo mismo.
 */
export type DedicationState = 'draft' | 'published';

/**
 * Una fila del panel. Las reglas de nulos son fijas:
 *
 * | Situación                           | `letterId` | `title` / `recipientName` / `theme` | `publicSlug` / `publicUrl` / `publishedAt` |
 * |-------------------------------------|------------|-------------------------------------|--------------------------------------------|
 * | Compra pagada, editor nunca enviado | `null`     | `null`                              | `null`                                     |
 * | Carta en borrador                   | uuid       | valores                             | `null`                                     |
 * | Carta publicada                     | uuid       | valores                             | valores                                    |
 */
export interface Dedication {
  /** Siempre presente: es la llave para retomar un borrador. */
  purchaseId: string;
  /** `null` = nunca se envió el editor para esta compra. */
  letterId: string | null;
  state: DedicationState;
  title: string | null;
  recipientName: string | null;
  /** Slug del tema tal como lo guarda el backend (`classic`, `pastel-pink`…). */
  theme: string | null;
  publicSlug: string | null;
  /** Ya viene con `FRONTEND_URL/carta/<slug>`: es el enlace que viaja en el correo y en el QR. */
  publicUrl: string | null;
  paidAt: string | null;
  publishedAt: string | null;
  /** De la carta si existe; si no, de la compra. */
  updatedAt: string;
}

/** Acuse de `POST /api/v1/letters/{id}/deliveries`: un intento de envío con su propio estado. */
export interface DeliveryResponse {
  id: string;
  recipientEmail: string;
  /** `sent`, `failed` o `pending`. El resultado real del correo está aquí, no en el código HTTP. */
  status: string;
  attempts: number;
  letterVersion: number;
  lastError: string | null;
  sentAt: string | null;
  createdAt: string;
}

/** Listado del panel. Responde `401` sin sesión; no lleva CSRF porque es lectura. */
export const listDedications = (signal?: AbortSignal): Promise<Dedication[]> =>
  apiGet<Dedication[]>('/api/v1/me/dedications', signal);

/**
 * Reenvía el correo de una carta publicada. No consume otra compra ni crea otra carta.
 *
 * Sin `recipientEmail` el backend usa la dirección guardada en la carta; con él,
 * manda a esa otra. Responde `202` en cuanto registra el intento, **también
 * cuando el correo no salió**: el veredicto viene en `status` (`sent` o `failed`)
 * y en `lastError`. Quien llame tiene que mirarlo; aquí se devuelve sin interpretar.
 */
export const resendDelivery = (
  letterId: string,
  recipientEmail?: string,
): Promise<DeliveryResponse> =>
  apiPost<DeliveryResponse>(
    `/api/v1/letters/${encodeURIComponent(letterId)}/deliveries`,
    recipientEmail ? { recipientEmail } : {},
  );

/**
 * QR de una carta publicada: el endpoint público por slug, vía `apiUrl`.
 *
 * Es el mismo criterio que sigue el editor y por el mismo motivo: el `qrUrl` que
 * arma el backend apunta al endpoint con sesión sobre el origen del frontend, y
 * un `<img>` no puede cargarlo. El público no pide cookie y vive en la API.
 */
export const qrUrlFor = (publicSlug: string): string => apiUrl(publicQrPath(publicSlug));

/**
 * Ruta interna del visor. Para **ver** la carta se prefiere a `publicUrl`: esta
 * ruta abre en el mismo origen desde el que se navega (también en desarrollo),
 * mientras que `publicUrl` se construye sobre el dominio público y sigue siendo
 * el enlace correcto para copiar y compartir.
 */
export const viewerPathFor = (publicSlug: string): string =>
  `/carta/${encodeURIComponent(publicSlug)}`;
