import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ApiError } from '../src/utils/api';
import { createLetter, type LetterOutcome } from '../src/modules/editor/services/letters';
import {
  confirm,
  confirmButton,
  fillStepOne,
  goToStepThree,
  installFreezeClock,
  renderEditor,
  setupEditorUser,
  submitButton,
} from './editorHarness';
import { deferred } from './testUtils';

/**
 * Protección de los IOPS mientras la petición está en vuelo.
 *
 * El backend tiene siete operaciones contadas por compra. Un botón que sigue
 * vivo mientras se espera la respuesta es una segunda carta, un segundo correo y
 * un IOP quemado, y el usuario ni se entera de que lo hizo.
 */

vi.mock('../src/modules/editor/components/PhonePreview', () => ({
  PhonePreview: () => null,
}));

vi.mock('../src/modules/editor/services/letters', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/editor/services/letters')>()),
  createLetter: vi.fn(),
  uploadEagerPhoto: vi.fn(),
}));

const QUEUED = { mode: 'queued', message: 'En cola.' } as const;

installFreezeClock();

/** Deja el editor con la confirmación abierta y una petición congelada. */
const freeze = async (user: ReturnType<typeof setupEditorUser>) => {
  const pending = deferred<LetterOutcome>();
  vi.mocked(createLetter).mockReturnValue(pending.promise);

  renderEditor();
  await fillStepOne(user);
  await goToStepThree(user);
  await user.click(submitButton());
  await screen.findByRole('dialog');
  await confirm(user);

  return pending;
};

describe('EditorPage · botones durante la espera', () => {
  it('el botón de confirmar se bloquea mientras la API no responde', async () => {
    const user = setupEditorUser();
    const pending = await freeze(user);

    await waitFor(() => expect(confirmButton().disabled).toBe(true));
    expect(confirmButton().textContent).toContain('Enviando tu carta');

    pending.resolve(QUEUED);
  });

  it('el botón de la página también queda deshabilitado', async () => {
    const user = setupEditorUser();
    const pending = await freeze(user);

    await waitFor(() => expect(submitButton().disabled).toBe(true));
    expect(submitButton().textContent).toContain('Enviando');

    pending.resolve(QUEUED);
  });

  it('tampoco se puede cancelar a mitad de envío', async () => {
    const user = setupEditorUser();
    const pending = await freeze(user);

    const cancel = screen.getByRole('button', {
      name: /No, corregir el correo/i,
    }) as HTMLButtonElement;
    await waitFor(() => expect(cancel.disabled).toBe(true));

    pending.resolve(QUEUED);
  });

  it('doble clic sobre "Sí, es correcto": una sola carta', async () => {
    const user = setupEditorUser();
    const pending = await freeze(user);

    await waitFor(() => expect(confirmButton().disabled).toBe(true));
    await user.click(confirmButton());
    await user.click(confirmButton());

    pending.resolve(QUEUED);
    await waitFor(() => expect(screen.queryByLabelText(/Corrígelo aquí/i)).toBeNull());
    expect(createLetter).toHaveBeenCalledTimes(1);
  });

  it('al responder, la confirmación se cierra y aparece el acuse', async () => {
    const user = setupEditorUser();
    const pending = await freeze(user);

    pending.resolve(QUEUED);

    const dialog = await screen.findByRole('dialog', { name: /procesando/i });
    expect(dialog).toBeTruthy();
    expect(screen.queryByLabelText(/Corrígelo aquí/i)).toBeNull();
  });

  it('si la API falla, los botones vuelven a la vida para reintentar', async () => {
    const user = setupEditorUser();
    const pending = await freeze(user);

    await waitFor(() => expect(confirmButton().disabled).toBe(true));
    pending.reject(new ApiError(503, 'SERVICE_UNAVAILABLE', 'Cola caída.'));

    await waitFor(() => expect(confirmButton().disabled).toBe(false));
    expect(submitButton().disabled).toBe(false);
    expect((await screen.findByRole('alert')).textContent).toContain('no está disponible');
  });
});
