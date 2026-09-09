import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { YOUTUBE_EMBED_HOST } from '../../utils/youtube';
import { loadYouTubeIframeApi } from './youtubeIframeApi';

/**
 * Reproductor de YouTube sobre la IFrame Player API oficial.
 *
 * Sustituye al iframe con `display: none` que hacía de "audio de fondo": ese
 * uso incumple las políticas de YouTube (reproductor de al menos 200x200 px,
 * visible y sin nada encima) y, peor, escondía sus pantallas de error, así que
 * cualquier fallo era un silencio sin explicación.
 *
 * El hook no pinta nada. Entrega un `hostRef` donde la API inserta el iframe,
 * el estado real del reproductor —el que cuentan sus eventos, no el que se
 * supone— y tres órdenes: `play`, `pause`, `toggle`.
 */

export type PlayerStatus =
  /** Sin vídeo que reproducir. */
  | 'idle'
  /** La API o el reproductor están cargando. */
  | 'loading'
  /** Listo, con el vídeo en cola y sin sonar. */
  | 'ready'
  | 'buffering'
  | 'playing'
  | 'paused'
  | 'ended'
  /** El navegador rechazó reproducir: hace falta un toque dentro del vídeo. */
  | 'blocked'
  /** YouTube no puede reproducir este vídeo; `errorCode` dice por qué. */
  | 'error';

export interface YouTubePlayerControls {
  /** Contenedor donde la API inserta el iframe. Debe tener tamaño propio. */
  hostRef: RefObject<HTMLDivElement | null>;
  status: PlayerStatus;
  /** Código de `onError` de YouTube cuando `status` es 'error'. */
  errorCode: number | null;
  play: () => void;
  pause: () => void;
  toggle: () => void;
}

/**
 * Tiempo que se espera a que el vídeo pase a PLAYING o BUFFERING tras pedirlo.
 * Si no lo hace, el navegador lo bloqueó: iOS no traspasa el gesto del usuario
 * a un iframe de otro origen, y el evento `onAutoplayBlocked` no llega siempre.
 */
export const AUTOPLAY_GRACE_MS = 1500;

/** Valores de `YT.PlayerState`, a mano para no depender del global en pruebas. */
const PLAYING = 1;
const BUFFERING = 3;

const STATUS_BY_STATE: Record<number, PlayerStatus | undefined> = {
  [-1]: 'ready',
  0: 'ended',
  1: 'playing',
  2: 'paused',
  3: 'buffering',
  5: 'ready',
};

export const useYouTubePlayer = (videoId: string | null): YouTubePlayerControls => {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const readyRef = useRef(false);
  /** Último vídeo pedido; `onReady` lo compara por si cambió mientras cargaba. */
  const activeVideoRef = useRef<string | null>(videoId);
  /** Se pidió reproducir antes de que el reproductor estuviera listo. */
  const wantsPlayRef = useRef(false);
  const graceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [errorCode, setErrorCode] = useState<number | null>(null);

  const clearGrace = useCallback(() => {
    if (graceRef.current) {
      clearTimeout(graceRef.current);
      graceRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    const player = playerRef.current;
    if (!player || !readyRef.current) {
      wantsPlayRef.current = true;
      return;
    }
    wantsPlayRef.current = false;
    player.playVideo();

    clearGrace();
    graceRef.current = setTimeout(() => {
      graceRef.current = null;
      if (playerRef.current !== player) return;
      const state = player.getPlayerState();
      if (state !== PLAYING && state !== BUFFERING) setStatus('blocked');
    }, AUTOPLAY_GRACE_MS);
  }, [clearGrace]);

  const pause = useCallback(() => {
    wantsPlayRef.current = false;
    clearGrace();
    if (playerRef.current && readyRef.current) playerRef.current.pauseVideo();
  }, [clearGrace]);

  const toggle = useCallback(() => {
    if (status === 'playing' || status === 'buffering') pause();
    else play();
  }, [status, play, pause]);

  const destroy = useCallback(() => {
    clearGrace();
    readyRef.current = false;
    wantsPlayRef.current = false;
    playerRef.current?.destroy();
    playerRef.current = null;
  }, [clearGrace]);

  useEffect(() => {
    activeVideoRef.current = videoId;
    const host = hostRef.current;

    if (!videoId || !host) {
      // Sin vídeo no hay reproductor: se destruye para que el siguiente enlace
      // válido monte uno nuevo en su contenedor y no en un iframe huérfano.
      destroy();
      return;
    }

    const player = playerRef.current;
    if (player) {
      // Cambio de canción en el editor. Si todavía está cargando, `onReady`
      // encolará el último vídeo pedido.
      if (readyRef.current) player.cueVideoById(videoId);
      return;
    }

    let cancelled = false;
    // La API reemplaza el elemento que recibe por el iframe: se le da uno propio
    // para que el contenedor gestionado por React quede intacto.
    const target = document.createElement('div');
    host.appendChild(target);

    void loadYouTubeIframeApi()
      .then((api) => {
        if (cancelled) {
          target.remove();
          return;
        }
        setStatus('loading');
        playerRef.current = new api.Player(target, {
          host: YOUTUBE_EMBED_HOST,
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 0,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              readyRef.current = true;
              const wanted = activeVideoRef.current;
              if (wanted && wanted !== videoId) event.target.cueVideoById(wanted);
              setStatus((current) => (current === 'error' ? current : 'ready'));
              if (wantsPlayRef.current) play();
            },
            onStateChange: (event) => {
              const next = STATUS_BY_STATE[event.data];
              if (!next) return;
              if (next === 'playing' || next === 'buffering') clearGrace();
              setErrorCode(null);
              setStatus(next);
            },
            onError: (event) => {
              clearGrace();
              setErrorCode(event.data);
              setStatus('error');
            },
            onAutoplayBlocked: () => {
              clearGrace();
              setStatus('blocked');
            },
          },
        });
      })
      .catch(() => {
        if (cancelled) return;
        setErrorCode(null);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [videoId, play, clearGrace, destroy]);

  // Al desmontar se retira el iframe: si no, seguiría sonando sin pantalla.
  useEffect(() => destroy, [destroy]);

  return {
    hostRef,
    // Mientras hay vídeo y el reproductor aún no ha dicho nada, está cargando.
    status: videoId ? (status === 'idle' ? 'loading' : status) : 'idle',
    errorCode,
    play,
    pause,
    toggle,
  };
};
