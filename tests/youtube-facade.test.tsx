import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { YouTubeFacade } from '../src/components/media/YouTubeFacade';
import { setupUser } from './testUtils';

/**
 * La fachada: nada de YouTube hasta que alguien lo pide. Lo que se afirma es
 * lo que ve y hace una persona: una portada, un botón, y tras tocarlo el
 * reproductor.
 */

const ID = '2Vv-BfVoq4g';

const iframe = () => document.querySelector('iframe');

describe('YouTubeFacade', () => {
  it('pinta la portada y el botón, sin ningún iframe', () => {
    render(<YouTubeFacade videoId={ID} title="Demostración" />);

    expect(iframe()).toBeNull();
    expect(screen.getByRole('button', { name: 'Reproducir: Demostración' })).toBeTruthy();
    expect(document.querySelector('img')?.getAttribute('src')).toBe(
      `https://i.ytimg.com/vi/${ID}/maxresdefault.jpg`,
    );
  });

  it('al tocar monta el iframe con autoplay, inline y sin cookies; el botón desaparece', async () => {
    const user = setupUser();
    render(<YouTubeFacade videoId={ID} title="Demostración" />);

    await user.click(screen.getByRole('button', { name: 'Reproducir: Demostración' }));

    const frame = iframe();
    expect(frame?.getAttribute('src')).toBe(
      `https://www.youtube-nocookie.com/embed/${ID}?autoplay=1&playsinline=1&rel=0`,
    );
    expect(frame?.getAttribute('title')).toBe('Demostración');
    expect(frame?.getAttribute('allow')).toContain('autoplay');
    expect(frame?.className).not.toContain('hidden');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('si el vídeo no tiene miniatura en máxima resolución, cae a la estándar', () => {
    render(<YouTubeFacade videoId={ID} title="Demostración" />);
    const poster = document.querySelector('img') as HTMLImageElement;

    fireEvent.error(poster);

    expect(poster.getAttribute('src')).toBe(`https://i.ytimg.com/vi/${ID}/hqdefault.jpg`);
  });

  it('reconoce el relleno gris de 120x90 con que YouTube responde al 404 y cae a la estándar', () => {
    render(<YouTubeFacade videoId={ID} title="Demostración" />);
    const poster = document.querySelector('img') as HTMLImageElement;
    Object.defineProperty(poster, 'naturalWidth', { value: 120, configurable: true });

    fireEvent.load(poster);

    expect(poster.getAttribute('src')).toBe(`https://i.ytimg.com/vi/${ID}/hqdefault.jpg`);
  });

  it('una miniatura real en máxima resolución se queda', () => {
    render(<YouTubeFacade videoId={ID} title="Demostración" />);
    const poster = document.querySelector('img') as HTMLImageElement;
    Object.defineProperty(poster, 'naturalWidth', { value: 1280, configurable: true });

    fireEvent.load(poster);

    expect(poster.getAttribute('src')).toBe(`https://i.ytimg.com/vi/${ID}/maxresdefault.jpg`);
  });

  it('una portada propia se respeta y no se sustituye aunque falle', () => {
    render(<YouTubeFacade videoId={ID} title="Hook" poster="https://cdn.test/portada.jpg" />);
    const poster = document.querySelector('img') as HTMLImageElement;

    fireEvent.error(poster);

    expect(poster.getAttribute('src')).toBe('https://cdn.test/portada.jpg');
  });

  it('se puede activar con el teclado', async () => {
    const user = setupUser();
    render(<YouTubeFacade videoId={ID} title="Demostración" />);

    await user.tab();
    await user.keyboard('{Enter}');

    expect(iframe()).not.toBeNull();
  });

  it('el rótulo que se le pasa va sobre la portada y no recibe clics', () => {
    render(
      <YouTubeFacade videoId={ID} title="Hook">
        <span>Toca para ver</span>
      </YouTubeFacade>,
    );
    const label = screen.getByText('Toca para ver');
    expect(label.closest('button')).not.toBeNull();
    expect(label.parentElement?.className).toContain('pointer-events-none');
  });
});
