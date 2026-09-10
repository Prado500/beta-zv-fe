/**
 * Todo lo que el frontend sabe de YouTube, en un solo sitio.
 *
 * `getYouTubeId` vivía duplicado en el exportador y en la previsualización, con
 * una expresión regular que no reconocía `shorts/`, `live/` ni los enlaces
 * compartidos con `?si=`. Aquí se parsea la URL de verdad y el resto del código
 * solo pregunta por el ID.
 */

/** Un ID de vídeo son exactamente 11 caracteres de este alfabeto. */
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** Rutas cuyo segundo segmento es el ID: `/embed/<id>`, `/shorts/<id>`… */
const PATH_PREFIXES = new Set(['embed', 'shorts', 'live', 'v', 'e']);

const YOUTUBE_HOSTS = new Set(['youtube.com', 'youtube-nocookie.com']);

const stripSubdomain = (host: string): string => host.replace(/^(www|m|music|gaming)\./, '');

/**
 * ID de 11 caracteres a partir de cualquier forma de enlace de YouTube:
 * `watch?v=`, `youtu.be/`, `shorts/`, `live/`, `embed/`, con o sin `www.`,
 * `m.` o `music.`. Devuelve `null` si no es un enlace de YouTube reconocible.
 * Un ID suelto también se rechaza: el campo pide un enlace, y once letras al
 * azar no deberían pasar por uno.
 */
export const getYouTubeId = (url: string): string | null => {
  const value = typeof url === 'string' ? url.trim() : '';
  if (!value) return null;

  let parsed: URL;
  try {
    parsed = new URL(/^[a-z]+:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }

  const host = stripSubdomain(parsed.hostname.toLowerCase());
  const segments = parsed.pathname.split('/').filter(Boolean);
  let candidate: string | null = null;

  if (host === 'youtu.be') {
    candidate = segments[0] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (segments[0] === 'watch') candidate = parsed.searchParams.get('v');
    else if (segments[0] && PATH_PREFIXES.has(segments[0])) candidate = segments[1] ?? null;
  }

  return candidate && VIDEO_ID.test(candidate) ? candidate : null;
};

/** Página del vídeo en YouTube: el enlace de escape cuando no se puede reproducir aquí. */
export const youtubeWatchUrl = (videoId: string): string =>
  `https://www.youtube.com/watch?v=${videoId}`;

export type ThumbnailQuality = 'maxres' | 'hq' | 'mq';

/** Miniatura oficial. `maxres` no existe para todos los vídeos: hay que tener plan B. */
export const youtubeThumbnail = (videoId: string, quality: ThumbnailQuality = 'hq'): string =>
  `https://i.ytimg.com/vi/${videoId}/${quality}default.jpg`;

/**
 * Dominio del reproductor embebido. Se probó `youtube-nocookie.com` y se
 * descartó: frente a las licencias y al `Referer` se comporta exactamente
 * igual que `www.youtube.com`, y solo añadía una variable al diagnóstico.
 */
export const YOUTUBE_EMBED_HOST = 'https://www.youtube.com';

export const YOUTUBE_IFRAME_API_URL = 'https://www.youtube.com/iframe_api';

export interface EmbedParams {
  autoplay?: 0 | 1;
  /** En iOS, sin esto el vídeo se abre a pantalla completa. */
  playsinline?: 0 | 1;
  /** Con 0, los vídeos sugeridos al final son solo del mismo canal. */
  rel?: 0 | 1;
}

/**
 * URL del iframe clásico, sin API, para las fachadas de la landing.
 *
 * Lleva siempre `origin`: es la identificación que YouTube acepta cuando el
 * `Referer` no llega —navegadores embebidos en apps, o un hosting que manda
 * `Referrer-Policy: same-origin`— y sin la cual responde "Error 153".
 */
export const youtubeEmbedUrl = (videoId: string, params: EmbedParams = {}): string => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  if (typeof window !== 'undefined') query.set('origin', window.location.origin);
  const suffix = query.toString();
  return `${YOUTUBE_EMBED_HOST}/embed/${videoId}${suffix ? `?${suffix}` : ''}`;
};
