import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { createLetter } from '../src/modules/editor/services/letters';
import { NAME_ERROR } from '../src/utils/validation';
import { fillStepOne, goToStepThree, goToStepTwo, renderEditor, submitButton } from './editorHarness';
import { setupUser } from './testUtils';

/**
 * Navegación del asistente: la confirmación del correo solo puede abrirse en el
 * último paso.
 *
 * "Siguiente" es un botón normal, pero el navegador también envía un formulario
 * por su cuenta al pulsar Intro en un campo (envío implícito). Aquí ese `submit`
 * se dispara a mano —que es lo que el navegador hace en el paso 2, con un solo
 * campo de texto y ningún botón de envío— y se comprueba que la app lo trata
 * como "Siguiente" y no como "enviar".
 */

vi.mock('../src/modules/editor/components/PhonePreview', () => ({
  PhonePreview: () => null,
}));

vi.mock('../src/modules/editor/services/letters', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/editor/services/letters')>()),
  createLetter: vi.fn(),
  uploadEagerPhoto: vi.fn(),
}));

const nextButton = () => screen.getByRole('button', { name: /Siguiente/i });
const stepBadge = (step: number) => screen.getByText(`Paso ${step} de 3`);

/** El único `<form>` de la pantalla; un `submit` directo es el envío implícito del navegador. */
const editorForm = () => {
  const form = document.querySelector('form');
  if (!form) throw new Error('El editor no tiene formulario');
  return form;
};

describe('EditorPage · asistente por pasos', () => {
  it('"Siguiente" avanza de paso en paso sin abrir la confirmación', async () => {
    const user = setupUser();
    renderEditor();
    await fillStepOne(user);

    await user.click(nextButton());
    expect(stepBadge(2)).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();

    await user.click(nextButton());
    expect(stepBadge(3)).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(submitButton()).toBeTruthy();
    expect(createLetter).not.toHaveBeenCalled();
  });

  it('al pasar al 3, el botón "Siguiente" se destruye en vez de volverse el de envío', async () => {
    const user = setupUser();
    renderEditor();
    await fillStepOne(user);
    await goToStepTwo(user);

    // Identidad del nodo, no apariencia. Si React reutilizara el mismo <button>
    // y solo le cambiara el `type` a "submit", en un navegador real la activación
    // del clic —que se resuelve después del despacho del evento— encontraría un
    // botón de envío y mandaría el formulario: el paso avanzaría y la
    // confirmación del correo se abriría con él. jsdom no reproduce ese orden,
    // así que aquí se comprueba la causa y no el síntoma.
    const clicked = nextButton();
    await user.click(clicked);

    expect(stepBadge(3)).toBeTruthy();
    expect(document.body.contains(clicked)).toBe(false);
    expect(submitButton()).not.toBe(clicked);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(createLetter).not.toHaveBeenCalled();
  });

  it('con un nombre inválido avanza igual, deja el campo marcado y no abre nada', async () => {
    const user = setupUser();
    renderEditor();
    await fillStepOne(user, { recipient: 'Ana123' });

    await user.click(nextButton());
    expect(stepBadge(2)).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();

    // Al volver, el error revelado sigue ahí para corregirlo.
    await user.click(screen.getByRole('button', { name: /Atrás/i }));
    const field = screen.getByLabelText('Para quién es');
    await waitFor(() => expect(field.getAttribute('aria-invalid')).toBe('true'));
    expect(screen.getByText(NAME_ERROR)).toBeTruthy();
  });

  it('un submit del formulario en el paso 1 avanza al 2 en vez de enviar', async () => {
    const user = setupUser();
    renderEditor();
    await fillStepOne(user);

    fireEvent.submit(editorForm());

    await waitFor(() => expect(stepBadge(2)).toBeTruthy());
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(createLetter).not.toHaveBeenCalled();
  });

  it('Intro en el campo de la canción (paso 2) avanza al 3 sin abrir la confirmación', async () => {
    const user = setupUser();
    renderEditor();
    await fillStepOne(user);
    await goToStepTwo(user);
    await user.type(screen.getByLabelText(/Enlace de Canción/i), 'https://youtu.be/dQw4w9WgXcQ');

    // Un solo campo de texto y ningún botón de envío: el navegador envía solo.
    fireEvent.submit(editorForm());

    await waitFor(() => expect(stepBadge(3)).toBeTruthy());
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(createLetter).not.toHaveBeenCalled();
  });

  it('solo en el paso 3 el submit abre la confirmación del correo', async () => {
    const user = setupUser();
    renderEditor();
    await fillStepOne(user);
    await goToStepThree(user);

    fireEvent.submit(editorForm());

    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('Verifica que este correo sea correcto');
    expect(createLetter).not.toHaveBeenCalled();
  });
});
