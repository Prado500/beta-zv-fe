/**
 * Reduce una foto antes de que entre a la dedicatoria.
 *
 * Una foto de móvil ronda los 3-5 MB, y en la carta se muestra a 84px
 * intercalada, 92px en la galería y como mucho a media pantalla en el visor.
 * Guardar el original no aporta nada visible y sí desborda todo: el almacén del
 * navegador (~5 MB), el HTML descargable —que lleva las fotos en base64, un
 * tercio más pesadas— y lo que tarda en abrir quien la recibe.
 */

/** Lado mayor tras el reescalado. Cubre de sobra el visor a pantalla completa. */
const MAX_SIDE = 1400;

const QUALITY = 0.82;

/** WebP primero; si el navegador no lo produce, JPEG. */
const FORMATS = ['image/webp', 'image/jpeg'] as const;

const toBlob = (canvas: HTMLCanvasElement, type: string): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));

/**
 * Carga el archivo respetando la orientación EXIF. Sin `from-image`, las fotos
 * verticales de móvil salen tumbadas.
 */
const load = async (file: File): Promise<ImageBitmap | HTMLImageElement> => {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* cae al respaldo */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};

export interface CompressResult {
  blob: Blob;
  /** Bytes originales, para poder informar cuánto se ahorró. */
  originalSize: number;
}

/**
 * Devuelve la versión reducida. Si algo falla, devuelve el archivo original:
 * más vale una foto pesada que una dedicatoria sin foto.
 */
export const compressImage = async (file: File): Promise<CompressResult> => {
  const originalSize = file.size;

  try {
    const source = await load(file);
    const width = 'width' in source ? source.width : 0;
    const height = 'height' in source ? source.height : 0;
    if (!width || !height) return { blob: file, originalSize };

    const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return { blob: file, originalSize };
    ctx.drawImage(source as CanvasImageSource, 0, 0, canvas.width, canvas.height);
    if ('close' in source) source.close();

    for (const type of FORMATS) {
      const blob = await toBlob(canvas, type);
      // Un canvas que no soporta el formato devuelve PNG, que suele pesar más
      if (blob && blob.type === type && blob.size < originalSize) {
        return { blob, originalSize };
      }
    }
    return { blob: file, originalSize };
  } catch {
    return { blob: file, originalSize };
  }
};
