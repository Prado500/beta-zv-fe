import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ApiError } from '../src/utils/api';
import { createLetter } from '../src/modules/editor/services/letters';
import {
  PURCHASE_ID,
  VALID_LETTER,
  confirmButton,
  fillStepOne,
  goToStepThree,
  renderEditor,
  submitButton,
} from './editorHarness';
import { setupUser } from './testUtils';

/**
 * Doble confirmación del correo y desenlace según el código de estado.
 *
 * El correo con el QR, el enlace y el archivo sale una sola vez. Por eso pulsar
 * "Guardar y compartir" no envía nada: abre una confirmación y **para ahí**. Lo
 * que estas pruebas vigilan es justamente ese freno.
 */

vi.mock('../src/modules/editor/components/PhonePreview', () => ({
  PhonePreview: () => null,
}));

vi.mock('../src/modules/editor/services/letters', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/editor/services/letters')>()),
  createLetter: vi.fn(),
  uploadEagerPhoto: vi.fn(),
}));

const QUEUED = { mode: 'queued', message: 'Tu carta entró en la cola.' } as const;

const READY = {
  mode: 'ready',
  publicUrl: 'https://dedicatorias.test/carta/ana-maria',
  qrUrl: 'https://dedicatorias.test/qr/ana-maria.png',
  message: '',
} as const;

/** Deja el editor listo para enviar: todo relleno y en el paso 3. */
const arrive = async (user: ReturnType<typeof setupUser>) => {
  renderEditor();
  await fillStepOne(user);
  await goToStepThree(user);
};

describe('EditorPage · confirmación del correo', () => {
  it('pulsar "Guardar y compartir" abre la confirmación y NO llama a la API', async () => {
    const user = setupUser();
    vi.mocked(createLetter).mockResolvedValue(QUEUED);

    await arrive(user);
    await user.click(submitButton());

    const dialog = await screen.findByRole('dialog');
    // El texto es el contrato con el usuario: dice qué llega y a dónde.
    expect(dialog.textContent).toContain('¿Estás seguro que este es el correo correcto?');
    expect(dialog.textContent).toContain(VALID_LETTER.email);
    expect(dialog.textContent).toContain(
      'llegará el código QR, el enlace y el archivo descargable',
    );
    expect(dialog.textContent).toContain('Revisa que no haya errores de tipeo');

    // Lo importante: la petición sigue sin salir.
    expect(createLetter).not.toHaveBeenCalled();
  });

  it('la carta solo se envía al confirmar el modal', async () => {
    const user = setupUser();
    vi.mocked(createLetter).mockResolvedValue(QUEUED);

    await arrive(user);
    await user.click(submitButton());
    await screen.findByRole('dialog');
    expect(createLetter).not.toHaveBeenCalled();

    await user.click(confirmButton());

    await waitFor(() => expect(createLetter).toHaveBeenCalledTimes(1));
    expect(createLetter).toHaveBeenCalledWith(
      PURCHASE_ID,
      expect.objectContaining({
        recipientEmail: VALID_LETTER.email,
        recipient: VALID_LETTER.recipient,
        title: VALID_LETTER.title,
      }),
    );
  });

  it('cancelar cierra la confirmación sin enviar nada', async () => {
    const user = setupUser();
    vi.mocked(createLetter).mockResolvedValue(QUEUED);

    await arrive(user);
    await user.click(submitButton());
    await screen.findByRole('dialog');

    await user.click(screen.getByRole('button', { name: /No, quiero revisarlo/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(createLetter).not.toHaveBeenCalled();
  });

  it('corregir el correo dentro del modal manda el corregido, no el original', async () => {
    const user = setupUser();
    vi.mocked(createLetter).mockResolvedValue(QUEUED);

    await arrive(user);
    await user.click(submitButton());
    await screen.findByRole('dialog');

    const field = screen.getByLabelText(/Corrígelo aquí si hace falta/i);
    await user.clear(field);
    await user.type(field, 'correcto@ejemplo.com');
    await user.click(confirmButton());

    await waitFor(() =>
      expect(createLetter).toHaveBeenCalledWith(
        PURCHASE_ID,
        expect.objectContaining({ recipientEmail: 'correcto@ejemplo.com' }),
      ),
    );
  });

  it('un 202 muestra el acuse de encolado, sin prometer ningún enlace', async () => {
    const user = setupUser();
    vi.mocked(createLetter).mockResolvedValue(QUEUED);

    await arrive(user);
    await user.click(submitButton());
    await screen.findByRole('dialog');
    await user.click(confirmButton());

    const dialog = await screen.findByRole('dialog', { name: /procesando/i });
    expect(dialog.textContent).toContain('procesando');
    expect(dialog.textContent).toContain(VALID_LETTER.email);
    // En modo asíncrono la carta aún no existe: no puede haber enlace público.
    expect(dialog.querySelector('a[href*="/carta/"]')).toBeNull();
  });

  it('un 201 muestra el enlace y el QR al instante', async () => {
    const user = setupUser();
    vi.mocked(createLetter).mockResolvedValue(READY);

    await arrive(user);
    await user.click(submitButton());
    await screen.findByRole('dialog');
    await user.click(confirmButton());

    const dialog = await screen.findByRole('dialog', { name: /lista/i });
    expect(dialog.querySelector(`a[href="${READY.publicUrl}"]`)).not.toBeNull();
    expect(dialog.querySelector<HTMLImageElement>('img[alt="Código QR de la carta"]')?.src).toBe(
      READY.qrUrl,
    );
  });

  it('si el backend responde 409 el aviso se ve en el modal y este sigue abierto', async () => {
    const user = setupUser();
    vi.mocked(createLetter).mockRejectedValue(
      new ApiError(409, 'LETTER_ALREADY_EXISTS', 'Ya existe.'),
    );

    await arrive(user);
    await user.click(submitButton());
    await screen.findByRole('dialog');
    await user.click(confirmButton());

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Esta compra ya tiene su carta');
    expect(alert.className).toContain('text-error');
    // Sigue abierto: el usuario puede corregir el correo y reintentar.
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(confirmButton().disabled).toBe(false);
  });

  it('con el formulario incompleto no se abre la confirmación', async () => {
    const user = setupUser();
    renderEditor();

    await fillStepOne(user, { recipient: 'Ana123' });
    await goToStepThree(user);
    await user.click(submitButton());

    await waitFor(() => expect(createLetter).not.toHaveBeenCalled());
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
