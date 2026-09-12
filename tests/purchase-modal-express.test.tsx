import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { PurchaseModal } from '../src/modules/promo/components/checkout/PurchaseModal';
import { ApiError } from '../src/utils/api';
import { redirectTo } from '../src/utils/navigation';
import { login, logout } from '../src/modules/auth/services/auth';
import { createPurchase, type PurchaseResponse } from '../src/modules/promo/services/checkout';
import { asButton, asInput, deferred, renderAt, setupUser, signedIn, USER } from './testUtils';

/**
 * El paso exprés: con sesión abierta, comprar no pregunta nada.
 *
 * Se abre el modal, se crea la compra y se sale hacia Mercado Pago. Lo que sí
 * tiene que hacer esta pantalla es decir quién compra, dar salida al ordenador
 * compartido y recoger los fallos con su botón de reintentar. Y cuando el
 * servidor dice que la sesión ya no existe, pedir entrar ahí mismo sin tirar la
 * compra a la basura.
 */

vi.mock('../src/modules/auth/services/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/auth/services/auth')>()),
  login: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('../src/modules/promo/services/checkout', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/promo/services/checkout')>()),
  createPurchase: vi.fn(),
}));

vi.mock('../src/utils/navigation', () => ({ redirectTo: vi.fn() }));

const PURCHASE: PurchaseResponse = {
  id: 'pur_789',
  status: 'pending',
  amountCents: 3000000,
  currency: 'COP',
  externalReference: 'ref-789',
  checkoutUrl: 'https://sandbox.mercadopago.com.co/checkout/v1/redirect?pref_id=ghi',
  hasLetter: false,
  paidAt: null,
  expiresAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
};

const NO_SESSION = new ApiError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar.');
const GATEWAY_DOWN = new ApiError(503, 'SERVICE_UNAVAILABLE', 'Mercado Pago no responde.');

/** El modal como lo abre alguien que ya está dentro. */
const open = () => renderAt(<PurchaseModal open onClose={() => {}} />, { auth: signedIn() });

const retryButton = () => asButton(screen.getByRole('button', { name: /Reintentar/ }));
const switchAccountButton = () => screen.getByRole('button', { name: /¿No eres tú\?/ });
const keyOfCall = (index: number) => vi.mocked(createPurchase).mock.calls[index][0];

beforeEach(() => {
  vi.mocked(login).mockReset();
  vi.mocked(logout).mockReset();
  vi.mocked(createPurchase).mockReset();
});

describe('PurchaseModal · paso exprés con sesión', () => {
  it('no pregunta nada: dice quién compra, crea la compra al abrirse y sale hacia Mercado Pago', async () => {
    vi.mocked(createPurchase).mockResolvedValue(PURCHASE);

    open();

    expect(screen.queryByLabelText('Tu nombre')).toBeNull();
    expect(screen.queryByLabelText('Tu correo')).toBeNull();
    expect(screen.queryByLabelText('Contraseña')).toBeNull();
    expect(screen.getByRole('heading', { name: /Preparando tu\s+pago/ })).toBeTruthy();
    expect(screen.getByText(USER.name)).toBeTruthy();
    expect(screen.getByText(USER.email)).toBeTruthy();

    await waitFor(() => expect(redirectTo).toHaveBeenCalledWith(PURCHASE.checkoutUrl));
    expect(createPurchase).toHaveBeenCalledTimes(1);
    expect(keyOfCall(0)).toMatch(/^web-/);
    expect(window.sessionStorage.getItem('checkout:purchaseId')).toBe(PURCHASE.id);
  });

  it('sesión caducada: pide entrar con el correo puesto y retoma la misma compra', async () => {
    const user = setupUser();
    vi.mocked(createPurchase).mockRejectedValueOnce(NO_SESSION).mockResolvedValueOnce(PURCHASE);
    vi.mocked(login).mockResolvedValue(USER);
    window.localStorage.setItem('auth:signedInAt', '2026-01-01T00:00:00Z');

    open();

    // El 401 no es un error: es la entrada, con el correo ya escrito y el porqué.
    expect((await screen.findByText(/Tu sesión caducó/)).closest('[role="status"]')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(asInput(screen.getByLabelText('Tu correo')).value).toBe(USER.email);
    // La pista local se borra con la sesión: la próxima carga no preguntará en vano.
    expect(window.localStorage.getItem('auth:signedInAt')).toBeNull();

    await user.type(screen.getByLabelText('Contraseña'), 'amor24');
    await user.click(screen.getByRole('button', { name: /Entrar y continuar al pago/ }));

    await waitFor(() => expect(redirectTo).toHaveBeenCalledWith(PURCHASE.checkoutUrl));
    expect(login).toHaveBeenCalledWith(USER.email, 'amor24');
    // La misma compra, la misma clave: dos peticiones, un solo cobro posible.
    expect(createPurchase).toHaveBeenCalledTimes(2);
    expect(keyOfCall(1)).toBe(keyOfCall(0));
    expect(window.localStorage.getItem('auth:signedInAt')).not.toBeNull();
  });

  it('pasarela caída: lo dice, ofrece reintentar y reutiliza la clave de idempotencia', async () => {
    const user = setupUser();
    vi.mocked(createPurchase).mockRejectedValueOnce(GATEWAY_DOWN).mockResolvedValueOnce(PURCHASE);

    open();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('no está disponible');
    expect(redirectTo).not.toHaveBeenCalled();

    await user.click(retryButton());

    await waitFor(() => expect(redirectTo).toHaveBeenCalledWith(PURCHASE.checkoutUrl));
    expect(createPurchase).toHaveBeenCalledTimes(2);
    expect(keyOfCall(1)).toBe(keyOfCall(0));
  });

  it('doble clic en reintentar: una sola petición más', async () => {
    const user = setupUser();
    const pending = deferred<PurchaseResponse>();
    vi.mocked(createPurchase).mockRejectedValueOnce(GATEWAY_DOWN).mockReturnValue(pending.promise);

    open();
    await screen.findByRole('alert');

    const button = retryButton();
    await user.click(button);
    await waitFor(() => expect(screen.queryByRole('button', { name: /Reintentar/ })).toBeNull());
    // El segundo clic ya no encuentra botón: la pantalla está "creando".
    expect(screen.getByRole('status').textContent).toContain('Creando tu compra');

    pending.resolve(PURCHASE);
    await waitFor(() => expect(redirectTo).toHaveBeenCalledTimes(1));
    expect(createPurchase).toHaveBeenCalledTimes(2);
  });

  it('"¿No eres tú?": cierra la sesión ajena y vuelve a empezar por el alta', async () => {
    const user = setupUser();
    vi.mocked(createPurchase).mockRejectedValue(GATEWAY_DOWN);
    vi.mocked(logout).mockResolvedValue({ message: 'Sesión cerrada.' });
    window.localStorage.setItem('auth:signedInAt', '2026-01-01T00:00:00Z');

    open();
    await screen.findByRole('alert');

    await user.click(switchAccountButton());

    expect(await screen.findByLabelText('Tu nombre')).toBeTruthy();
    expect(logout).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(USER.email)).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(window.localStorage.getItem('auth:signedInAt')).toBeNull();
    // La compra anterior no se vuelve a intentar sola.
    expect(createPurchase).toHaveBeenCalledTimes(1);
  });
});
