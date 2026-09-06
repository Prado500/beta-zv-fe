import { apiPost, apiUpload } from '../../../utils/api';
import { themeSlug, type DedicationForm, type PhotoUpload } from '../types';

/**
 * Cartas: subida anticipada de fotos y creación asíncrona.
 *
 * El backend ya no escribe la carta dentro de la petición: valida la compra,
 * publica el encargo en la cola y responde **202**. Por eso aquí no hay ninguna
 * `publicUrl` ni `qrUrl` que devolver — llegan por correo cuando el worker
 * termina. Cualquier pantalla que prometa un QR inmediato estaría mintiendo.
 */

/** Respuesta del *eager upload*: la foto ya está en el contenedor efímero. */
export interface EagerPhoto {
  tempId: string;
  fileName: string;
  contentType: string;
  byteSize: number;
}

export interface LetterQueued {
  status: string;
  purchaseId: string;
  message: string;
}

/**
 * Sube una foto antes de que exista la carta.
 *
 * Devuelve un `tempId`, **no una URL**: el contenedor es privado y el navegador
 * no puede leerlo. La previsualización se hace con `URL.createObjectURL` sobre
 * el archivo local (ver `EditorPage`), así nunca se ve una imagen rota.
 */
export const uploadEagerPhoto = (file: Blob, fileName: string): Promise<EagerPhoto> => {
  const form = new FormData();
  form.append('file', file, fileName);
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
 * Encola la carta. Responde 202 sin `id`, `publicUrl` ni `qrUrl`: la carta aún
 * no existe en la base de datos cuando esta promesa se resuelve.
 */
export const createLetter = (purchaseId: string, form: DedicationForm): Promise<LetterQueued> =>
  apiPost<LetterQueued>('/api/v1/letters', {
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
