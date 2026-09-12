import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { PurchaseModal } from '../src/modules/promo/components/checkout/PurchaseModal';
import { CONFIRM_DELAY_SECONDS } from '../src/modules/promo/components/checkout/steps/EmailConfirmStep';
import { ApiError } from '../src/utils/api';
import { login, register as registerAccount } from '../src/modules/auth/services/auth';
import { createPurchase, type PurchaseResponse } from '../src/modules/promo/services/checkout';
import { asButton, asInput, deferred, renderAt, setupUser, USER } from './testUtils';

/**
 * El alta como acto legal, visto desde la persona que compra.
 *
 * Nada de esto mira dentro de `useCheckoutFlow`: se escribe, se pulsa y se comprueba
 * lo que llega a la API, que es lo que de verdad tiene que seguir siendo cierto si
 * mañana el hook se reescribe.
 *
 * Lo que se protege aquí no es una pantalla bonita: es que no se pueda crear una
 * cuenta sin autorización expresa (Ley 1581), que el documento viaje con el código
 * oficial de la DIAN, y que un documento repetido no mande a nadie a iniciar sesión
 * en una cuenta que no es suya.
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

vi.mock('../src/modules/legal/services/legal', () => ({
  fetchTerms: vi.fn(async () => ({
    version: TERMS_VERSION,
    checksum: 'a'.repeat(64),
    content: '# Términos\n\nTexto de prueba sobre fotografías y la Carta HTML.',
  })),
  forgetTerms: vi.fn(),
}));

const NAME = 'Sebastián';
const EMAIL = 'sebas@ejemplo.com';
const PASSWORD = 'amor24';
const DOCUMENT = '1098765432';
const TERMS_VERSION = '2026-09-10';

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
  vi.mocked(registerAccount).mockReset();
  vi.mocked(login).mockReset();
  vi.mocked(createPurchase).mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

const setup = () => setupUser({ advanceTimers: vi.advanceTimersByTime });
const open = () => renderAt(<PurchaseModal open onClose={() => {}} />);

const nextButton = () => asButton(screen.getByRole('button', { name: /^Siguiente/ }));
const submitButton = () =>
  asButton(
    screen.getByRole('button', {
      name: /Continuar al pago|Creando tu compra|Abriendo Mercado Pago/i,
    }),
  );
const consentBox = () => asInput(screen.getByRole('checkbox'));
const termsLink = () => screen.getByRole('button', { name: /Términos y la Política/ });

/** Rellena el primer paso. El tipo de documento no se toca: viene preseleccionado. */
const fillAccountStep = async (user: ReturnType<typeof setup>, document = DOCUMENT) => {
  await user.type(screen.getByLabelText('Tu nombre'), NAME);
  await user.type(screen.getByLabelText('Número de documento'), document);
  await user.type(screen.getByLabelText('Tu correo'), EMAIL);
};

/** Hasta el paso de la contraseña, con la cuenta regresiva ya consumida. */
const goToPassword = async (user: ReturnType<typeof setup>) => {
  await fillAccountStep(user);
  await user.click(nextButton());
  await screen.findByLabelText('Corrígelo aquí si hace falta');
  act(() => {
    vi.advanceTimersByTime(CONFIRM_DELAY_SECONDS * 1000);
  });
  await user.click(screen.getByRole('button', { name: /Sí, continuar/ }));
  await screen.findByLabelText('Contraseña');
  await user.type(screen.getByLabelText('Contraseña'), PASSWORD);
  await user.type(screen.getByLabelText('Confirmar contraseña'), PASSWORD);
  // El botón espera a que lleguen los Términos: sin su versión no se registra a nadie.
  await waitFor(() => expect(submitButton().disabled).toBe(false));
};

describe('alta con documento y consentimiento', () => {
  it('camino feliz: el alta viaja con el código DIAN y la versión aceptada', async () => {
    const user = setup();
    vi.mocked(registerAccount).mockResolvedValue(USER);
    vi.mocked(login).mockResolvedValue(USER);
    vi.mocked(createPurchase).mockResolvedValue(PURCHASE);

    open();
    await goToPassword(user);
    await user.click(consentBox());
    await user.click(submitButton());

    await waitFor(() => expect(registerAccount).toHaveBeenCalledTimes(1));
    expect(registerAccount).toHaveBeenCalledWith({
      name: NAME,
      email: EMAIL,
      password: PASSWORD,
      documentType: '13',
      documentNumber: DOCUMENT,
      acceptedTermsVersion: TERMS_VERSION,
    });
  });

  /**
   * Este caso es además la red del esquema: el aviso del formato vive en un
   * refinamiento de objeto y la casilla del consentimiento sigue sin marcar aquí. Si
   * alguien vuelve a declararla con `z.literal(true)`, Zod aborta los refinamientos
   * posteriores y este mensaje deja de aparecer en producción sin previo aviso.
   */
  it('sad path: una cédula con letras avisa en vivo y no deja pasar de paso', async () => {
    const user = setup();
    open();

    const field = screen.getByLabelText('Número de documento');
    await user.type(screen.getByLabelText('Tu nombre'), NAME);
    await user.type(field, '10AB7654');
    await user.type(screen.getByLabelText('Tu correo'), EMAIL);

    // El aviso llega mientras se escribe, sin esperar al envío.
    expect(await screen.findByText(/solo admite dígitos/i)).toBeTruthy();
    await waitFor(() => expect(field.getAttribute('aria-invalid')).toBe('true'));

    await user.click(nextButton());
    expect(screen.queryByLabelText('Corrígelo aquí si hace falta')).toBeNull();

    // Y al corregirlo se apaga el rojo y deja avanzar.
    await user.clear(field);
    await user.type(field, DOCUMENT);
    await waitFor(() => expect(field.getAttribute('aria-invalid')).toBe('false'));
    expect(screen.queryByText(/solo admite dígitos/i)).toBeNull();

    await user.click(nextButton());
    expect(await screen.findByLabelText('Corrígelo aquí si hace falta')).toBeTruthy();
  });

  it('un número vacío dice que falta, no que tenga letras de más', async () => {
    const user = setup();
    open();

    await user.type(screen.getByLabelText('Tu nombre'), NAME);
    await user.type(screen.getByLabelText('Número de documento'), '1');
    await user.clear(screen.getByLabelText('Número de documento'));

    expect(await screen.findByText(/es obligatorio/i)).toBeTruthy();
    // Un solo aviso sobre el mismo campo: el que se puede arreglar ahora.
    expect(screen.queryByText(/solo admite dígitos/i)).toBeNull();
  });

  it('concurrencia: dos clics seguidos no crean dos altas', async () => {
    const user = setup();
    const pending = deferred<PurchaseResponse>();
    vi.mocked(registerAccount).mockResolvedValue(USER);
    vi.mocked(login).mockResolvedValue(USER);
    vi.mocked(createPurchase).mockReturnValue(pending.promise);

    open();
    await goToPassword(user);
    await user.click(consentBox());

    const button = submitButton();
    await user.click(button);
    await waitFor(() => expect(button.disabled).toBe(true));
    await user.click(button);

    pending.resolve(PURCHASE);
    await waitFor(() => expect(createPurchase).toHaveBeenCalledTimes(1));
    expect(registerAccount).toHaveBeenCalledTimes(1);
  });

  it('documento repetido: lo dice y NO manda a iniciar sesión en una cuenta ajena', async () => {
    const user = setup();
    const conflict = new ApiError(
      409,
      'REGISTRATION_CONFLICT',
      'No pudimos crear la cuenta con esos datos. Si ya tienes cuenta, inicia sesión.',
    );
    vi.mocked(registerAccount).mockRejectedValue(conflict);

    open();
    await goToPassword(user);
    await user.click(consentBox());
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      expect.stringContaining('No pudimos crear la cuenta'),
    );
    // Lo esencial: no se intenta entrar con unas credenciales que no son de esa cuenta.
    expect(login).not.toHaveBeenCalled();
    expect(createPurchase).not.toHaveBeenCalled();
    // Y la persona sigue donde estaba, con su contraseña puesta.
    expect(asInput(screen.getByLabelText('Contraseña')).value).toBe(PASSWORD);
    expect(screen.queryByRole('button', { name: /^Entrar/ })).toBeNull();
  });

  it('correo repetido sí manda a la entrada: el contrato anterior no se rompe', async () => {
    const user = setup();
    vi.mocked(registerAccount).mockRejectedValue(
      new ApiError(409, 'EMAIL_IN_USE', 'No se puede registrar ese correo.'),
    );
    vi.mocked(login).mockRejectedValue(
      new ApiError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.'),
    );

    open();
    await goToPassword(user);
    await user.click(consentBox());
    await user.click(submitButton());

    expect(await screen.findByRole('status')).toHaveProperty(
      'textContent',
      expect.stringContaining('ya tiene cuenta'),
    );
    expect(login).toHaveBeenCalledTimes(1);
  });

  it('UI: sin marcar la casilla el botón está vivo, pero al pulsarlo avisa y no llama a la API', async () => {
    const user = setup();
    vi.mocked(registerAccount).mockResolvedValue(USER);

    open();
    await goToPassword(user);

    // Vivo a propósito: un botón muerto no explica qué falta.
    expect(consentBox().checked).toBe(false);
    expect(submitButton().disabled).toBe(false);
    // Y en silencio hasta que se intenta enviar: nadie merece un rojo por un campo
    // que aún no ha visto.
    expect(screen.queryByText(/Necesitamos tu autorización/i)).toBeNull();

    await user.click(submitButton());

    expect(await screen.findByText(/Necesitamos tu autorización/i)).toBeTruthy();
    expect(registerAccount).not.toHaveBeenCalled();

    // Al marcarla, el aviso se va y el alta sale adelante.
    await user.click(consentBox());
    await waitFor(() => expect(screen.queryByText(/Necesitamos tu autorización/i)).toBeNull());
    await user.click(submitButton());
    await waitFor(() => expect(registerAccount).toHaveBeenCalledTimes(1));
  });

  it('UI: los Términos abren encima y al cerrarlos no se ha perdido nada', async () => {
    const user = setup();
    open();
    await goToPassword(user);
    await user.click(consentBox());

    const before = asInput(screen.getByLabelText('Contraseña')).value;

    await user.click(termsLink());
    await screen.findByRole('heading', { name: /Términos y\s+privacidad/ });
    // El de compra sigue montado debajo: por eso no se pierde el paso ni la clave
    // de idempotencia que vive en un ref.
    expect(screen.getByRole('heading', { name: /Elige tu\s+contraseña/ })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /Entendido, volver/ }));

    await waitFor(() => expect(screen.queryByRole('heading', { name: /privacidad/ })).toBeNull());
    expect(asInput(screen.getByLabelText('Contraseña')).value).toBe(before);
    expect(consentBox().checked).toBe(true);
    expect(screen.getByLabelText('Contraseña')).toBeTruthy();
  });

  it('UI: con los Términos abiertos, Escape no cierra el modal de compra por debajo', async () => {
    const user = setup();
    open();
    await goToPassword(user);

    await user.click(termsLink());
    await screen.findByRole('heading', { name: /Términos y\s+privacidad/ });

    await user.keyboard('{Escape}');

    // Escape cierra el de encima; el de compra, que guarda lo tecleado y la clave
    // de idempotencia, se queda.
    await waitFor(() => expect(screen.queryByRole('heading', { name: /privacidad/ })).toBeNull());
    expect(screen.getByRole('heading', { name: /Elige tu\s+contraseña/ })).toBeTruthy();
    expect(asInput(screen.getByLabelText('Contraseña')).value).toBe(PASSWORD);
  });
});
