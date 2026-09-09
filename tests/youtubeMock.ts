import { act } from '@testing-library/react';
import { vi } from 'vitest';
import { resetYouTubeIframeApi } from '../src/components/media/youtubeIframeApi';

/**
 * Doble de `YT.Player` para las pruebas.
 *
 * No carga nada de YouTube: registra con qué opciones se creó, reemplaza el
 * elemento por un iframe falso (como hace la API real) y deja que cada prueba
 * dispare los eventos que quiera —listo, cambio de estado, error, autoplay
 * bloqueado— exactamente como los dispararía el reproductor de verdad.
 */
export class FakePlayer {
  readonly options: YT.PlayerOptions;
  readonly iframe: HTMLIFrameElement;
  private state = -1;

  playVideo = vi.fn();
  pauseVideo = vi.fn();
  cueVideoById = vi.fn();
  destroy = vi.fn(() => this.iframe.remove());

  constructor(element: HTMLElement, options: YT.PlayerOptions) {
    this.options = options;
    this.iframe = document.createElement('iframe');
    this.iframe.setAttribute('data-fake-youtube', options.videoId ?? '');
    this.iframe.title = 'YouTube video player';
    element.replaceWith(this.iframe);
  }

  getPlayerState(): number {
    return this.state;
  }

  private get target(): YT.Player {
    return this as unknown as YT.Player;
  }

  ready(): void {
    act(() => {
      this.options.events?.onReady?.({ target: this.target });
    });
  }

  setState(state: number): void {
    this.state = state;
    act(() => {
      this.options.events?.onStateChange?.({ target: this.target, data: state as YT.PlayerState });
    });
  }

  fail(code: number): void {
    act(() => {
      this.options.events?.onError?.({ target: this.target, data: code as YT.PlayerError });
    });
  }

  blockAutoplay(): void {
    act(() => {
      this.options.events?.onAutoplayBlocked?.({ target: this.target });
    });
  }
}

export interface YouTubeMock {
  players: FakePlayer[];
  /** El último reproductor creado; falla si no hay ninguno. */
  last: () => FakePlayer;
}

/** Instala un `window.YT` falso. Se retira con `vi.unstubAllGlobals()`. */
export const installYouTubeMock = (): YouTubeMock => {
  const players: FakePlayer[] = [];
  class Player extends FakePlayer {
    constructor(element: HTMLElement, options: YT.PlayerOptions) {
      super(element, options);
      players.push(this);
    }
  }
  vi.stubGlobal('YT', {
    Player,
    PlayerState: { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 },
  });
  resetYouTubeIframeApi();
  return {
    players,
    last: () => {
      const player = players[players.length - 1];
      if (!player) throw new Error('No se creó ningún YT.Player');
      return player;
    },
  };
};
