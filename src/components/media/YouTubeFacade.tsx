import React, { useState } from 'react';
import { youtubeEmbedUrl, youtubeThumbnail } from '../../utils/youtube';

/** Ancho del relleno gris que YouTube devuelve cuando la miniatura no existe. */
const PLACEHOLDER_WIDTH = 120;

interface YouTubeFacadeProps {
  videoId: string;
  /** Título accesible del vídeo: nombra el botón y el iframe. */
  title: string;
  /** Portada propia; por defecto, la miniatura oficial del vídeo. */
  poster?: string;
  /** Contenido sobre la portada (rótulos, degradados). No recibe clics. */
  children?: React.ReactNode;
  playSize?: 'md' | 'lg';
  className?: string;
}

/**
 * Fachada de vídeo: portada ligera y un botón; el iframe de YouTube solo se
 * monta cuando alguien lo pide.
 *
 * Un reproductor embebido pesa más de un megabyte de JavaScript y deja cookies
 * al cargar; la landing montaba cinco de golpe antes del primer pintado. La
 * miniatura oficial pesa unos 15 KB. Se intenta la de máxima resolución y, si
 * el vídeo no la tiene, se cae a la estándar. Ojo: cuando no existe, YouTube
 * responde 404 pero con una imagen gris de 120x90 dentro, así que el navegador
 * no dispara `error`; hay que reconocer ese relleno por su tamaño al cargar.
 *
 * Ocupa el 100% de su contenedor: quien la usa decide la proporción.
 */
export const YouTubeFacade: React.FC<YouTubeFacadeProps> = ({
  videoId,
  title,
  poster,
  children,
  playSize = 'lg',
  className = '',
}) => {
  const [playing, setPlaying] = useState(false);
  /** Vídeo cuya miniatura `maxres` no existe; para ese se pinta la `hq`. */
  const [maxresMissing, setMaxresMissing] = useState<string | null>(null);

  if (playing) {
    return (
      <iframe
        src={youtubeEmbedUrl(videoId, { autoplay: 1, playsinline: 1, rel: 0 })}
        title={title}
        className={`block h-full w-full border-0 ${className}`}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    );
  }

  const image = poster ?? youtubeThumbnail(videoId, maxresMissing === videoId ? 'hq' : 'maxres');
  const circle = playSize === 'lg' ? 'h-16 w-16' : 'h-14 w-14';
  const icon = playSize === 'lg' ? 'text-[36px]' : 'text-[30px]';

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Reproducir: ${title}`}
      className={`group relative block h-full w-full cursor-pointer overflow-hidden text-left ${className}`}
    >
      <img
        src={image}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => {
          if (!poster) setMaxresMissing(videoId);
        }}
        onLoad={(event) => {
          if (!poster && event.currentTarget.naturalWidth <= PLACEHOLDER_WIDTH) {
            setMaxresMissing(videoId);
          }
        }}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/15"
      />
      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
        <span
          className={`flex ${circle} items-center justify-center rounded-full bg-white/95 shadow-2xl backdrop-blur-sm transition-transform group-hover:scale-110`}
        >
          <span
            className={`material-symbols-outlined text-wine ${icon}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            play_arrow
          </span>
        </span>
      </span>
      {children && <span className="pointer-events-none absolute inset-0">{children}</span>}
    </button>
  );
};
