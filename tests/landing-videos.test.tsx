import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Hero } from '../src/modules/promo/components/sections/Hero';
import { Origin } from '../src/modules/promo/components/sections/Origin';
import { LivePreview } from '../src/modules/promo/components/sections/LivePreview';
import { SocialProof } from '../src/modules/promo/components/sections/SocialProof';
import { Features } from '../src/modules/promo/components/sections/Features';
import { Pricing } from '../src/modules/promo/components/sections/Pricing';
import { DEFAULT_VIDEO_ID, DEMO_SONG, LANDING_VIDEOS, REACTION_VIDEOS } from '../src/config/videos';
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

    const configurados = new Set<string>([
      ...Object.values(LANDING_VIDEOS),
      ...Object.values(REACTION_VIDEOS),
      DEMO_SONG.videoId,
    ]);
    const posters = Array.from(document.querySelectorAll<HTMLImageElement>('img[src*="i.ytimg.com"]'));
    expect(posters.length).toBeGreaterThanOrEqual(9);
    posters.forEach((poster) => {
      const id = poster.getAttribute('src')?.match(/\/vi\/([^/]+)\//)?.[1];
      expect(configurados).toContain(id);
    });
  });

  /*
   * El guardián de los pendientes.
   *
   * `DEFAULT_VIDEO_ID` es el vídeo de respaldo que se puso mientras llegaban
   * los definitivos. Ya llegaron todos, así que la lista tiene que estar
   * vacía: esta prueba sigue aquí para que nadie publique otro hueco por
   * descuido. La constante no desaparece —es la canción de la demo, vía
   * `DEMO_SONG`—, pero ninguna sección ni reacción debe apuntar ya a ella.
   */
  it('ningún vídeo de la landing sigue con el de respaldo', () => {
    // Anotado a `string` a propósito: con `as const` los IDs son tipos literales y
    // ninguno es ya el de respaldo, así que TypeScript tumbaría la comparación con
    // TS2367. La comprobación es de ejecución, para el día que alguien lo reponga.
    const respaldo: string = DEFAULT_VIDEO_ID;
    const conRespaldo = [
      ...Object.entries(LANDING_VIDEOS),
      ...Object.entries(REACTION_VIDEOS),
    ].filter(([, id]) => id === respaldo);

    expect(conRespaldo.map(([nombre]) => nombre)).toEqual([]);
  });

  it('tocar el vídeo del hero monta exactamente un iframe, con autoplay, origin y Referer', async () => {
    const user = setupUser();
    renderLanding();

    await user.click(screen.getByRole('button', { name: 'Reproducir: Video 1 Hook' }));

    const frames = document.querySelectorAll('iframe');
    expect(frames).toHaveLength(1);
    expect(frames[0].getAttribute('src')).toBe(
      `https://www.youtube.com/embed/${LANDING_VIDEOS.hook}?autoplay=1&playsinline=1&rel=0&origin=${encodeURIComponent(window.location.origin)}`,
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
