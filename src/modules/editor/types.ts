/**
 * Foto del editor. Vive en dos sitios a la vez y por eso guarda dos referencias:
 *
 * - `previewUrl` es un `blob:` local (`URL.createObjectURL`) y es lo ÚNICO que se
 *   puede pintar. El contenedor temporal del backend es privado: no devuelve una
 *   URL pública, así que pintar la respuesta del servidor daría una imagen rota.
 * - `tempId` es la clave que devolvió el *eager upload* y lo único que se manda
 *   al crear la carta; el worker la usa para trasladar la foto al almacenamiento
 *   permanente.
 */
export interface PhotoUpload {
  /** Clave temporal del servidor. `null` mientras la subida está en curso o falló. */
  tempId: string | null;
  /** `blob:` local para la previsualización. */
  previewUrl: string;
  /** Nombre original del archivo; el backend lo guarda como pie de foto. */
  fileName: string;
  status: 'uploading' | 'ready' | 'error';
}

export interface DedicationForm {
  recipient: string;
  /** Correo de quien recibe la carta. El backend lo exige para poder enviarla. */
  recipientEmail: string;
  title: string;
  message: string;
  sender: string;
  songUrl: string;
  themeId: string;
  photos: PhotoUpload[];
}

/**
 * Identificador del tema tal como lo acepta el backend.
 *
 * `LetterCreate.theme` valida contra `^[a-z0-9\-]+$`, así que un id en camelCase
 * como `pastelPink` provocaría un 422. Se traduce a `pastel-pink` al enviar y se
 * deshace al leer la carta publicada.
 */
export const themeSlug = (id: string): string =>
  id.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

export const themeFromSlug = (slug: string): string =>
  Object.keys(THEME_PRESETS).find((id) => themeSlug(id) === slug) ?? 'classic';

export interface ThemePreset {
  id: string;
  name: string;
  bgClass: string;
  cardBg: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  animationType: 'hearts' | 'petals' | 'stars' | 'sunsetGlow' | 'sparkles' | 'leaves' | 'butterflies' | 'fireflies';
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
  classic: {
    id: 'classic',
    name: 'Romántico Clásico',
    bgClass: 'bg-[#fef8fa]',
    cardBg: 'bg-white',
    textColor: 'text-[#1d1b1d]',
    accentColor: 'text-[#a20513]',
    borderColor: 'border-[#e4beba]',
    animationType: 'hearts',
  },
  pastelPink: {
    id: 'pastelPink',
    name: 'Rosado Pastel',
    bgClass: 'bg-[#fff5f7]',
    cardBg: 'bg-[#ffe4e6]',
    textColor: 'text-[#881337]',
    accentColor: 'text-[#e11d48]',
    borderColor: 'border-[#fecdd3]',
    animationType: 'petals',
  },
  starry: {
    id: 'starry',
    name: 'Noche Estrellada',
    bgClass: 'bg-[#0f172a]',
    cardBg: 'bg-[#1e293b]',
    textColor: 'text-[#f8fafc]',
    accentColor: 'text-[#fbbf24]',
    borderColor: 'border-[#334155]',
    animationType: 'stars',
  },
  sunset: {
    id: 'sunset',
    name: 'Atardecer Cálido',
    bgClass: 'bg-[#fff7ed]',
    cardBg: 'bg-[#ffedd5]',
    textColor: 'text-[#431407]',
    accentColor: 'text-[#ea580c]',
    borderColor: 'border-[#fed7aa]',
    animationType: 'sunsetGlow',
  },
  // --- 4 NUEVOS TEMAS ---
  lavender: {
    id: 'lavender',
    name: 'Sueño de Lavanda',
    bgClass: 'bg-[#f5f3ff]',
    cardBg: 'bg-[#ede9fe]',
    textColor: 'text-[#4c1d95]',
    accentColor: 'text-[#7c3aed]',
    borderColor: 'border-[#ddd6fe]',
    animationType: 'sparkles',
  },
  emerald: {
    id: 'emerald',
    name: 'Jardín Esmeralda',
    bgClass: 'bg-[#f0fdf4]',
    cardBg: 'bg-[#dcfce7]',
    textColor: 'text-[#14532d]',
    accentColor: 'text-[#16a34a]',
    borderColor: 'border-[#bbf7d0]',
    animationType: 'leaves',
  },
  midnight: {
    id: 'midnight',
    name: 'Medianoche Azul',
    bgClass: 'bg-[#090d16]',
    cardBg: 'bg-[#111827]',
    textColor: 'text-[#f3f4f6]',
    accentColor: 'text-[#38bdf8]',
    borderColor: 'border-[#1f2937]',
    animationType: 'fireflies',
  },
  vintage: {
    id: 'vintage',
    name: 'Carta Vintage',
    bgClass: 'bg-[#faf5ef]',
    cardBg: 'bg-[#f5ebe0]',
    textColor: 'text-[#4a3b32]',
    accentColor: 'text-[#b45309]',
    borderColor: 'border-[#e6d5c3]',
    animationType: 'butterflies',
  },
};