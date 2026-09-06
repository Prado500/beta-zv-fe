import { useCallback, useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { compressImage } from '../../../utils/compressImage';
import { uploadEagerPhoto } from '../services/letters';
import { MAX_PHOTOS, type LetterInput, type LetterValues } from '../schemas/letterSchema';

/**
 * Eager upload: la foto sale hacia el servidor en cuanto se elige (IOP #4).
 *
 * Cuando el usuario termine de escribir, sus fotos llevarán rato guardadas y el
 * envío final será una sola petición corta. Ese es el trato: gastar la espera
 * mientras la persona sigue trabajando, no cuando pulsa el botón.
 *
 * La lista vive dentro del formulario, no en un estado paralelo. Así el `tempId`
 * —lo único que el backend necesita para mover la foto— viaja con el resto de
 * los campos y hay una sola verdad sobre qué fotos hay.
 */

interface PreparedPhoto {
  blob: Blob;
  previewUrl: string;
  fileName: string;
}

export interface PhotoUploads {
  photos: LetterInput['photos'];
  /** Reduciendo imágenes en el navegador, antes de que salga nada. */
  compressing: boolean;
  /** Fotos todavía en vuelo. Mientras haya una, el envío final se bloquea. */
  uploading: number;
  ready: number;
  error: string | null;
  addFiles: (files: File[]) => Promise<void>;
  removePhoto: (index: number) => void;
}

export const usePhotoUploads = (
  form: UseFormReturn<LetterInput, unknown, LetterValues>,
): PhotoUploads => {
  const { getValues, setValue, watch } = form;
  const photos = watch('photos');

  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Escribe sobre la lista viva del formulario.
   *
   * `getValues` y no el `photos` del render: varias subidas terminan a la vez y
   * cada una debe partir de lo último escrito. Con el valor capturado en el
   * render, la última en volver borraría a las anteriores.
   */
  const patch = useCallback(
    (previewUrl: string, changes: Partial<LetterInput['photos'][number]>) => {
      setValue(
        'photos',
        getValues('photos').map((photo) =>
          photo.previewUrl === previewUrl ? { ...photo, ...changes } : photo,
        ),
        { shouldValidate: true, shouldDirty: true },
      );
    },
    [getValues, setValue],
  );

  const addFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      if (getValues('photos').length + files.length > MAX_PHOTOS) {
        setError(`Puedes subir un máximo de ${MAX_PHOTOS} fotos.`);
        return;
      }
      setError(null);

      // Se reducen antes de subir: el original de un móvil pesa 3-5 MB y el
      // backend rechaza por encima de MAX_PHOTO_BYTES.
      setCompressing(true);
      let prepared: PreparedPhoto[];
      try {
        const results = await Promise.all(files.map(compressImage));
        prepared = results.map(({ blob }, index) => ({
          blob,
          previewUrl: URL.createObjectURL(blob),
          fileName: files[index].name || `foto-${index + 1}.jpg`,
        }));
      } catch {
        // `compressImage` ya devuelve el original si algo falla; si aun así
        // revienta, se avisa aquí en vez de dejar una promesa colgando.
        setError('No pudimos preparar esas fotos. Prueba con otras.');
        return;
      } finally {
        setCompressing(false);
      }

      setValue(
        'photos',
        [
          ...getValues('photos'),
          ...prepared.map(({ previewUrl, fileName }) => ({
            tempId: null,
            previewUrl,
            fileName,
            status: 'uploading' as const,
          })),
        ],
        { shouldValidate: true, shouldDirty: true },
      );

      // Cada subida actualiza su propia foto por `previewUrl`, que es única: el
      // usuario puede quitar o añadir otras mientras estas siguen viajando.
      await Promise.all(
        prepared.map(async ({ blob, previewUrl, fileName }) => {
          try {
            const stored = await uploadEagerPhoto(blob, fileName);
            patch(previewUrl, { tempId: stored.tempId, status: 'ready' });
          } catch {
            // Una foto que no subió no cancela la carta: se marca y se puede
            // quitar. El envío final solo manda las que tienen `tempId`.
            patch(previewUrl, { status: 'error' });
          }
        }),
      );
    },
    [getValues, patch, setValue],
  );

  const removePhoto = useCallback(
    (index: number) => {
      const current = getValues('photos');
      const gone = current[index];
      if (gone) URL.revokeObjectURL(gone.previewUrl);
      setValue(
        'photos',
        current.filter((_, position) => position !== index),
        { shouldValidate: true, shouldDirty: true },
      );
      setError(null);
    },
    [getValues, setValue],
  );

  // Las URLs `blob:` viven mientras dure la pestaña; al salir se liberan. El ref
  // guarda la última lista para poder revocarla al desmontar sin que la limpieza
  // dependa de las fotos y se dispare en cada subida, revocando las que están en uso.
  const latest = useRef(photos);
  useEffect(() => {
    latest.current = photos;
  }, [photos]);
  useEffect(
    () => () => {
      latest.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    },
    [],
  );

  return {
    photos,
    compressing,
    uploading: photos.filter((photo) => photo.status === 'uploading').length,
    ready: photos.filter((photo) => photo.status === 'ready' && photo.tempId).length,
    error,
    addFiles,
    removePhoto,
  };
};
