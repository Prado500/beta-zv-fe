import React from 'react';
import type { PlayerStatus } from '../../../components/media/useYouTubePlayer';
import { withAlpha, type ThemePalette } from '../../../utils/themePalette';
import type { ThemeDecor } from '../../../utils/themeDecor';

interface SongChipProps {
  /** Se muestra solo cuando el reproductor quedó fuera de la vista. */
  visible: boolean;
  status: PlayerStatus;
  onToggle: () => void;
  /** Vuelve a llevar el reproductor a la vista: para cuando hay que tocarlo. */
  onReveal: () => void;
  palette: ThemePalette;
  decor: ThemeDecor;
}

const CHIP_TEXT: Partial<Record<PlayerStatus, string>> = {
  loading: 'Preparando…',
  ready: 'Lista para sonar',
  buffering: 'Cargando…',
  playing: 'Sonando',
  paused: 'En pausa',
  ended: 'Terminó',
  blocked: 'Toca para escuchar',
  error: 'Ver la canción',
};

/**
 * Mando a distancia de la canción cuando el reproductor ya no se ve.
 *
 * Anclado a la base de la pantalla, fuera del área con scroll. Solo existe
 * mientras el reproductor está fuera de la vista: así nunca se pone encima de
 * él, que es lo que las políticas de YouTube prohíben. Si el navegador bloqueó
 * la reproducción, en vez de insistir lleva de vuelta al vídeo, donde un toque
 * sí funciona.
 */
export const SongChip: React.FC<SongChipProps> = ({
  visible,
  status,
  onToggle,
  onReveal,
  palette,
  decor,
}) => {
  const isPlaying = status === 'playing' || status === 'buffering';
  const needsReveal = status === 'blocked' || status === 'error';
  const label = needsReveal
    ? 'Ir a la canción'
    : isPlaying
      ? 'Pausar la canción'
      : 'Reproducir la canción';

  return (
    <div
      className={`absolute bottom-3 left-1/2 z-30 -translate-x-1/2 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
      aria-hidden={!visible}
      data-testid="song-chip"
    >
      <button
        type="button"
        onClick={needsReveal ? onReveal : onToggle}
        tabIndex={visible ? 0 : -1}
        aria-label={label}
        className="flex cursor-pointer items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 shadow-[0_12px_28px_-14px_rgba(0,0,0,0.6)] backdrop-blur-md transition-transform active:scale-95"
        style={{
          backgroundColor: withAlpha(palette.cardBg, 0.95),
          border: `1px solid ${withAlpha(decor.metal, 0.5)}`,
          color: palette.text,
        }}
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ backgroundColor: palette.accent, color: palette.cardBg }}
        >
          <span className="material-symbols-outlined text-sm">
            {needsReveal ? 'music_note' : isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </span>
        <span className="text-left leading-tight">
          <span className="block text-[9px] font-semibold uppercase tracking-[0.14em]">
            Nuestra canción
          </span>
          <span className="block text-[9px] opacity-70">{CHIP_TEXT[status] ?? ''}</span>
        </span>
        <span
          aria-hidden="true"
          className={`material-symbols-outlined text-sm ${isPlaying ? 'animate-pulse' : 'opacity-45'}`}
          style={{ color: palette.accent }}
        >
          equalizer
        </span>
      </button>
    </div>
  );
};
