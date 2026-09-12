import { apiGet, apiUrl } from '../../../utils/api';
import { parseBody } from '../../editor/services/letterBody';
import { themeFromSlug, type DedicationForm } from '../../editor/types';

/** Lo que devuelve `GET /api/v1/public/letters/{slug}`: sin usuario ni correo. */
export interface PublicPhoto {
  position: number;
  caption: string | null;
  url: string;
}

export interface PublicLetter {
  letterId: string;
  publishedVersion: number;
  title: string;
  recipientName: string;
  body: string;
  theme: string;
  photos: PublicPhoto[];
  publishedAt: string;
}

export const publicLetterPath = (slug: string): string =>
  `/api/v1/public/letters/${encodeURIComponent(slug)}`;

export const fetchPublicLetter = (slug: string, signal?: AbortSignal): Promise<PublicLetter> =>
  apiGet<PublicLetter>(publicLetterPath(slug), signal);

/**
 * La carta publicada no distingue firma ni canción: viajan dentro del cuerpo
 * y aquí se separan con el mismo parser que deshace `composeBody`.
 */
export const toDedicationForm = (letter: PublicLetter): DedicationForm => {
  const { message, sender, songUrl } = parseBody(letter.body);
  return {
    title: letter.title,
    recipient: letter.recipientName,
    recipientEmail: '',
    sender,
    message,
    songUrl,
    themeId: themeFromSlug(letter.theme),
    photos: letter.photos.map((photo) => ({
      tempId: null,
      // Ruta servida por la API pública; no hay `blob:` que valga fuera del editor.
      previewUrl: apiUrl(photo.url),
      fileName: photo.caption ?? '',
      status: 'ready' as const,
    })),
  };
};
