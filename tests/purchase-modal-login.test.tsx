import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { PurchaseModal } from '../src/modules/promo/components/checkout/PurchaseModal';
import { ApiError } from '../src/utils/api';
import { redirectTo } from '../src/utils/navigation';
import { login, register as registerAccount } from '../src/modules/auth/services/auth';
import { createPurchase, type PurchaseResponse } from '../src/modules/promo/services/checkout';
import { asButton, asInput, deferred, renderAt, setupUser, USER } from './testUtils';

/**
 * La puerta de quien vuelve: "¿Ya tienes cuenta? Inicia sesión".
 *
 * Correo y contraseña, y de ahí al pago. Sin nombre, sin freno de tres
 * segundos, sin segunda contraseña. Y desde la cabecera, la misma puerta sin
 * compra detrás: entrar y cerrar.
 */

vi.mock('../src/modules/auth/services/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/auth/services/auth')>()),
  register: vi.fn(),
  login: vi.fn(),
}));

vi.mock('../src/modules/promo/services/checkout', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/promo/services/checkout')>()),
  createPurchase: vi.fn(),
}));

vi.mock('../src/utils/navigation', () => ({ redirectTo: vi.fn() }));

const EMAIL = USER.email;
/** Al entrar no hay rango: vale lo que valga en el servidor. */
const PASSWORD = 'mi-clave-larga-2024';

const PURCHASE: PurchaseResponse = {
  id: 'pur_456',
  status: 'pending',
  amountCents: 3000000,
  currency: 'COP',
  externalReference: 'ref-456',
  checkoutUrl: 'https://sandbox.mercadopago.com.co/checkout/v1/redirect?pref_id=def',
  hasLetter: false,
  paidAt: null,
  expiresAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
};

const open = (intent: 'checkout' | 'signin' = 'checkout', onClose: () => void = () => {}) =>
  renderAt(<PurchaseModal open intent={intent} onClose={onClose} />);

const emailField = () => screen.getByLabelText('Tu correo');
const passwordField = () => screen.getByLabelText('Contraseña');
const enterButton = () =>
  asButton(
    screen.getByRole('button', {
      name: /^Entrar|^Entrando|^Creando tu compra|^Abriendo Mercado Pago/,
    }),
  );
const loginHeading = () => screen.queryByRole('heading', { name: /Inicia\s+sesión/ });

/** Del alta a la entrada por el enlace del primer paso. */
const toLogin = async (user: ReturnType<typeof setupUser>) => {
  await user.click(screen.getByRole('button', { name: 'Inicia sesión' }));
  await screen.findByLabelText('Contraseña');
};

beforeEach(() => {
  vi.mocked(registerAccount).mockReset();
  vi.mocked(login).mockReset();
  vi.mocked(createPurchase).mockReset();
});

describe('PurchaseModal · entrar con una cuenta de siempre', () => {
  it('el enlace "¿Ya tienes cuenta?" abre la entrada y conserva el correo en las dos direcciones', async () => {
    const user = setupUser();
    open();

    await user.type(emailField(), EMAIL);
    await toLogin(user);

    // La entrada: sin nombre, con el correo que ya se había escrito.
    expect(loginHeading()).toBeTruthy();
    expect(screen.queryByLabelText('Tu nombre')).toBeNull();
    expect(asInput(emailField()).value).toBe(EMAIL);
    expect(passwordField().getAttribute('autocomplete')).toBe('current-password');

    // Y vuelta: el correo sigue puesto en el alta.
    await user.click(screen.getByRole('button', { name: 'Crea tu cuenta' }));
    expect(await screen.findByLabelText('Tu nombre')).toBeTruthy();
    expect(loginHeading()).toBeNull();
    expect(asInput(emailField()).value).toBe(EMAIL);
  });

  it('camino feliz: entra, crea la compra y sale hacia Mercado Pago sin pasar por el alta', async () => {
    const user = setupUser();
    vi.mocked(login).mockResolvedValue(USER);
    vi.mocked(createPurchase).mockResolvedValue(PURCHASE);

    open();
    await toLogin(user);
    await user.type(emailField(), EMAIL);
    await user.type(passwordField(), PASSWORD);
    await user.click(enterButton());

    await waitFor(() => expect(redirectTo).toHaveBeenCalledWith(PURCHASE.checkoutUrl));
    expect(login).toHaveBeenCalledWith(EMAIL, PASSWORD);
    expect(registerAccount).not.toHaveBeenCalled();
    expect(createPurchase).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem('checkout:purchaseId')).toBe(PURCHASE.id);
    expect(window.localStorage.getItem('auth:signedInAt')).not.toBeNull();
  });

  it('fail-fast: el correo inválido se marca al escribir y sin contraseña no se llama a la API', async () => {
    const user = setupUser();
    open();
    await toLogin(user);

    await user.type(emailField(), 'sebas@');
    await waitFor(() => expect(emailField().getAttribute('aria-invalid')).toBe('true'));
    expect(emailField().className).toContain('border-error');

    await user.clear(emailField());
    await user.type(emailField(), EMAIL);
    await waitFor(() => expect(emailField().getAttribute('aria-invalid')).toBe('false'));

    await user.click(enterButton());
    expect(await screen.findByText('Escribe tu contraseña.')).toBeTruthy();
    expect(login).not.toHaveBeenCalled();
  });

  it('contraseña equivocada: lo dice en rojo, deja reintentar y no crea ninguna compra', async () => {
    const user = setupUser();
    vi.mocked(login).mockRejectedValue(
      new ApiError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.'),
    );

    open();
    await toLogin(user);
    await user.type(emailField(), EMAIL);
    await user.type(passwordField(), PASSWORD);
    await user.click(enterButton());

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Correo o contraseña incorrectos');
    expect(alert.className).toContain('text-error');
    expect(enterButton().disabled).toBe(false);
    expect(createPurchase).not.toHaveBeenCalled();
    expect(redirectTo).not.toHaveBeenCalled();
  });

  it('doble clic: un solo inicio de sesión y una sola compra', async () => {
    const user = setupUser();
    const pending = deferred<typeof USER>();
    vi.mocked(login).mockReturnValue(pending.promise);
    vi.mocked(createPurchase).mockResolvedValue(PURCHASE);

    open();
    await toLogin(user);
    await user.type(emailField(), EMAIL);
    await user.type(passwordField(), PASSWORD);

    const button = enterButton();
    await user.click(button);
    await waitFor(() => expect(button.disabled).toBe(true));
    await user.click(button);

    pending.resolve(USER);
    await waitFor(() => expect(redirectTo).toHaveBeenCalledTimes(1));
    expect(login).toHaveBeenCalledTimes(1);
    expect(createPurchase).toHaveBeenCalledTimes(1);
  });

  it('desde la cabecera: abre directamente en la entrada y, al entrar, solo cierra', async () => {
    const user = setupUser();
    const onClose = vi.fn();
    vi.mocked(login).mockResolvedValue(USER);

    open('signin', onClose);

    // Sin alta a la vista: quien pulsó "Iniciar sesión" ya sabe que tiene cuenta.
    expect(loginHeading()).toBeTruthy();
    expect(screen.queryByLabelText('Tu nombre')).toBeNull();
    expect(enterButton().textContent).not.toContain('pago');

    await user.type(emailField(), EMAIL);
    await user.type(passwordField(), PASSWORD);
    await user.click(enterButton());

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(login).toHaveBeenCalledWith(EMAIL, PASSWORD);
    expect(createPurchase).not.toHaveBeenCalled();
    expect(redirectTo).not.toHaveBeenCalled();
  });
});
