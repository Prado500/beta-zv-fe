import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { SCENE_MS, useCardChoreography } from '../src/modules/editor/hooks/useCardChoreography';

/**
 * La coreografía de la carta: del sobre a la hoja, con sus tiempos exactos,
 * y las dos pausas que dependen de la persona. Se prueba el ViewModel solo:
 * qué momento toca y cuándo, sin montar una sola escena.
 */

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const setup = (hasPhrase = true, hasPhotos = false) =>
  renderHook((props: { hasPhrase: boolean; hasPhotos: boolean }) => useCardChoreography(props), {
    initialProps: { hasPhrase, hasPhotos },
  });

const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('useCardChoreography', () => {
  it('camino feliz sin fotos: sobre → apertura → floración → frase → carta, cada tramo con su duración', () => {
    const { result } = setup();
    expect(result.current.view).toBe('envelope');

    act(() => result.current.open());
    expect(result.current.view).toBe('opening');

    tick(SCENE_MS.envelope - 1);
    expect(result.current.view).toBe('opening');
    tick(1);
    expect(result.current.view).toBe('blooming');

    tick(SCENE_MS.bloom);
    expect(result.current.view).toBe('phrase');

    tick(SCENE_MS.phrase - 1);
    expect(result.current.view).toBe('phrase');
    tick(1);
    expect(result.current.view).toBe('card');
  });

  it('sin mensaje no hay frase que suspender: de la floración a la carta', () => {
    const { result } = setup(false, false);

    act(() => result.current.open());
    tick(SCENE_MS.envelope + SCENE_MS.bloom);

    expect(result.current.view).toBe('card');
  });

  it('con fotos espera a que se descubran los recuerdos; después el estallido y la carta', () => {
    const { result } = setup(true, true);

    act(() => result.current.open());
    tick(SCENE_MS.envelope + SCENE_MS.bloom + SCENE_MS.phrase);
    expect(result.current.view).toBe('memories');

    // El tiempo no la saca de ahí: solo los toques de la persona.
    tick(60_000);
    expect(result.current.view).toBe('memories');

    act(() => result.current.finishMemories());
    expect(result.current.view).toBe('burst');
    tick(SCENE_MS.burst);
    expect(result.current.view).toBe('card');
  });

  it('cerrar a mitad de camino corta los temporizadores y vuelve al sobre', () => {
    const { result } = setup();

    act(() => result.current.open());
    tick(SCENE_MS.envelope);
    expect(result.current.view).toBe('blooming');

    act(() => result.current.close());
    expect(result.current.view).toBe('envelope');

    // Ningún temporizador huérfano sigue moviendo el estado.
    tick(60_000);
    expect(result.current.view).toBe('envelope');
  });

  it('un segundo toque mientras se abre no reinicia nada, y terminar recuerdos fuera de su momento se ignora', () => {
    const { result } = setup();

    act(() => result.current.open());
    tick(500);
    act(() => result.current.open());
    act(() => result.current.finishMemories());
    expect(result.current.view).toBe('opening');

    // La apertura termina cuando tocaba desde el primer toque, no desde el segundo.
    tick(SCENE_MS.envelope - 500);
    expect(result.current.view).toBe('blooming');
  });

  it('las fotos y la frase se miran cuando toca decidir, no cuando se tocó el sobre', () => {
    const { result, rerender } = setup(true, false);

    act(() => result.current.open());
    tick(SCENE_MS.envelope);
    // Quien escribe añade fotos mientras la previa está floreciendo.
    rerender({ hasPhrase: true, hasPhotos: true });

    tick(SCENE_MS.bloom + SCENE_MS.phrase);
    expect(result.current.view).toBe('memories');
  });
});
