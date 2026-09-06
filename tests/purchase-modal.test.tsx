import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { PurchaseModal } from '../src/modules/promo/components/checkout/PurchaseModal';
import { ApiError } from '../src/utils/api';
import { redirectTo } from '../src/utils/navigation';
import {
  createPurchase,
  login,
  register as registerAccount,
  type PurchaseResponse,
} from '../src/modules/promo/services/checkout';
import { asButton, deferred, renderAt, setupUser } from './testUtils';

/**
 * Compra: cuenta, intención de pago y salida hacia Mercado Pago.
 *
 * Se prueba lo que la persona ve y hace. Nada mira dentro de `useCheckoutFlow`:
 * si mañana el hook se reescribe, estas pruebas deben seguir valiendo.
 */

vi.mock('../src/modules/promo/services/checkout', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/promo/services/checkout')>()),
  register: vi.fn(),
  login: vi.fn(),
  createPurchase: vi.fn(),
}));

// La redirección real sacaría al navegador de la página; jsdom ni siquiera la
// implementa. Aislarla en `redirectTo` permite comprobar *a dónde* se iba a ir.
vi.mock('../src/utils/navigation', () => ({ redirectTo: vi.fn() }));

const PASSWORD = 'contrasena-larga-2026';

const PURCHASE: PurchaseResponse = {
  id: 'pur_123',
  status: 'pending',
  amountCents: 1990000,
  currency: 'COP',
  externalReference: 'ref-123',
  checkoutUrl: 'https://sandbox.mercadopago.com.co/checkout/v1/redirect?pref_id=abc',
  hasLetter: false,
  paidAt: null,
  expiresAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
};

const fill = async (user: ReturnType<typeof setupUser>, email = 'sebas@ejemplo.com') => {
  await user.type(screen.getByLabelText('Tu nombre'), 'Sebastián');
  await user.type(screen.getByLabelText('Tu correo'), email);
  await user.type(screen.getByLabelText('Contraseña'), PASSWORD);
};

const submitButton = () =>
  asButton(screen.getByRole('button', { name: /Continuar al pago|Creando tu compra|Abriendo Mercado Pago/i }));

const open = () => renderAt(<PurchaseModal open onClose={() => {}} />);

describe('PurchaseModal', () => {
  it('camino feliz: crea la compra, la recuerda y sale hacia Mercado Pago', async () => {
    const user = setupUser();
    vi.mocked(registerAccount).mockResolvedValue({} as never);
    vi.mocked(login).mockResolvedValue({} as never);
    vi.mocked(createPurchase).mockResolvedValue(PURCHASE);

    open();
    await fill(user);
    await user.click(submitButton());

    await waitFor(() => expect(redirectTo).toHaveBeenCalledWith(PURCHASE.checkoutUrl));
    // Sin este apunte, a la vuelta de la pasarela no sabríamos qué verificar.
    expect(window.sessionStorage.getItem('checkout:purchaseId')).toBe('pur_123');
  });

  it('correo inválido: avisa mientras se escribe y no llega a llamar a la API', async () => {
    const user = setupUser();
    open();

    await user.type(screen.getByLabelText('Tu nombre'), 'Sebastián');
    const email = screen.getByLabelText('Tu correo');
    await user.type(email, 'sebas@');

    // Fail-fast: el veredicto aparece con la tecla, sin pulsar nada.
    await waitFor(() => expect(email.getAttribute('aria-invalid')).toBe('true'));
    expect(email.className).toContain('border-error');

    await user.type(screen.getByLabelText('Contraseña'), PASSWORD);
    await user.click(submitButton());

    expect(registerAccount).not.toHaveBeenCalled();
    expect(redirectTo).not.toHaveBeenCalled();
  });

  it('doble clic: solo se crea una compra', async () => {
    const user = setupUser();
    const pending = deferred<PurchaseResponse>();
    vi.mocked(registerAccount).mockResolvedValue({} as never);
    vi.mocked(login).mockResolvedValue({} as never);
    vi.mocked(createPurchase).mockReturnValue(pending.promise);

    open();
    await fill(user);

    const button = submitButton();
    await user.click(button);
    await waitFor(() => expect(button.disabled).toBe(true));
    await user.click(button);

    pending.resolve(PURCHASE);
    await waitFor(() => expect(redirectTo).toHaveBeenCalledTimes(1));
    expect(createPurchase).toHaveBeenCalledTimes(1);
  });

  it('registro 409 con contraseña equivocada: error en rojo y botón reactivado', async () => {
    const user = setupUser();
    vi.mocked(registerAccount).mockRejectedValue(
      new ApiError(409, 'EMAIL_IN_USE', 'Ese correo ya está registrado.'),
    );
    vi.mocked(login).mockRejectedValue(
      new ApiError(401, 'INVALID_CREDENTIALS', 'Credenciales inválidas.'),
    );

    open();
    await fill(user);
    await user.click(submitButton());

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Ese correo ya tiene cuenta');
    expect(alert.className).toContain('text-error');

    // El intento falló, pero la compra no: hay que poder reintentar.
    expect(submitButton().disabled).toBe(false);
    expect(createPurchase).not.toHaveBeenCalled();
    expect(redirectTo).not.toHaveBeenCalled();
  });

  it('registro 409 con la contraseña correcta: entra con su cuenta y sigue al pago', async () => {
    const user = setupUser();
    vi.mocked(registerAccount).mockRejectedValue(
      new ApiError(409, 'EMAIL_IN_USE', 'Ese correo ya está registrado.'),
    );
    vi.mocked(login).mockResolvedValue({} as never);
    vi.mocked(createPurchase).mockResolvedValue(PURCHASE);

    open();
    await fill(user, 'repetido@ejemplo.com');
    await user.click(submitButton());

    await waitFor(() => expect(redirectTo).toHaveBeenCalledWith(PURCHASE.checkoutUrl));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('pasarela sin URL de checkout: lo dice y no navega a ninguna parte', async () => {
    const user = setupUser();
    vi.mocked(registerAccount).mockResolvedValue({} as never);
    vi.mocked(login).mockResolvedValue({} as never);
    vi.mocked(createPurchase).mockResolvedValue({ ...PURCHASE, checkoutUrl: null });

    open();
    await fill(user);
    await user.click(submitButton());

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('pasarela de pago no está disponible');
    expect(redirectTo).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem('checkout:purchaseId')).toBeNull();
  });
});
