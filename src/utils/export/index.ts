import { THEME_PRESETS, type DedicationForm } from '../../modules/editor/types';
import { planContent } from './content';
import { encodeFlowerAssets } from './flowers';
import { blobToBase64, escapeHtml } from './media';
import { resolvePalette } from '../themePalette';
import { decorFor } from '../themeDecor';
import { giftsFor } from '../themeGifts';
import { buildDocument } from './templates/document';
import { getYouTubeId } from './youtube';

const FALLBACK = {
  title: 'Una Carta Especial',
  recipient: 'Tu Persona Especial',
  sender: 'Alguien que te quiere',
  message: 'Sin mensaje especificado...',
};

/** Iniciales del destinatario, calculadas antes de escapar el nombre. */
const monogramOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

/** Nombre de archivo seguro a partir del destinatario. */
const fileNameFor = (recipient: string): string => {
  const slug = recipient
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  return `dedicatoria_${slug || 'especial'}.html`;
};

/** Genera el HTML de la carta con todo incrustado y lo entrega al navegador. */
export const downloadCardHtml = async (data: DedicationForm): Promise<void> => {
  const theme = THEME_PRESETS[data.themeId] || THEME_PRESETS.classic;
  const palette = resolvePalette(theme);
  const videoId = getYouTubeId(data.songUrl);

  const [photos, flowers] = await Promise.all([
    Promise.all((data.photos ?? []).map((photo) => blobToBase64(photo.previewUrl))),
    encodeFlowerAssets(data.themeId, theme.animationType),
  ]);

  const plan = planContent(escapeHtml(data.message || FALLBACK.message), photos);

  const html = buildDocument({
    copy: {
      title: escapeHtml(data.title || FALLBACK.title),
      recipient: escapeHtml(data.recipient || FALLBACK.recipient),
      monogram: monogramOf(data.recipient || FALLBACK.recipient),
      sender: escapeHtml(data.sender || FALLBACK.sender),
      songUrl: escapeHtml(data.songUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : '#')),
      hasSong: Boolean(videoId),
    },
    palette,
    decor: decorFor(data.themeId),
    gifts: giftsFor(data.themeId),
    animationType: theme.animationType,
    plan,
    flowers,
  });

  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileNameFor(data.recipient || FALLBACK.recipient);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};
