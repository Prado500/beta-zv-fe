import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ApiError } from '../src/utils/api';
import {
  listDedications,
  resendDelivery,
  type DeliveryResponse,
} from '../src/modules/dedications/services/dedications';
import { PUBLISHED, gate, renderPanel } from './dedicationsHarness';
import { asButton, deferred, setupUser } from './testUtils';

/**
 * Reenviar el correo de una carta publicada.
 *
 * Pulsar "Reenviar correo" en la tarjeta no manda nada: abre una confirmación y
 * la petición solo sale al aceptarla. Y un 202 no es una promesa: el backend
 * responde antes de saber si el correo salió, así que `status: "failed"` tiene
 * que verse como un fallo aunque el HTTP sea de éxito.
 */

vi.mock('../src/modules/dedications/services/dedications', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/dedications/services/dedications')>()),
  listDedications: vi.fn(),
  resendDelivery: vi.fn(),
}));

vi.mock('../src/modules/promo/services/checkout', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/promo/services/checkout')>()),
  login: vi.fn(),
  logout: vi.fn(),
}));

/** Acuse del backend tal como lo arma `deliveries.deliver`. */
const delivery = (status: string, recipientEmail = 'sebas@ejemplo.com'): DeliveryResponse => ({
  id: 'del_1',
  recipientEmail,
  status,
  attempts: 1,
  letterVersion: 1,
  lastError: status === 'failed' ? 'SMTPException' : null,
  sentAt: status === 'sent' ? '2026-09-08T21:00:00.000Z' : null,
  createdAt: '2026-09-08T21:00:00.000Z',
});

const resendDialog = () => screen.queryByRole('dialog', { name: /Reenviar el correo/i });
const confirmButton = () =>
  asButton(screen.getByRole('button', { name: /Sí, reenviar|Enviando/ }));
const cancelButton = () => asButton(screen.getByRole('button', { name: /^Cancelar/ }));
const sameRadio = () => screen.getByLabelText(/Al mismo correo/) as HTMLInputElement;

/** Panel con una carta publicada y el modal de reenvío ya abierto. */
const openResend = async (user: ReturnType<typeof setupUser>) => {
  vi.mocked(listDedications).mockResolvedValue([PUBLISHED]);
  renderPanel();
  await user.click(await screen.findByRole('button', { name: /Reenviar correo/ }));
  return screen.findByRole('dialog', { name: /Reenviar el correo/i });
};

/** Elige "otro correo" y lo escribe. */
const chooseOther = async (user: ReturnType<typeof setupUser>, email: string) => {
  await user.click(screen.getByLabelText(/A otro correo/));
  const field = await screen.findByLabelText('Correo de destino');
  await user.type(field, email);
  return field;
};

beforeEach(() => {
  vi.mocked(listDedications).mockReset();
  vi.mocked(resendDelivery).mockReset();
});

describe('ResendModal', () => {
  it('abrir el modal no envía nada: la petición espera a la confirmación', async () => {
    const user = setupUser();
    const dialog = await openResend(user);

    expect(dialog.textContent).toContain('Para ti 💌');
    expect(dialog.textContent).toContain('No gasta otra compra');
    expect(sameRadio().checked).toBe(true);
    expect(resendDelivery).not.toHaveBeenCalled();
  });

  it('confirmar con el mismo correo manda el cuerpo vacío y enseña a dónde llegó', async () => {
    const user = setupUser();
    vi.mocked(resendDelivery).mockResolvedValue(delivery('sent'));
    await openResend(user);

    await user.click(confirmButton());

    const status = await screen.findByRole('status');
    expect(status.textContent).toContain('Volvimos a enviar');
    expect(status.textContent).toContain('sebas@ejemplo.com');
    expect(resendDelivery).toHaveBeenCalledWith(PUBLISHED.letterId, undefined);

    await user.click(screen.getByRole('button', { name: /Entendido/ }));
    expect(resendDialog()).toBeNull();
  });

  it('otro correo mal escrito: se marca en rojo mientras se escribe y no sale nada', async () => {
    const user = setupUser();
    await openResend(user);

    const field = await chooseOther(user, 'otra@');
    await waitFor(() => expect(field.getAttribute('aria-invalid')).toBe('true'));
    expect(field.className).toContain('border-error');

    await user.click(confirmButton());

    expect(resendDelivery).not.toHaveBeenCalled();
    expect(resendDialog()).not.toBeNull();
  });

  it('otro correo válido viaja como recipientEmail', async () => {
    const user = setupUser();
    vi.mocked(resendDelivery).mockResolvedValue(delivery('sent', 'otra@ejemplo.com'));
    await openResend(user);

    await chooseOther(user, 'otra@ejemplo.com');
    await user.click(confirmButton());

    const status = await screen.findByRole('status');
    expect(status.textContent).toContain('otra@ejemplo.com');
    expect(resendDelivery).toHaveBeenCalledWith(PUBLISHED.letterId, 'otra@ejemplo.com');
  });

  it('doble clic: un solo correo, y ni confirmar ni cancelar responden mientras tanto', async () => {
    const user = setupUser();
    const pending = deferred<DeliveryResponse>();
    vi.mocked(resendDelivery).mockReturnValue(pending.promise);
    await openResend(user);

    const button = confirmButton();
    await user.click(button);
    await waitFor(() => expect(button.disabled).toBe(true));
    expect(button.textContent).toContain('Enviando');
    expect(cancelButton().disabled).toBe(true);
    await user.click(button);

    pending.resolve(delivery('sent'));

    await screen.findByRole('status');
    expect(resendDelivery).toHaveBeenCalledTimes(1);
  });

  it('202 con status "failed": el correo no salió y se dice, con el botón vivo', async () => {
    const user = setupUser();
    vi.mocked(resendDelivery).mockResolvedValue(delivery('failed'));
    await openResend(user);

    await user.click(confirmButton());

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('no llegó a salir');
    expect(screen.queryByRole('status')).toBeNull();
    expect(confirmButton().disabled).toBe(false);
  });

  it('409 LETTER_NOT_PUBLISHED: mensaje propio en vez del genérico', async () => {
    const user = setupUser();
    vi.mocked(resendDelivery).mockRejectedValue(
      new ApiError(409, 'LETTER_NOT_PUBLISHED', 'Publica la carta antes de enviarla.'),
    );
    await openResend(user);

    await user.click(confirmButton());

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('todavía no está publicada');
    expect(confirmButton().disabled).toBe(false);
  });

  it('401 a mitad de camino: se cierra el modal y vuelve la puerta de sesión', async () => {
    const user = setupUser();
    vi.mocked(resendDelivery).mockRejectedValue(
      new ApiError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar.'),
    );
    await openResend(user);

    await user.click(confirmButton());

    await waitFor(() => expect(gate()).not.toBeNull());
    expect(resendDialog()).toBeNull();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });

  it('cancelar destruye el modal; reabrirlo arranca limpio', async () => {
    const user = setupUser();
    vi.mocked(resendDelivery).mockRejectedValue(new ApiError(500, 'HTTP_ERROR', 'Boom.'));
    await openResend(user);
    await chooseOther(user, 'otra@ejemplo.com');
    await user.click(confirmButton());
    await screen.findByRole('alert');

    await user.click(cancelButton());
    expect(resendDialog()).toBeNull();

    await user.click(screen.getByRole('button', { name: /Reenviar correo/ }));
    await screen.findByRole('dialog', { name: /Reenviar el correo/i });

    expect(sameRadio().checked).toBe(true);
    expect(screen.queryByLabelText('Correo de destino')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
