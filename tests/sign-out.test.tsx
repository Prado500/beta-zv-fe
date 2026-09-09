import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ApiError } from '../src/utils/api';
import { listDedications } from '../src/modules/dedications/services/dedications';
import { logout } from '../src/modules/auth/services/auth';
import { PUBLISHED, cards, gate, renderPanel } from './dedicationsHarness';
import { asButton, deferred, setupUser } from './testUtils';

/**
 * Cerrar sesión desde el panel.
 *
 * Existe por los dispositivos compartidos: al salir, las cartas tienen que
 * desaparecer de la pantalla y la puerta tiene que volver, sin gastar una
 * petición para comprobar lo que ya se sabe.
 */

vi.mock('../src/modules/dedications/services/dedications', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/dedications/services/dedications')>()),
  listDedications: vi.fn(),
  resendDelivery: vi.fn(),
}));

vi.mock('../src/modules/auth/services/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/auth/services/auth')>()),
  login: vi.fn(),
  logout: vi.fn(),
}));

const signOutButton = () =>
  asButton(screen.getByRole('button', { name: /Cerrar sesión|Saliendo/ }));

/** Panel con sesión y una carta a la vista. */
const arriveSignedIn = async () => {
  vi.mocked(listDedications).mockResolvedValue([PUBLISHED]);
  renderPanel();
  await screen.findAllByRole('article');
};

beforeEach(() => {
  vi.mocked(listDedications).mockReset();
  vi.mocked(logout).mockReset();
});

describe('Cerrar sesión', () => {
  it('llama al servicio, vacía el panel y vuelve a mostrar la puerta', async () => {
    const user = setupUser();
    vi.mocked(logout).mockResolvedValue({ message: 'Sesión cerrada.' });
    await arriveSignedIn();

    await user.click(signOutButton());

    await waitFor(() => expect(gate()).not.toBeNull());
    expect(logout).toHaveBeenCalledTimes(1);
    expect(cards()).toHaveLength(0);
    // Sin sesión no hay nada que cerrar: el botón se va con las tarjetas.
    expect(screen.queryByRole('button', { name: /Cerrar sesión/ })).toBeNull();
    // Y no se gasta una petición para comprobar lo que ya se sabe.
    expect(listDedications).toHaveBeenCalledTimes(1);
  });

  it('si la sesión ya había caducado (401), el resultado es el mismo: fuera', async () => {
    const user = setupUser();
    vi.mocked(logout).mockRejectedValue(new ApiError(401, 'UNAUTHENTICATED', 'Sin sesión.'));
    await arriveSignedIn();

    await user.click(signOutButton());

    await waitFor(() => expect(gate()).not.toBeNull());
    expect(cards()).toHaveLength(0);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('si el servidor falla, lo dice y las cartas siguen ahí: la sesión no se cerró', async () => {
    const user = setupUser();
    vi.mocked(logout).mockRejectedValue(new ApiError(503, 'SERVICE_UNAVAILABLE', 'Caído.'));
    await arriveSignedIn();

    await user.click(signOutButton());

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('no está disponible');
    expect(cards()).toHaveLength(1);
    expect(gate()).toBeNull();
    expect(signOutButton().disabled).toBe(false);
  });

  it('doble clic: un solo cierre de sesión', async () => {
    const user = setupUser();
    const pending = deferred<{ message: string }>();
    vi.mocked(logout).mockReturnValue(pending.promise);
    await arriveSignedIn();

    const button = signOutButton();
    await user.click(button);
    await waitFor(() => expect(button.disabled).toBe(true));
    expect(button.textContent).toContain('Saliendo');
    await user.click(button);

    pending.resolve({ message: 'Sesión cerrada.' });

    await waitFor(() => expect(gate()).not.toBeNull());
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
