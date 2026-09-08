import { apiPostResult, apiUpload, apiUrl } from '../../../utils/api';
import { themeSlug, type DedicationForm, type PhotoUpload } from '../types';

/**
 * Cartas: subida anticipada de fotos y creación de la carta.
 *
 * El backend admite dos modos y **no se puede adivinar cuál está activo**. Con
 * el bus de mensajes conectado publica el encargo y responde `202` sin haber
 * escrito nada: no hay `publicUrl` ni `qrUrl` porque la carta todavía no existe.
 * Sin bus (local, o degradado a propósito) la escribe en el acto y responde
 * `201`/`200` con el enlace ya listo.
 *
 * Los dos son un éxito. Lo único que los distingue con certeza es el código de
 * estado, así que es lo que se mira aquí: buscar `publicUrl` en el cuerpo para
 * deducir el modo daría un falso negativo el día que el 202 traiga otro campo.
 */

/** Respuesta del *eager upload*: la foto ya está en el contenedor efímero. */
export interface EagerPhoto {
  tempId: string;
  fileName: string;
  contentType: string;
  byteSize: number;
}

/** Cuerpo del `202`. */
export interface LetterQueued {
  status: string;
  purchaseId: string;
  message: string;
}

/** Cuerpo del `201`/`200`, con la carta ya escrita. */
export interface LetterCreated {
  id?: string;
  publicSlug?: string;
  publicUrl?: string;
  /** Lo construye el backend sobre FRONTEND_URL; no se usa, ver `qrUrlOf`. */
  qrUrl?: string;
  message?: string;
}

/**
 * Lo que la interfaz necesita saber: si esperar el correo o si ya hay enlace.
 * Un tipo cerrado, para que la pantalla no pueda pintar un QR que no existe.
 */
export type LetterOutcome =
  | { mode: 'queued'; message: string }
  | { mode: 'ready'; publicUrl: string; qrUrl: string | null; message: string };

/**
 * Sube una foto antes de que exista la carta.
 *
 * Devuelve un `tempId`, **no una URL**: el contenedor es privado y el navegador
 * no puede leerlo. La previsualización se hace con `URL.createObjectURL` sobre
 * el archivo local, así nunca se ve una imagen rota.
 */
export const uploadEagerPhoto = (file: Blob, fileName: string): Promise<EagerPhoto> => {
  const form = new FormData();
  form.append('file', file, fileName);
  // `apiUpload` y no `apiPostResult`: el multipart necesita que el navegador
  // ponga su propio `boundary`, y un `body` JSON lo destruiría.
  return apiUpload<EagerPhoto>('/api/v1/letters/photos/eager', form);
};

/**
 * Une el mensaje con la firma y la canción.
 *
 * `LetterCreate` en el backend no tiene campos para el remitente ni para el
 * enlace de la canción, y añadirlos exigiría una migración. Hasta entonces viajan
 * dentro del cuerpo, que es texto libre: así no se pierde lo que el usuario
 * escribió y no se provoca un 422 por campos desconocidos.
 */
export const composeBody = (form: DedicationForm): string => {
  const parts = [form.message.trim()];
  if (form.sender.trim()) parts.push(`De parte de: ${form.sender.trim()}`);
  if (form.songUrl.trim()) parts.push(`Canción: ${form.songUrl.trim()}`);
  return parts.filter(Boolean).join('\n\n');
};

/** Fotos que el backend puede trasladar: las que ya tienen `tempId` confirmado. */
export const uploadedPhotos = (photos: PhotoUpload[]): PhotoUpload[] =>
  photos.filter((photo) => photo.status === 'ready' && photo.tempId);

/**
 * Slug público de la carta: viene en `publicSlug` o, si solo llega el enlace,
 * dentro de `publicUrl` (`.../carta/<slug>`).
 */
const slugOf = (data: LetterCreated): string | null => {
  if (data.publicSlug) return data.publicSlug;
  const match = data.publicUrl?.match(/\/carta\/([^/?#]+)/);
  return match?.[1] ?? null;
};

/** Ruta del QR público de una carta, sin sesión. */
export const publicQrPath = (slug: string): string =>
  `/api/v1/public/letters/${encodeURIComponent(slug)}/qr.png`;

/**
 * QR de la carta: siempre el endpoint público por `slug`, vía `apiUrl`.
 *
 * El `qrUrl` del backend se ignora a propósito: lo construye sobre FRONTEND_URL
 * (el origen del frontend, donde no existe `/api`) y apunta al endpoint
 * autenticado, que un `<img>` no puede llamar entre orígenes porque el
 * navegador no adjunta la cookie de sesión. Sin slug se devuelve `null` y el
 * modal dibuja el QR en el navegador.
 */
const qrUrlOf = (data: LetterCreated): string | null => {
  const slug = slugOf(data);
  return slug ? apiUrl(publicQrPath(slug)) : null;
};

/**
 * Enlace público de la carta. El backend puede mandarlo hecho (`publicUrl`) o
 * solo el `publicSlug`, que es lo que viaja en el correo y en el QR.
 */
const publicUrlOf = (data: LetterCreated): string | null => {
  if (data.publicUrl) return data.publicUrl;
  if (data.publicSlug) return `${window.location.origin}/carta/${data.publicSlug}`;
  return null;
};

const QUEUED_FALLBACK =
  'Tu carta quedó registrada. Te enviamos el enlace y el QR por correo en cuanto termine.';

/**
 * Crea la carta y traduce la respuesta a un desenlace que la interfaz entiende.
 *
 * Un `201` sin enlace ni slug es el único caso ambiguo: la carta existe pero no
 * hay nada que enseñar. Se trata como encolada —el correo llega igual— antes que
 * abrir una pantalla de éxito con un botón que no lleva a ninguna parte.
 */
export const createLetter = async (
  purchaseId: string,
  form: DedicationForm,
): Promise<LetterOutcome> => {
  const { status, data } = await apiPostResult<LetterQueued & LetterCreated>('/api/v1/letters', {
    purchaseId,
    title: form.title.trim(),
    recipientName: form.recipient.trim(),
    recipientEmail: form.recipientEmail.trim(),
    body: composeBody(form),
    theme: themeSlug(form.themeId),
    temp_photos: uploadedPhotos(form.photos).map((photo) => ({
      tempId: photo.tempId,
      fileName: photo.fileName,
    })),
  });

  if (status === 202) {
    return { mode: 'queued', message: data?.message || QUEUED_FALLBACK };
  }

  const publicUrl = publicUrlOf(data ?? {});
  if (!publicUrl) {
    return { mode: 'queued', message: data?.message || QUEUED_FALLBACK };
  }

  return {
    mode: 'ready',
    publicUrl,
    qrUrl: qrUrlOf(data ?? {}),
    message: data?.message || '',
  };
};
