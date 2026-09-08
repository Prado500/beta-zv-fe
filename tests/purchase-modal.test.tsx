import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { PurchaseModal } from '../src/modules/promo/components/checkout/PurchaseModal';
import { CONFIRM_DELAY_SECONDS } from '../src/modules/promo/components/checkout/steps/EmailConfirmStep';
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
 * Compra: cuenta, confirmación del correo, contraseña y salida hacia Mercado Pago.
 *
 * Se prueba lo que la persona ve y hace. Nada mira dentro de `useCheckoutFlow`:
 * si mañana el hook se reescribe, estas pruebas deben seguir valiendo.
 *
 * El reloj es falso porque el paso de confirmación bloquea el botón tres
 * segundos de verdad: con el reloj real, cada caso pagaría ese peaje. Se usa
 * `shouldAdvanceTime` para que el tiempo siga corriendo solo —lo que necesitan
 * `waitFor` y `userEvent`— y además se pueda saltar la cuenta a voluntad.
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

const NAME = 'Sebastián';
const EMAIL = 'sebas@ejemplo.com';
/** Dentro del rango que acepta el backend (4–10). */
const PASSWORD = 'amor24';

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

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

const setup = () => setupUser({ advanceTimers: vi.advanceTimersByTime });

const open = () => renderAt(<PurchaseModal open onClose={() => {}} />);

const nextButton = () => screen.getByRole('button', { name: /^Siguiente/ });
const confirmButton = () =>
  asButton(screen.getByRole('button', { name: /Continuar en \d|Sí, continuar/ }));
const submitButton = () =>
  asButton(
    screen.getByRole('button', {
      name: /Continuar al pago|Creando tu compra|Abriendo Mercado Pago/i,
    }),
  );

/** Consume el bloqueo de la pantalla de confirmación sin esperarlo de verdad. */
const waitOutCountdown = () => {
  act(() => {
    vi.advanceTimersByTime(CONFIRM_DELAY_SECONDS * 1000);
  });
};

/** Paso 1 relleno y pulsado: deja la pantalla de confirmación en pantalla. */
const goToConfirm = async (user: ReturnType<typeof setup>, email = EMAIL) => {
  await user.type(screen.getByLabelText('Tu nombre'), NAME);
  await user.type(screen.getByLabelText('Tu correo'), email);
  await user.click(nextButton());
  await screen.findByLabelText('Corrígelo aquí si hace falta');
};

/** Hasta el paso de la contraseña, con la cuenta regresiva ya consumida. */
const goToPassword = async (user: ReturnType<typeof setup>, email = EMAIL) => {
  await goToConfirm(user, email);
  waitOutCountdown();
  await user.click(confirmButton());
  await screen.findByLabelText('Contraseña');
};

/** Todo el asistente, listo para enviar. */
const fill = async (user: ReturnType<typeof setup>, email = EMAIL) => {
  await goToPassword(user, email);
  await user.type(screen.getByLabelText('Contraseña'), PASSWORD);
  await user.type(screen.getByLabelText('Confirmar contraseña'), PASSWORD);
};

describe('PurchaseModal', () => {
  it('camino feliz: recorre los tres pasos, crea la compra y sale hacia Mercado Pago', async () => {
    const user = setup();
    vi.mocked(registerAccount).mockResolvedValue({} as never);
    vi.mocked(login).mockResolvedValue({} as never);
    vi.mocked(createPurchase).mockResolvedValue(PURCHASE);

    open();
    await fill(user);
    await user.click(submitButton());

    await waitFor(() => expect(redirectTo).toHaveBeenCalledWith(PURCHASE.checkoutUrl));

    // `confirmPassword` nunca sale de esta pantalla: el backend prohíbe campos
    // de más y devolvería un 422 por un dato que solo servía para cazar erratas.
    expect(registerAccount).toHaveBeenCalledWith({ name: NAME, email: EMAIL, password: PASSWORD });
    // Sin este apunte, a la vuelta de la pasarela no sabríamos qué verificar.
    expect(window.sessionStorage.getItem('checkout:purchaseId')).toBe('pur_123');
  });

  it('correo inválido: avisa mientras se escribe y no deja pasar del primer paso', async () => {
    const user = setup();
    open();

    await user.type(screen.getByLabelText('Tu nombre'), NAME);
    const email = screen.getByLabelText('Tu correo');
    await user.type(email, 'sebas@');

    // Fail-fast: el veredicto aparece con la tecla, sin pulsar nada.
    await waitFor(() => expect(email.getAttribute('aria-invalid')).toBe('true'));
    expect(email.className).toContain('border-error');

    await user.click(nextButton());

    // Sigue en el paso 1: la confirmación no llega a montarse.
    expect(screen.queryByLabelText('Corrígelo aquí si hace falta')).toBeNull();
    expect(registerAccount).not.toHaveBeenCalled();
  });

  it('el correo se confirma con el botón bloqueado 3 segundos antes de habilitarse', async () => {
    const user = setup();
    open();
    await goToConfirm(user);

    // El texto es el contrato con el usuario: dice qué va a llegar a esa dirección.
    expect(screen.getByRole('dialog').textContent).toContain(
      '¿Estás seguro de que este es tu correo?',
    );

    // Al entrar: bloqueado y contando.
    expect(confirmButton().disabled).toBe(true);
    expect(confirmButton().textContent).toContain('Continuar en 3');

    act(() => vi.advanceTimersByTime(1000));
    expect(confirmButton().textContent).toContain('Continuar en 2');

    act(() => vi.advanceTimersByTime(1000));
    expect(confirmButton().textContent).toContain('Continuar en 1');

    // Pulsarlo antes de tiempo no adelanta nada.
    await user.click(confirmButton());
    expect(screen.queryByLabelText('Contraseña')).toBeNull();

    act(() => vi.advanceTimersByTime(1000));
    expect(confirmButton().disabled).toBe(false);
    expect(confirmButton().textContent).toContain('Sí, continuar');

    await user.click(confirmButton());
    expect(await screen.findByLabelText('Contraseña')).toBeTruthy();
  });

  it('errata corregida en la confirmación: se registra el correo bueno, no el original', async () => {
    const user = setup();
    vi.mocked(registerAccount).mockResolvedValue({} as never);
    vi.mocked(login).mockResolvedValue({} as never);
    vi.mocked(createPurchase).mockResolvedValue(PURCHASE);

    open();
    await goToConfirm(user, 'sebas@gmial.com');

    const editable = screen.getByLabelText('Corrígelo aquí si hace falta');
    await user.clear(editable);
    await user.type(editable, 'sebas@gmail.com');

    waitOutCountdown();
    await user.click(confirmButton());

    await user.type(await screen.findByLabelText('Contraseña'), PASSWORD);
    await user.type(screen.getByLabelText('Confirmar contraseña'), PASSWORD);
    await user.click(submitButton());

    await waitFor(() => expect(redirectTo).toHaveBeenCalled());
    expect(registerAccount).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'sebas@gmail.com' }),
    );
    expect(login).toHaveBeenCalledWith('sebas@gmail.com', PASSWORD);
  });

  it('contraseñas que no coinciden: lo dice y no llama a la API', async () => {
    const user = setup();
    open();
    await goToPassword(user);

    await user.type(screen.getByLabelText('Contraseña'), PASSWORD);
    const confirm = screen.getByLabelText('Confirmar contraseña');
    await user.type(confirm, 'amor25');

    // Fail-fast otra vez: el aviso sale bajo el segundo campo, que es el que se
    // arregla, y aparece tecleando, sin necesidad de enviar.
    expect(await screen.findByText('Las dos contraseñas no coinciden.')).toBeTruthy();
    await waitFor(() => expect(confirm.getAttribute('aria-invalid')).toBe('true'));

    await user.click(submitButton());
    expect(registerAccount).not.toHaveBeenCalled();
    expect(redirectTo).not.toHaveBeenCalled();
  });

  it('contraseña corta o larga: 3 caracteres no valen y de 10 no se pasa', async () => {
    const user = setup();
    open();
    await goToPassword(user);

    const password = screen.getByLabelText('Contraseña');
    await user.type(password, 'abc');
    expect(await screen.findByText(/al menos 4 caracteres/)).toBeTruthy();

    // A los 4 ya vale: ni mayúsculas, ni dígitos, ni símbolos.
    await user.type(password, 'd');
    await waitFor(() => expect(password.getAttribute('aria-invalid')).toBe('false'));

    // El tope no se descubre con un error en rojo: el campo deja de escribir.
    await user.clear(password);
    await user.type(password, 'abcdefghijklmno');
    expect(asButton(password).value).toBe('abcdefghij');
    expect(password.getAttribute('aria-invalid')).toBe('false');
  });

  it('doble clic: solo se crea una compra', async () => {
    const user = setup();
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
    const user = setup();
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
    const user = setup();
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
    const user = setup();
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

  it('volver desde la confirmación y entrar otra vez: la cuenta regresiva se reinicia', async () => {
    const user = setup();
    open();
    await goToConfirm(user);

    act(() => vi.advanceTimersByTime(2000));
    expect(confirmButton().textContent).toContain('Continuar en 1');

    await user.click(screen.getByRole('button', { name: /No, quiero corregirlo/ }));
    await screen.findByLabelText('Tu nombre');

    await user.click(nextButton());
    await screen.findByLabelText('Corrígelo aquí si hace falta');

    // Rebotar entre pasos no sirve para saltarse el freno.
    expect(confirmButton().disabled).toBe(true);
    expect(confirmButton().textContent).toContain('Continuar en 3');
  });
});
