import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoriesScene } from '../src/modules/editor/components/scenes/MemoriesScene';
import { THEME_PRESETS } from '../src/modules/editor/types';
import { resolvePalette } from '../src/utils/themePalette';
import { decorFor } from '../src/utils/themeDecor';

/**
 * Descubrir los recuerdos es el único momento interactivo de la carta: cada
 * foto se destapa tocándola, y solo al destapar la última la escena da paso
 * a lo que sigue.
 */

const PALETTE = resolvePalette(THEME_PRESETS.classic);
const DECOR = decorFor('classic');
const PHOTOS = ['blob:mock/1', 'blob:mock/2', 'blob:mock/3'];

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const reveal = (n: number) => fireEvent.click(screen.getByRole('button', { name: `Descubrir recuerdo ${n}` }));

describe('MemoriesScene', () => {
  it('cada toque descubre una foto y lo dice', () => {
    const onDone = vi.fn();
    render(<MemoriesScene photos={PHOTOS} palette={PALETTE} decor={DECOR} onDone={onDone} />);

    expect(screen.getAllByRole('button', { name: /Descubrir recuerdo/ })).toHaveLength(3);

    reveal(2);
    expect(screen.getByRole('button', { name: 'Recuerdo 2 descubierto' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Descubrir recuerdo/ })).toHaveLength(2);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('no avanza hasta que se descubre la última, y entonces avisa una sola vez', () => {
    const onDone = vi.fn();
    render(<MemoriesScene photos={PHOTOS} palette={PALETTE} decor={DECOR} onDone={onDone} />);

    reveal(1);
    reveal(2);
    act(() => vi.advanceTimersByTime(10_000));
    expect(onDone).not.toHaveBeenCalled();

    reveal(3);
    act(() => vi.advanceTimersByTime(10_000));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('volver a tocar una foto ya descubierta no cuenta dos veces', () => {
    const onDone = vi.fn();
    render(<MemoriesScene photos={PHOTOS.slice(0, 1)} palette={PALETTE} decor={DECOR} onDone={onDone} />);

    reveal(1);
    fireEvent.click(screen.getByRole('button', { name: 'Recuerdo 1 descubierto' }));
    act(() => vi.advanceTimersByTime(10_000));

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
