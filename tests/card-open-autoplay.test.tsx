import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PhonePreview } from '../src/modules/editor/components/PhonePreview';
import type { DedicationForm } from '../src/modules/editor/types';
import { installYouTubeMock, type YouTubeMock } from './youtubeMock';
import { setupUser } from './testUtils';

/**
 * La canción tiene que arrancar dentro del gesto que abre el sobre.
 *
 * No es una preferencia de producto, es la única forma de que suene en un
 * móvil: los navegadores solo dejan reproducir con sonido lo que se pide
 * durante una interacción del usuario, y de forma síncrona. La orden salía de
 * un efecto que corría al llegar a la hoja —varios segundos y cinco escenas
 * después—, cuando la activación ya había caducado: en escritorio sonaba y en
 * el móvil la carta se abría muda.
 *
 * Por eso lo que se fija aquí es el MOMENTO, no el resultado: `playVideo` debe
 * haberse llamado con el toque, sin haber dejado avanzar la coreografía.
 */

const VIDEO_ID = 'dQw4w9WgXcQ';

const LETTER: DedicationForm = {
  title: 'Feliz Aniversario',
  recipient: 'Ana María',
  recipientEmail: 'sebas@ejemplo.com',
  sender: 'Sebastián',
  message: 'Gracias por cada día a tu lado.',
  songUrl: `https://youtu.be/${VIDEO_ID}`,
  themeId: 'classic',
  photos: [],
};

let youtube: YouTubeMock;

beforeEach(() => {
  youtube = installYouTubeMock();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Monta la carta y espera a que el reproductor exista y se declare listo. */
const openableCard = async (data: DedicationForm = LETTER) => {
  render(<PhonePreview data={data} isFullView />);
  await waitFor(() => expect(youtube.players.length).toBe(1));
  youtube.last().ready();
  return youtube.last();
};

describe('la canción al abrir la carta', () => {
  it('arranca con el toque en el sobre, sin esperar a que aparezca la hoja', async () => {
    const user = setupUser();
    const player = await openableCard();

    expect(player.playVideo).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Abrir la carta' }));

    // Sin adelantar un solo temporizador: la orden sale del propio gesto
    expect(player.playVideo).toHaveBeenCalled();
  });

  it('una carta sin canción se abre igual, sin reproductor que arrancar', async () => {
    const user = setupUser();
    render(<PhonePreview data={{ ...LETTER, songUrl: '' }} isFullView />);

    await user.click(screen.getByRole('button', { name: 'Abrir la carta' }));

    expect(youtube.players).toHaveLength(0);
  });

  it('si el navegador rechaza la reproducción, la carta sigue en pie', async () => {
    const user = setupUser();
    const player = await openableCard();

    await user.click(screen.getByRole('button', { name: 'Abrir la carta' }));
    expect(player.playVideo).toHaveBeenCalled();

    // El rechazo llega por evento, no por excepción: no puede tumbar la carta
    player.blockAutoplay();

    expect(screen.getAllByText('Feliz Aniversario').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Abrir la carta' })).toBeTruthy();
  });
});
