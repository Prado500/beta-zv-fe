import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { PurchaseModal } from '../src/modules/promo/components/checkout/PurchaseModal';
import { CONFIRM_DELAY_SECONDS } from '../src/modules/promo/components/checkout/steps/EmailConfirmStep';
import { login, register as registerAccount } from '../src/modules/auth/services/auth';
import { createPurchase, type PurchaseResponse } from '../src/modules/promo/services/checkout';
import { asButton, renderAt, setupUser, USER } from './testUtils';

/**
 * El documento de identidad, ahora opcional.
 *
 * Pedirlo para abrir una cuenta era fricción pura: la inmensa mayoría no
 * necesita factura, y un campo tributario obligatorio en el primer paso de una
 * compra de treinta mil pesos espanta a quien venía a regalar algo. Solo lo
 * necesita quien pide factura electrónica o va a declararlo en renta.
 *
 * Lo que se fija aquí es el trato nuevo: se avanza con nombre y correo, los
 * campos del documento NO existen hasta pedir factura, y cuando se piden valen
 * las mismas reglas de la DIAN de siempre. Nada de esto mira dentro del hook: se
 * escribe, se pulsa y se comprueba lo que llega a la API.
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
    content: '# Términos\n\nTexto de prueba.',
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
  vi.mocked(registerAccount).mockReset().mockResolvedValue(USER);
  vi.mocked(login).mockReset().mockResolvedValue(USER);
  vi.mocked(createPurchase).mockReset().mockResolvedValue(PURCHASE);
});

afterEach(() => vi.useRealTimers());

const setup = () => setupUser({ advanceTimers: vi.advanceTimersByTime });
const open = () => renderAt(<PurchaseModal open onClose={() => {}} />);

const nextButton = () => asButton(screen.getByRole('button', { name: /^Siguiente/ }));
const invoiceBox = () => screen.getByRole('checkbox', { name: /factura/i });
const documentNumber = () => screen.getByLabelText('Número de documento');

/** Lo mínimo que el formulario puede pedir: quién es y a dónde le escribimos. */
const fillMinimum = async (user: ReturnType<typeof setup>) => {
  await user.type(screen.getByLabelText('Tu nombre'), NAME);
  await user.type(screen.getByLabelText('Tu correo'), EMAIL);
};

/** Del paso de cuenta hasta el alta consumada, pasando por el freno del correo. */
const finishRegistration = async (user: ReturnType<typeof setup>) => {
  await user.click(nextButton());
  await screen.findByLabelText('Corrígelo aquí si hace falta');
  act(() => vi.advanceTimersByTime(CONFIRM_DELAY_SECONDS * 1000));
  await user.click(screen.getByRole('button', { name: /Sí, continuar/ }));

  await screen.findByLabelText('Contraseña');
  await user.type(screen.getByLabelText('Contraseña'), PASSWORD);
  await user.type(screen.getByLabelText('Confirmar contraseña'), PASSWORD);
  await user.click(screen.getByRole('checkbox'));

  const submit = asButton(
    screen.getByRole('button', { name: /Continuar al pago|Creando tu compra|Abriendo Mercado/i }),
  );
  await waitFor(() => expect(submit.disabled).toBe(false));
  await user.click(submit);
  await waitFor(() => expect(registerAccount).toHaveBeenCalled());
};

describe('documento de identidad opcional', () => {
  it('happy path: con nombre y correo basta para avanzar', async () => {
    const user = setup();
    open();

    await fillMinimum(user);
    await user.click(nextButton());

    // El freno del correo es el paso siguiente: si aparece, el paso 1 pasó
    expect(await screen.findByLabelText('Corrígelo aquí si hace falta')).toBeTruthy();
  });

  it('UI: los campos del documento no existen hasta pedir factura', async () => {
    const user = setup();
    open();

    expect(screen.queryByLabelText('Número de documento')).toBeNull();
    expect(screen.queryByLabelText('Tipo de documento')).toBeNull();

    await user.click(invoiceBox());

    expect(screen.getByLabelText('Número de documento')).toBeTruthy();
    expect(screen.getByLabelText('Tipo de documento')).toBeTruthy();
  });

  it('el alta viaja sin documento cuando no se pide factura', async () => {
    const user = setup();
    open();

    await fillMinimum(user);
    await finishRegistration(user);

    const payload = vi.mocked(registerAccount).mock.calls[0][0];
    expect(payload.name).toBe(NAME);
    expect(payload.email).toBe(EMAIL);
    expect(payload.acceptedTermsVersion).toBe(TERMS_VERSION);
    // Ni vacíos ni de relleno: el backend declara `extra="forbid"`
    expect(payload.documentType).toBeUndefined();
    expect(payload.documentNumber).toBeUndefined();
  });

  it('sad path: con factura marcada, una cédula con letras avisa y no deja pasar', async () => {
    const user = setup();
    open();

    await fillMinimum(user);
    await user.click(invoiceBox());
    await user.type(documentNumber(), '10987ABC');
    await user.click(nextButton());

    expect(await screen.findByText(/solo admite dígitos/i)).toBeTruthy();
    // Sigue en el paso de la cuenta: el freno del correo no llegó a montarse
    expect(screen.queryByLabelText('Corrígelo aquí si hace falta')).toBeNull();
  });

  it('edge: con factura marcada y el número vacío, dice que falta', async () => {
    const user = setup();
    open();

    await fillMinimum(user);
    await user.click(invoiceBox());
    await user.click(nextButton());

    expect(await screen.findByText(/obligatorio/i)).toBeTruthy();
    expect(screen.queryByLabelText('Corrígelo aquí si hace falta')).toBeNull();
  });

  it('edge: desmarcar la factura suelta el documento; no viaja lo que ya no se ve', async () => {
    const user = setup();
    open();

    await fillMinimum(user);
    await user.click(invoiceBox());
    await user.type(documentNumber(), DOCUMENT);
    // Se arrepiente: sin factura, ese número no es asunto nuestro
    await user.click(invoiceBox());

    await finishRegistration(user);

    const payload = vi.mocked(registerAccount).mock.calls[0][0];
    expect(payload.documentNumber).toBeUndefined();
    expect(payload.documentType).toBeUndefined();
  });

  it('contrato: pidiendo factura, el documento viaja con el código DIAN', async () => {
    const user = setup();
    open();

    await fillMinimum(user);
    await user.click(invoiceBox());
    await user.type(documentNumber(), DOCUMENT);

    await finishRegistration(user);

    const payload = vi.mocked(registerAccount).mock.calls[0][0];
    // 13 es cédula de ciudadanía, que es lo que viene preseleccionado
    expect(payload.documentType).toBe('13');
    expect(payload.documentNumber).toBe(DOCUMENT);
  });
});
