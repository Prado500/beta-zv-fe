import React from "react";
import type { PlayerStatus } from "../../../components/media/useYouTubePlayer";
import { withAlpha, type ThemePalette } from "../../../utils/themePalette";
import type { ThemeDecor } from "../../../utils/themeDecor";
import { youtubeWatchUrl } from "../../../utils/youtube";

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
  idle: "",
  loading: "Preparando la canción…",
  ready: "Lista para sonar",
  buffering: "Cargando…",
  playing: "Sonando",
  paused: "En pausa",
  ended: "Terminó · toca para repetirla",
  blocked: "Toca ▶ en el vídeo para escucharla",
  error: "No se puede reproducir aquí",
};

/** Traducción de los códigos de `onError` de la IFrame API. */
const describePlayerError = (code: number | null): string => {
  switch (code) {
    case 2:
      return "El enlace de la canción no es válido.";
    case 100:
      return "El vídeo ya no existe o es privado.";
    case 101:
    case 150:
      return "Quien subió el vídeo no permite reproducirlo fuera de YouTube.";
    case 153:
      return "YouTube no pudo identificar esta página. Ábrela en tu navegador y vuelve a intentarlo.";
    default:
      return "YouTube no pudo reproducir la canción en esta página.";
  }
};

/**
 * "Nuestra canción": el reproductor visible dentro de la hoja.
 *
 * Va al final de la carta, tras la firma: la lectura corre de un tirón y la
 * canción llega cuando ya se firmó. Es la disposición validada en producto.
 *
 * El precio de bajarla: YouTube pide ver más de la mitad del reproductor para
 * arrancar solo, y al abrirse la carta éste queda bajo el pliegue. Cuando lo
 * rechaza, el estado pasa a `blocked` y el mando flotante —visible justo
 * mientras el vídeo no se ve— lleva hasta él, donde un toque sí funciona.
 *
 * El viewport mide al menos 200x200 px y no lleva nada encima: ni el marco ni
 * los controles propios tapan el vídeo, que conserva los suyos.
 *
 * Presentación: la pantalla va sola, con el borde y la sombra del tema, y los
 * controles debajo en una píldora aparte —los mismos dos bloques apilados que
 * usa la carta descargable—. Antes los dos vivían dentro de una caja teñida a
 * todo el ancho de la hoja.
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
  const isPlaying = status === "playing" || status === "buffering";
  const canToggle = status !== "error" && status !== "idle";

  return (
    <section
      ref={sectionRef}
      aria-label="Canción de la dedicatoria"
      className="relative mb-5 flex flex-col items-center gap-2.5"
    >
      {/*
        Viewport del reproductor: nada encima, mínimo 200x200. El ancho tiene
        tope para que no se estire a toda la hoja; con 4:3 el alto nunca baja
        del mínimo que pide YouTube.
      */}
      <div
        ref={hostRef}
        data-testid="song-player-host"
        className="aspect-[4/3] min-h-[200px] w-full max-w-[280px] overflow-hidden rounded-[18px] bg-black [&>iframe]:block [&>iframe]:h-full [&>iframe]:w-full"
        style={{
          border: `1px solid ${withAlpha(decor.metal, 0.55)}`,
          boxShadow: `0 10px 30px -12px ${withAlpha(palette.text, 0.55)}`,
        }}
      />

      {/* Los controles propios, en su píldora: no tapan el vídeo, lo acompañan */}
      <div
        className="flex w-full max-w-[280px] items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3.5"
        style={{
          backgroundColor: withAlpha(palette.cardBg, 0.95),
          border: `1px solid ${withAlpha(decor.metal, 0.5)}`,
          boxShadow: `0 12px 28px -14px ${withAlpha(palette.text, 0.6)}`,
        }}
      >
        <button
          type="button"
          onClick={onToggle}
          disabled={!canToggle}
          aria-label={isPlaying ? "Pausar la canción" : "Reproducir la canción"}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-transform active:scale-95 disabled:cursor-default disabled:opacity-50"
          style={{
            backgroundColor: palette.accent,
            color: palette.cardBg,
            border: `1px solid ${withAlpha(decor.metal, 0.55)}`,
          }}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isPlaying ? "pause" : "play_arrow"}
          </span>
        </button>
        <div className="min-w-0 flex-1 text-left">
          {/*
              Sin versalitas ni espaciado: dentro de la hoja la píldora mide lo
              que mide el vídeo, y en mayúsculas espaciadas el rótulo no cabía.
              El mando flotante sí las conserva: allí el texto manda sobre el
              ancho, no al revés.
            */}
          <p
            className="truncate text-[12px] font-semibold"
            style={{ color: palette.text }}
          >
            Nuestra canción
          </p>
          <p
            className="truncate text-[11px] opacity-70"
            style={{ color: palette.text }}
            aria-live="polite"
          >
            {STATUS_TEXT[status]}
          </p>
        </div>
        <span
          aria-hidden="true"
          className={`material-symbols-outlined text-base ${isPlaying ? "animate-pulse" : "opacity-45"}`}
          style={{ color: palette.accent }}
        >
          equalizer
        </span>
      </div>

      {status === "error" && (
        <p
          className="max-w-[280px] px-1 text-center text-[10px] leading-snug"
          style={{ color: palette.text }}
        >
          {describePlayerError(errorCode)}{" "}
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
    </section>
  );
};
