import { describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { ApiError } from '../src/utils/api';
import { createLetter } from '../src/modules/editor/services/letters';
import {
  PURCHASE_ID,
  VALID_LETTER,
  confirm,
  confirmButton,
  emailField,
  fillStepOne,
  goToStepThree,
  installFreezeClock,
  passFreeze,
  renderEditor,
  setupEditorUser,
  submitButton,
  typeEmail,
} from './editorHarness';

/**
 * Doble confirmación del correo, con freno, y desenlace según el código de
 * estado.
 *
 * El correo con el QR, el enlace y el archivo sale una sola vez. Por eso pulsar
 * "Guardar y compartir" no envía nada: abre una confirmación que además bloquea
 * el botón tres segundos, para que quien viene en piloto automático tenga que
 * leer su correo y el aviso de que ya no podrá editar la carta.
 */

vi.mock('../src/modules/editor/components/PhonePreview', () => ({
  PhonePreview: () => null,
}));

// jsdom no implementa canvas; lo que se comprueba es qué enlace codifica la postal.
vi.mock('qrcode.react', () => ({
  QRCodeCanvas: ({ value }: { value: string }) => (
    <canvas data-testid="qr-canvas" data-value={value} />
  ),
}));

vi.mock('../src/modules/editor/services/letters', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/editor/services/letters')>()),
  createLetter: vi.fn(),
  uploadEagerPhoto: vi.fn(),
}));

installFreezeClock();

const QUEUED = { mode: 'queued', message: 'Tu carta entró en la cola.' } as const;

const READY = {
  mode: 'ready',
  publicUrl: 'https://dedicatorias.test/carta/ana-maria',
  qrUrl: 'https://dedicatorias.test/qr/ana-maria.png',
  message: '',
} as const;

/** Deja el editor listo para enviar: todo relleno y en el paso 3. */
const arrive = async (user: ReturnType<typeof setupEditorUser>) => {
  renderEditor();
  await fillStepOne(user);
  await goToStepThree(user);
};

/** Abre la confirmación y devuelve el diálogo. */
const openConfirm = async (user: ReturnType<typeof setupEditorUser>) => {
  await arrive(user);
  await user.click(submitButton());
  return screen.findByRole('dialog');
};

const tick = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

describe('EditorPage · confirmación del correo', () => {
  it('pulsar "Guardar y compartir" abre la confirmación con el aviso de irreversibilidad y NO llama a la API', async () => {
    const user = setupEditorUser();
    vi.mocked(createLetter).mockResolvedValue(QUEUED);

    const dialog = await openConfirm(user);

    // El texto es el contrato con el usuario: dice qué llega, a dónde y qué ya no se podrá cambiar.
    expect(dialog.textContent).toContain('Es lo que vas a entregar');
    expect(dialog.textContent).toContain('archivo descargable');
    expect(dialog.textContent).toContain('código QR');
    expect(dialog.textContent).toContain('podrás editarla');
    // El correo se pide AQUÍ: el asistente ya no lo lleva, así que nace vacío.
    expect((emailField() as HTMLInputElement).value).toBe('');

    // Lo importante: la petición sigue sin salir.
    expect(createLetter).not.toHaveBeenCalled();
  });

  it('el botón de confirmar nace bloqueado y cuenta 3, 2, 1 antes de liberarse', async () => {
    const user = setupEditorUser();
    await openConfirm(user);

    expect(confirmButton().disabled).toBe(true);
    expect(confirmButton().textContent).toContain('Espera 3');

    tick(1000);
    expect(confirmButton().textContent).toContain('Espera 2');
    tick(1000);
    expect(confirmButton().textContent).toContain('Espera 1');
    tick(1000);
    expect(confirmButton().disabled).toBe(false);
    expect(confirmButton().textContent).toContain('Enviar mi carta');
  });

  it('ni el clic ni el Enter mandan la carta antes de que pase el freno', async () => {
    const user = setupEditorUser();
    vi.mocked(createLetter).mockResolvedValue(QUEUED);
    await openConfirm(user);

    await typeEmail(user);
    await user.click(confirmButton());
    await user.click(emailField());
    await user.keyboard('{Enter}');
    expect(createLetter).not.toHaveBeenCalled();

    passFreeze();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(createLetter).toHaveBeenCalledTimes(1));
  });

  it('la carta solo se envía al confirmar, con el correo del formulario', async () => {
    const user = setupEditorUser();
    vi.mocked(createLetter).mockResolvedValue(QUEUED);
    await openConfirm(user);
    expect(createLetter).not.toHaveBeenCalled();

    await confirm(user);

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

  it('cancelar cierra la confirmación sin enviar nada, y volver a abrirla reinicia el freno', async () => {
    const user = setupEditorUser();
    vi.mocked(createLetter).mockResolvedValue(QUEUED);
    await openConfirm(user);
    passFreeze();
    expect(confirmButton().disabled).toBe(false);

    await user.click(screen.getByRole('button', { name: /No, quiero revisarlo/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(createLetter).not.toHaveBeenCalled();

    // De vuelta en el editor se puede cambiar el estilo y volver a intentarlo:
    // la confirmación vuelve a nacer con su freno.
    await user.click(screen.getByRole('button', { name: /Rosado Pastel/i }));
    await user.click(submitButton());
    await screen.findByRole('dialog');
    expect(confirmButton().disabled).toBe(true);
    expect(confirmButton().textContent).toContain('Espera 3');
  });

  it('el correo que se escribe en el modal es el que viaja al backend', async () => {
    const user = setupEditorUser();
    vi.mocked(createLetter).mockResolvedValue(QUEUED);
    await openConfirm(user);

    await confirm(user, 'correcto@ejemplo.com');

    await waitFor(() =>
      expect(createLetter).toHaveBeenCalledWith(
        PURCHASE_ID,
        expect.objectContaining({ recipientEmail: 'correcto@ejemplo.com' }),
      ),
    );
  });

  it('un 202 muestra el acuse de encolado, sin prometer ningún enlace', async () => {
    const user = setupEditorUser();
    vi.mocked(createLetter).mockResolvedValue(QUEUED);
    await openConfirm(user);
    await confirm(user);

    const dialog = await screen.findByRole('dialog', { name: /procesando/i });
    expect(dialog.textContent).toContain('procesando');
    expect(dialog.textContent).toContain(VALID_LETTER.email);
    // En modo asíncrono la carta aún no existe: no puede haber enlace público.
    expect(dialog.querySelector('a[href*="/carta/"]')).toBeNull();
  });

  it('un 201 muestra el modal de éxito con el enlace, el correo, la postal y las descargas', async () => {
    const user = setupEditorUser();
    vi.mocked(createLetter).mockResolvedValue(READY);
    await openConfirm(user);
    await confirm(user);

    const dialog = await screen.findByRole('dialog', { name: /compartirla/i });
    expect(dialog.querySelector(`a[href="${READY.publicUrl}"]`)).not.toBeNull();
    expect(dialog.textContent).toContain(
      `Tu carta ha sido enviada exitosamente a: ${VALID_LETTER.email}`,
    );
    // La postal del QR se dibuja aquí mismo y codifica el mismo enlace público.
    expect(dialog.querySelector('[data-testid="qr-canvas"]')?.getAttribute('data-value')).toBe(
      READY.publicUrl,
    );
    expect(screen.getByRole('button', { name: /Carta HTML/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Postal QR/ })).toBeTruthy();
  });

  it('si el backend responde 409 el aviso se ve en el modal y este sigue abierto', async () => {
    const user = setupEditorUser();
    vi.mocked(createLetter).mockRejectedValue(
      new ApiError(409, 'LETTER_ALREADY_EXISTS', 'Ya existe.'),
    );
    await openConfirm(user);
    await confirm(user);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Esta compra ya tiene su carta');
    expect(alert.className).toContain('text-error');
    // Sigue abierto: el usuario puede corregir el correo y reintentar sin volver a esperar.
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(confirmButton().disabled).toBe(false);
  });

  it('con el formulario incompleto no se abre la confirmación', async () => {
    const user = setupEditorUser();
    renderEditor();

    await fillStepOne(user, { recipient: 'Ana123' });
    await goToStepThree(user);
    await user.click(submitButton());

    await waitFor(() => expect(createLetter).not.toHaveBeenCalled());
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
