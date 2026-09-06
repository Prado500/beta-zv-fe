import type { DedicationForm } from '../types';
import { blobToBase64 } from '../../../utils/export/media';
import { saveCard } from '../../../utils/cardStore';
import { cardUrlFor } from '../../../config/site';

export interface PublishedCard {
  id: string;
  url: string;
  /** La copia con las fotos ya incrustadas, que es la que se comparte. */
  data: DedicationForm;
}

const newId = (): string =>
  (crypto.randomUUID?.() ?? `${Date.now()}${Math.random()}`).replace(/[^a-z0-9]/gi, '').slice(0, 12);

/**
 * Publica la dedicatoria y devuelve su enlace público.
 *
 * ESTE ES EL PUNTO DE CONEXIÓN CON EL BACKEND. Hoy persiste en el navegador,
 * de modo que el enlace sólo abre en el equipo donde se creó; para que el QR
 * funcione de verdad al escanearlo desde otro teléfono hay que reemplazar el
 * `saveCard` por un POST a la API y devolver el id que responda el servidor.
 */
export const publishDedication = async (
  form: DedicationForm,
  /**
   * Id de una publicación previa de esta misma sesión. Se sobrescribe en vez de
   * crear otro registro: cada publicación guardaba todas las fotos de nuevo y a
   * la segunda o tercera se agotaba la cuota del navegador.
   */
  existingId?: string,
): Promise<PublishedCard> => {
  // Las URLs de tipo blob: mueren al recargar; se congelan a base64 antes de guardar.
  const photos = await Promise.all((form.photos || []).map(blobToBase64));
  const data: DedicationForm = { ...form, photos };

  const id = existingId ?? newId();
  saveCard(id, data);

  return { id, url: cardUrlFor(id), data };
};
