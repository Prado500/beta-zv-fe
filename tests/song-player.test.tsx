import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useYouTubePlayer } from '../src/components/media/useYouTubePlayer';
import { SongPlayer } from '../src/modules/editor/components/SongPlayer';
import { THEME_PRESETS } from '../src/modules/editor/types';
import { resolvePalette } from '../src/utils/themePalette';
import { decorFor } from '../src/utils/themeDecor';
import { installYouTubeMock, type YouTubeMock } from './youtubeMock';
import { setupUser } from './testUtils';

/**
 * El reproductor visible sobre la IFrame API. Se afirma lo que ve quien lee la
 * carta —"Sonando", "En pausa", el aviso cuando el navegador bloquea, el
 * enlace de escape cuando YouTube falla— y las órdenes que llegan a la API.
 */

const PALETTE = resolvePalette(THEME_PRESETS.classic);
const DECOR = decorFor('classic');
const ID = '2Vv-BfVoq4g';

/** Junta hook y vista como lo hace la carta; expone `play`/`pause` directos. */
const Harness = ({ videoId }: { videoId: string | null }) => {
  const song = useYouTubePlayer(videoId);
  return (
    <div>
      {videoId && (
        <SongPlayer
          videoId={videoId}
          hostRef={song.hostRef}
          status={song.status}
          errorCode={song.errorCode}
          onToggle={song.toggle}
          palette={PALETTE}
          decor={DECOR}
        />
      )}
      <button type="button" onClick={song.play}>
        play-now
      </button>
      <button type="button" onClick={song.pause}>
        pause-now
      </button>
    </div>
  );
};

const status = () => screen.getByLabelText('Canción de la dedicatoria').querySelector('[aria-live]')?.textContent;

let yt: YouTubeMock;

beforeEach(() => {
  yt = installYouTubeMock();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const renderReady = async (videoId = ID) => {
  const view = render(<Harness videoId={videoId} />);
  await waitFor(() => expect(yt.players).toHaveLength(1));
  yt.last().ready();
  return view;
};

describe('SongPlayer + useYouTubePlayer', () => {
  it('crea el reproductor sin cookies, inline y sin autoplay; reproduce y pausa desde su botón', async () => {
    const user = setupUser();
    await renderReady();
    const player = yt.last();

    expect(player.options.host).toBe('https://www.youtube-nocookie.com');
    expect(player.options.videoId).toBe(ID);
    expect(player.options.playerVars).toMatchObject({ playsinline: 1, autoplay: 0, rel: 0 });
    expect(player.options.playerVars?.origin).toBe(window.location.origin);
    expect(status()).toBe('Lista para sonar');

    await user.click(screen.getByRole('button', { name: 'Reproducir la canción' }));
    expect(player.playVideo).toHaveBeenCalledTimes(1);

    player.setState(1);
    expect(status()).toBe('Sonando');

    await user.click(screen.getByRole('button', { name: 'Pausar la canción' }));
    expect(player.pauseVideo).toHaveBeenCalledTimes(1);
    player.setState(2);
    expect(status()).toBe('En pausa');
  });

  it('el iframe vive dentro del bloque visible y no está oculto', async () => {
    await renderReady();
    const host = screen.getByTestId('song-player-host');
    const frame = host.querySelector('iframe');
    expect(frame).not.toBeNull();
    expect(frame?.className).not.toContain('hidden');
    expect(host.className).toContain('min-h-[200px]');
  });

  it('una orden de reproducir antes de estar listo se cumple en cuanto lo está', async () => {
    const user = setupUser();
    render(<Harness videoId={ID} />);
    await waitFor(() => expect(yt.players).toHaveLength(1));
    const player = yt.last();

    await user.click(screen.getByText('play-now'));
    expect(player.playVideo).not.toHaveBeenCalled();

    player.ready();
    expect(player.playVideo).toHaveBeenCalledTimes(1);
  });

  it('si el vídeo no arranca en 1,5 s, avisa de que hay que tocar el vídeo', async () => {
    await renderReady();
    const player = yt.last();
    vi.useFakeTimers();

    act(() => screen.getByText('play-now').click());
    expect(player.playVideo).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(1499));
    expect(status()).toBe('Lista para sonar');

    act(() => vi.advanceTimersByTime(1));
    expect(status()).toBe('Toca ▶ en el vídeo para escucharla');
  });

  it('el evento onAutoplayBlocked de YouTube produce el mismo aviso', async () => {
    await renderReady();
    yt.last().blockAutoplay();
    expect(status()).toBe('Toca ▶ en el vídeo para escucharla');
  });

  it('un error 150 se explica y deja un enlace a YouTube; el botón propio se apaga', async () => {
    await renderReady();
    yt.last().fail(150);

    expect(status()).toBe('No se puede reproducir aquí');
    expect(screen.getByText(/no permite reproducirlo fuera de YouTube/)).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Escuchar en YouTube' });
    expect(link.getAttribute('href')).toBe(`https://www.youtube.com/watch?v=${ID}`);
    expect(link.getAttribute('target')).toBe('_blank');
    expect((screen.getByRole('button', { name: 'Reproducir la canción' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('cambiar de canción encola el nuevo vídeo en el mismo reproductor; desmontar lo destruye', async () => {
    const view = await renderReady();
    const player = yt.last();

    view.rerender(<Harness videoId="dQw4w9WgXcQ" />);
    await waitFor(() => expect(player.cueVideoById).toHaveBeenCalledWith('dQw4w9WgXcQ'));
    expect(yt.players).toHaveLength(1);

    view.unmount();
    expect(player.destroy).toHaveBeenCalledTimes(1);
  });

  it('sin enlace no se crea ningún reproductor', async () => {
    render(<Harness videoId={null} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(yt.players).toHaveLength(0);
    expect(screen.queryByLabelText('Canción de la dedicatoria')).toBeNull();
  });
});
