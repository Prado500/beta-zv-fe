import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Hero } from '../src/modules/promo/components/sections/Hero';
import { Origin } from '../src/modules/promo/components/sections/Origin';
import { LivePreview } from '../src/modules/promo/components/sections/LivePreview';
import { SocialProof } from '../src/modules/promo/components/sections/SocialProof';
import { Features } from '../src/modules/promo/components/sections/Features';
import { Pricing } from '../src/modules/promo/components/sections/Pricing';
import { DEFAULT_VIDEO_ID, DEMO_SONG } from '../src/config/videos';
import { renderAt, setupUser } from './testUtils';

/**
 * Los vídeos de la landing: todos con un ID real y ninguno cargado antes de
 * que alguien lo toque. Antes había seis `TU_VIDEO_ID_*` y cinco reproductores
 * de YouTube montándose con la página.
 */

const renderLanding = () =>
  renderAt(
    <>
      <Hero />
      <Origin />
      <LivePreview />
      <SocialProof />
      <Features />
      <Pricing onBuy={() => undefined} />
    </>,
  );

// jsdom no trae IntersectionObserver y el contador de cupos lo usa al montarse.
beforeEach(() =>
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  ),
);

afterEach(() => vi.unstubAllGlobals());

describe('vídeos de la landing', () => {
  it('no monta ningún iframe de YouTube al cargar', () => {
    renderLanding();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('no queda ningún ID de relleno y cada fachada apunta al vídeo configurado', () => {
    renderLanding();
    expect(document.body.innerHTML).not.toContain('TU_VIDEO_ID');

    const facades = screen.getAllByRole('button', { name: /^Reproducir: / });
    // 6 vídeos, 3 reacciones y la canción de la demo.
    expect(facades).toHaveLength(10);

    const posters = Array.from(document.querySelectorAll<HTMLImageElement>('img[src*="i.ytimg.com"]'));
    expect(posters.length).toBeGreaterThanOrEqual(9);
    posters.forEach((poster) => expect(poster.getAttribute('src')).toContain(`/vi/${DEFAULT_VIDEO_ID}/`));
  });

  it('tocar el vídeo del hero monta exactamente un iframe, con autoplay, origin y Referer', async () => {
    const user = setupUser();
    renderLanding();

    await user.click(screen.getByRole('button', { name: 'Reproducir: Video 1 Hook' }));

    const frames = document.querySelectorAll('iframe');
    expect(frames).toHaveLength(1);
    expect(frames[0].getAttribute('src')).toBe(
      `https://www.youtube.com/embed/${DEFAULT_VIDEO_ID}?autoplay=1&playsinline=1&rel=0&origin=${encodeURIComponent(window.location.origin)}`,
    );
    expect(frames[0].getAttribute('allow')).toContain('autoplay');
    expect(frames[0].getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin');
  });

  it('la demo trae la canción puesta y se puede escuchar desde el teléfono', async () => {
    const user = setupUser();
    renderLanding();

    expect((screen.getByLabelText('Canción de Fondo (YouTube)') as HTMLInputElement).value).toBe(
      `${DEMO_SONG.title} - ${DEMO_SONG.artist}`,
    );
    const song = screen.getByRole('button', { name: `Reproducir: ${DEMO_SONG.title} · ${DEMO_SONG.artist}` });
    expect(song.closest('.aspect-square')?.className).toContain('min-h-[200px]');

    await user.click(song);
    expect(document.querySelector('iframe')?.getAttribute('title')).toBe(
      `${DEMO_SONG.title} · ${DEMO_SONG.artist}`,
    );
  });

  it('cada reacción abre su propio vídeo y no el de las demás', async () => {
    const user = setupUser();
    renderLanding();

    await user.click(screen.getByRole('button', { name: 'Reproducir: Reacción de Andrea V.' }));

    expect(document.querySelectorAll('iframe')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Reproducir: Reacción de Sofía G.' })).toBeTruthy();
  });
});
