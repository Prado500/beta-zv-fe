import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { PhonePreview } from '../src/modules/editor/components/PhonePreview';
import { SCENE_MS } from '../src/modules/editor/hooks/useCardChoreography';
import type { DedicationForm } from '../src/modules/editor/types';
import { installYouTubeMock, type YouTubeMock } from './youtubeMock';

/**
 * El muro de interacción: tocar el sobre, ver la coreografía y que la canción
 * arranque sola cuando la hoja ya se ve. Y el chip flotante cuando el
 * reproductor queda arriba, fuera de la vista.
 *
 * Los toques van con `fireEvent`: con el reloj congelado, `userEvent` espera
 * temporizadores que nunca avanzan.
 */

const FORM: DedicationForm = {
  title: 'Feliz Aniversario',
  recipient: 'Ana María',
  recipientEmail: '',
  sender: 'Sebastián',
  message: 'Gracias por cada día a tu lado, mi amor.',
  songUrl: 'https://youtu.be/dQw4w9WgXcQ',
  themeId: 'classic',
  photos: [],
};

/** Sobre → apertura → floración → frase suspendida → hoja. Sin fotos no hay recuerdos. */
const TO_CARD_MS = SCENE_MS.envelope + SCENE_MS.bloom + SCENE_MS.phrase;
/** Ya en la hoja, lo que se espera antes de arrancar la canción. */
const SONG_START_MS = 400;

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let yt: YouTubeMock;
let observers: ObserverCallback[];

beforeEach(() => {
  yt = installYouTubeMock();
  observers = [];
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: ObserverCallback) {
        observers.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const tapEnvelope = () => fireEvent.click(screen.getByText('Toca para abrir'));

/**
 * En dos pasos a propósito: el efecto que programa el arranque solo existe
 * después de que React pinte la hoja, y eso ocurre al cerrar el primer `act`.
 */
const openCard = () => {
  tapEnvelope();
  act(() => vi.advanceTimersByTime(TO_CARD_MS));
  act(() => vi.advanceTimersByTime(SONG_START_MS));
};

const playerOutOfView = (outOfView: boolean) =>
  act(() =>
    observers.forEach((notify) =>
      notify([{ isIntersecting: !outOfView, intersectionRatio: outOfView ? 0 : 1 }]),
    ),
  );

const renderCard = async (data: DedicationForm = FORM) => {
  render(<PhonePreview data={data} isFullView />);
  await waitFor(() => expect(yt.players).toHaveLength(1));
  yt.last().ready();
};

describe('PhonePreview: la canción', () => {
  it('el reproductor existe desde el principio, al final de la carta, y no hay iframes ocultos', async () => {
    await renderCard();

    const section = screen.getByLabelText('Canción de la dedicatoria');
    const message = screen.getByText(/Gracias por cada día/);
    // Va DESPUÉS del texto: la carta se lee de un tirón y la canción cierra
    expect(message.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(section.querySelector('iframe')).not.toBeNull();
    expect(document.querySelector('iframe.hidden')).toBeNull();
    expect(yt.last().playVideo).not.toHaveBeenCalled();
  });

  it('tocar el sobre, esperar la coreografía y la hoja: entonces suena', async () => {
    await renderCard();
    const player = yt.last();
    vi.useFakeTimers();

    tapEnvelope();
    act(() => vi.advanceTimersByTime(TO_CARD_MS));
    expect(player.playVideo).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(SONG_START_MS - 1));
    expect(player.playVideo).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(player.playVideo).toHaveBeenCalledTimes(1);
  });

  it('cerrar la carta pausa la canción y vuelve al sobre', async () => {
    await renderCard();
    const player = yt.last();
    vi.useFakeTimers();

    openCard();
    player.setState(1);
    expect(screen.queryByText('Toca para abrir')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Cerrar/ }));
    expect(player.pauseVideo).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Toca para abrir')).toBeTruthy();
  });

  it('sin canción no hay reproductor ni se toca YouTube', async () => {
    render(<PhonePreview data={{ ...FORM, songUrl: '' }} isFullView />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(yt.players).toHaveLength(0);
    expect(screen.queryByLabelText('Canción de la dedicatoria')).toBeNull();
    expect(screen.queryByTestId('song-chip')).toBeNull();
  });

  it('el chip flotante aparece cuando el reproductor sale de la vista y controla la canción', async () => {
    await renderCard();
    const player = yt.last();
    vi.useFakeTimers();

    openCard();
    player.setState(1);

    const chip = screen.getByTestId('song-chip');
    expect(chip.getAttribute('aria-hidden')).toBe('true');

    playerOutOfView(true);
    expect(chip.getAttribute('aria-hidden')).toBe('false');

    fireEvent.click(within(chip).getByRole('button', { name: 'Pausar la canción' }));
    expect(player.pauseVideo).toHaveBeenCalledTimes(1);

    playerOutOfView(false);
    expect(chip.getAttribute('aria-hidden')).toBe('true');
  });

  it('si el navegador bloquea la reproducción, el chip lleva de vuelta al vídeo en vez de insistir', async () => {
    await renderCard();
    const player = yt.last();
    vi.useFakeTimers();
    const scrollIntoView = vi.fn();
    screen.getByLabelText('Canción de la dedicatoria').scrollIntoView = scrollIntoView;

    openCard();
    expect(player.playVideo).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(1500));
    playerOutOfView(true);

    fireEvent.click(screen.getByRole('button', { name: 'Ir a la canción' }));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(player.playVideo).toHaveBeenCalledTimes(1);
  });
});
