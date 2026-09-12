import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ApiError } from '../src/utils/api';
import { listDedications } from '../src/modules/dedications/services/dedications';
import { login } from '../src/modules/auth/services/auth';
import { PUBLISHED, cards, gate, renderPanel } from './dedicationsHarness';
import { asButton, deferred, setupUser } from './testUtils';

/**
 * La puerta del panel: sin sesión se intercepta la ruta y se pide entrar.
 *
 * El servidor es el único que sabe si hay sesión (la cookie es `HttpOnly`), así
 * que aquí se simula lo que responde: 401 hasta que `login` resuelve, y el
 * listado a partir de ahí. Lo que se comprueba es lo que la persona ve y hace;
 * nada mira dentro de `useSessionGate`.
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

const NO_SESSION = new ApiError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar.');
const EMAIL = 'sebas@ejemplo.com';
const PASSWORD = 'amor24';

/** Sin sesión hasta que `login` resuelva; después, el listado responde con una fila. */
const arriveWithoutSession = () => {
  vi.mocked(listDedications).mockRejectedValue(NO_SESSION);
  vi.mocked(login).mockImplementation(async () => {
    vi.mocked(listDedications).mockResolvedValue([PUBLISHED]);
    return {} as never;
  });
};

const emailField = () => screen.getByLabelText('Tu correo');
const passwordField = () => screen.getByLabelText('Contraseña');
const enterButton = () => asButton(screen.getByRole('button', { name: /^Entrar|^Entrando/ }));

/** Monta el panel y espera a que la puerta esté en pantalla. */
const openGate = async () => {
  renderPanel();
  await screen.findByRole('dialog', { name: /Inicia sesión para ver tus/i });
};

beforeEach(() => {
  vi.mocked(listDedications).mockReset();
  vi.mocked(login).mockReset();
});

describe('SessionGate', () => {
  it('sin sesión intercepta la ruta con la puerta y, tras entrar, carga el panel', async () => {
    const user = setupUser();
    arriveWithoutSession();
    await openGate();

    expect(gate()?.textContent).toContain('dedicatorias');
    expect(cards()).toHaveLength(0);

    await user.type(emailField(), EMAIL);
    await user.type(passwordField(), PASSWORD);
    await user.click(enterButton());

    await waitFor(() => expect(cards()).toHaveLength(1));
    expect(login).toHaveBeenCalledWith(EMAIL, PASSWORD);
    // Una vez sin sesión y otra con ella: la puerta no adivina, vuelve a preguntar.
    expect(listDedications).toHaveBeenCalledTimes(2);
    expect(gate()).toBeNull();
  });

  it('correo inválido: avisa mientras se escribe y no llama a la API', async () => {
    const user = setupUser();
    arriveWithoutSession();
    await openGate();

    await user.type(emailField(), 'sebas@');
    // Fail-fast: el veredicto aparece con la tecla, sin pulsar nada.
    await waitFor(() => expect(emailField().getAttribute('aria-invalid')).toBe('true'));
    expect(emailField().className).toContain('border-error');

    await user.type(passwordField(), PASSWORD);
    await user.click(enterButton());

    expect(login).not.toHaveBeenCalled();
    expect(gate()).not.toBeNull();
  });

  it('sin contraseña: lo dice bajo el campo y no llama a la API', async () => {
    const user = setupUser();
    arriveWithoutSession();
    await openGate();

    await user.type(emailField(), EMAIL);
    await user.click(enterButton());

    expect(await screen.findByText('Escribe tu contraseña.')).toBeTruthy();
    expect(login).not.toHaveBeenCalled();
  });

  it('contraseña equivocada: alerta clara, nada de "sesión expirada", y botón vivo', async () => {
    const user = setupUser();
    arriveWithoutSession();
    vi.mocked(login).mockRejectedValue(
      new ApiError(401, 'INVALID_CREDENTIALS', 'Credenciales inválidas.'),
    );
    await openGate();

    await user.type(emailField(), EMAIL);
    await user.type(passwordField(), 'otra');
    await user.click(enterButton());

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Correo o contraseña incorrectos');
    expect(alert.textContent).not.toContain('expiró');
    expect(alert.className).toContain('text-error');
    expect(enterButton().disabled).toBe(false);
    expect(gate()).not.toBeNull();
    // Nada que listar: no se gastó una petición de más.
    expect(listDedications).toHaveBeenCalledTimes(1);
  });

  it('doble clic: un solo inicio de sesión y el botón bloqueado mientras responde', async () => {
    const user = setupUser();
    const pending = deferred<never>();
    vi.mocked(listDedications).mockRejectedValue(NO_SESSION);
    vi.mocked(login).mockReturnValue(pending.promise);
    await openGate();

    await user.type(emailField(), EMAIL);
    await user.type(passwordField(), PASSWORD);
    const button = enterButton();
    await user.click(button);
    await waitFor(() => expect(button.disabled).toBe(true));
    expect(button.textContent).toContain('Entrando');
    await user.click(button);

    vi.mocked(listDedications).mockResolvedValue([PUBLISHED]);
    pending.resolve({} as never);

    await waitFor(() => expect(cards()).toHaveLength(1));
    expect(login).toHaveBeenCalledTimes(1);
  });

  it('demasiados intentos (429): lo traduce y deja reintentar', async () => {
    const user = setupUser();
    arriveWithoutSession();
    vi.mocked(login).mockRejectedValue(new ApiError(429, 'RATE_LIMITED', 'Intenta más tarde.'));
    await openGate();

    await user.type(emailField(), EMAIL);
    await user.type(passwordField(), PASSWORD);
    await user.click(enterButton());

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Demasiados intentos');
    expect(enterButton().disabled).toBe(false);
  });

  it('Enter en la contraseña envía igual que el botón', async () => {
    const user = setupUser();
    arriveWithoutSession();
    await openGate();

    await user.type(emailField(), EMAIL);
    await user.type(passwordField(), `${PASSWORD}{Enter}`);

    await waitFor(() => expect(login).toHaveBeenCalledWith(EMAIL, PASSWORD));
    await waitFor(() => expect(cards()).toHaveLength(1));
  });

  it('ofrece volver al inicio: la cuenta se crea comprando, no aquí', async () => {
    arriveWithoutSession();
    await openGate();

    const back = screen.getByRole('link', { name: /Volver al inicio/i });
    expect(back.getAttribute('href')).toBe('/');
    expect(gate()?.textContent).toContain('Se crea sola al comprar');
    // Sin sesión no hay nada que cerrar: el botón de la cabecera no existe.
    expect(screen.queryByRole('button', { name: /Cerrar sesión/i })).toBeNull();
  });
});
