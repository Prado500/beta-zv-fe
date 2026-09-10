import React from 'react';
import type { PlayerStatus } from '../../../components/media/useYouTubePlayer';
import { withAlpha, type ThemePalette } from '../../../utils/themePalette';
import type { ThemeDecor } from '../../../utils/themeDecor';
import { youtubeWatchUrl } from '../../../utils/youtube';

interface SongPlayerProps {
  videoId: string;
  /** Contenedor donde la IFrame API monta el vídeo; lo entrega `useYouTubePlayer`. */
  hostRef: React.RefObject<HTMLDivElement | null>;
  status: PlayerStatus;
  errorCode: number | null;
  onToggle: () => void;
  palette: ThemePalette;
  decor: ThemeDecor;
  /** El bloque entero, para saber si sigue a la vista al desplazarse. */
  sectionRef?: React.Ref<HTMLElement>;
}

/** Lo que se dice en el pie según el estado real del reproductor. */
const STATUS_TEXT: Record<PlayerStatus, string> = {
  idle: '',
  loading: 'Preparando la canción…',
  ready: 'Lista para sonar',
  buffering: 'Cargando…',
  playing: 'Sonando',
  paused: 'En pausa',
  ended: 'Terminó · toca para repetirla',
  blocked: 'Toca ▶ en el vídeo para escucharla',
  error: 'No se puede reproducir aquí',
};

/** Traducción de los códigos de `onError` de la IFrame API. */
const describePlayerError = (code: number | null): string => {
  switch (code) {
    case 2:
      return 'El enlace de la canción no es válido.';
    case 100:
      return 'El vídeo ya no existe o es privado.';
    case 101:
    case 150:
      return 'Quien subió el vídeo no permite reproducirlo fuera de YouTube.';
    case 153:
      return 'YouTube no pudo identificar esta página. Ábrela en tu navegador y vuelve a intentarlo.';
    default:
      return 'YouTube no pudo reproducir la canción en esta página.';
  }
};

/**
 * "Nuestra canción": el reproductor visible dentro de la hoja.
 *
 * Va bajo el membrete, antes del texto, por dos motivos. YouTube exige que más
 * de la mitad del reproductor esté a la vista antes de iniciar una
 * reproducción automática, y al abrirse la carta lo primero visible es la
 * cabecera. Y la canción enmarca la lectura: primero suena, luego se lee.
 *
 * El viewport mide al menos 200x200 px y no lleva nada encima: ni el marco ni
 * los controles propios tapan el vídeo, que conserva los suyos.
 */
export const SongPlayer: React.FC<SongPlayerProps> = ({
  videoId,
  hostRef,
  status,
  errorCode,
  onToggle,
  palette,
  decor,
  sectionRef,
}) => {
  const isPlaying = status === 'playing' || status === 'buffering';
  const canToggle = status !== 'error' && status !== 'idle';

  return (
    <section ref={sectionRef} aria-label="Canción de la dedicatoria" className="relative -mx-2 mb-4">
      <div
        className="rounded-2xl p-1.5"
        style={{
          backgroundColor: withAlpha(palette.accent, 0.08),
          border: `1px solid ${withAlpha(decor.metal, 0.45)}`,
        }}
      >
        {/* Viewport del reproductor: nada encima, mínimo 200x200. */}
        <div
          ref={hostRef}
          data-testid="song-player-host"
          className="w-full aspect-[4/3] min-h-[200px] overflow-hidden rounded-xl bg-black [&>iframe]:block [&>iframe]:h-full [&>iframe]:w-full"
        />

        <div className="mt-1.5 flex items-center gap-2 px-1">
          <button
            type="button"
            onClick={onToggle}
            disabled={!canToggle}
            aria-label={isPlaying ? 'Pausar la canción' : 'Reproducir la canción'}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full shadow-xs transition-transform active:scale-95 disabled:cursor-default disabled:opacity-50"
            style={{
              backgroundColor: palette.accent,
              color: palette.cardBg,
              border: `1px solid ${withAlpha(decor.metal, 0.55)}`,
            }}
          >
            <span className="material-symbols-outlined text-sm">{isPlaying ? 'pause' : 'play_arrow'}</span>
          </button>
          <div className="min-w-0 flex-1 text-left">
            <p
              className="truncate text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: palette.text }}
            >
              Nuestra canción
            </p>
            <p className="truncate text-[9px] opacity-70" style={{ color: palette.text }} aria-live="polite">
              {STATUS_TEXT[status]}
            </p>
          </div>
          <span
            aria-hidden="true"
            className={`material-symbols-outlined text-sm ${isPlaying ? 'animate-pulse' : 'opacity-45'}`}
            style={{ color: palette.accent }}
          >
            equalizer
          </span>
        </div>

        {status === 'error' && (
          <p className="mt-1 px-1 text-[9px] leading-snug" style={{ color: palette.text }}>
            {describePlayerError(errorCode)}{' '}
            <a
              href={youtubeWatchUrl(videoId)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2"
              style={{ color: palette.accent }}
            >
              Escuchar en YouTube
            </a>
          </p>
        )}
      </div>
    </section>
  );
};
