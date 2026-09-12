import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import LandingPage from '../src/modules/promo/page/LandingPage';
import { ANONYMOUS } from '../src/modules/auth/AuthContext';
import { ApiError } from '../src/utils/api';
import { redirectTo } from '../src/utils/navigation';
import { createPurchase, type PurchaseResponse } from '../src/modules/promo/services/checkout';
import { renderAt, setupUser, signedIn } from './testUtils';

/**
 * El botón de compra de la landing tras el rediseño: cambió el texto, no el
 * camino. Sigue abriendo el mismo modal de compra, con la sesión que haya en
 * ese momento, y la cabecera sigue abriéndolo en su modo de entrar.
 */

vi.mock('../src/modules/promo/services/checkout', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/promo/services/checkout')>()),
  createPurchase: vi.fn(),
}));

vi.mock('../src/utils/navigation', () => ({ redirectTo: vi.fn() }));

const PURCHASE: PurchaseResponse = {
  id: 'pur_landing',
  status: 'pending',
  amountCents: 3000000,
  currency: 'COP',
  externalReference: 'ref-landing',
  checkoutUrl: 'https://sandbox.mercadopago.com.co/checkout/v1/redirect?pref_id=landing',
  hasLetter: false,
  paidAt: null,
  expiresAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
};

const GATEWAY_DOWN = new ApiError(503, 'SERVICE_UNAVAILABLE', 'Mercado Pago no responde.');

const buyButton = () => screen.getByRole('button', { name: /Asegurar Mi Código Único/ });
const dialogs = () => screen.queryAllByRole('dialog');

// jsdom no trae IntersectionObserver y el contador de cupos lo usa al montarse.
beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.mocked(createPurchase).mockReset();
  vi.mocked(redirectTo).mockReset();
});

afterEach(() => vi.unstubAllGlobals());

describe('Landing · el botón de compra abre el modal de siempre', () => {
  it('sin sesión, "Asegurar Mi Código Único" abre la compra por la puerta de la cuenta', async () => {
    const user = setupUser();
    renderAt(<LandingPage />, { auth: ANONYMOUS });

    expect(dialogs()).toHaveLength(0);
    await user.click(buyButton());

    expect(dialogs()).toHaveLength(1);
    expect(screen.getByRole('heading', { name: /Crea tu\s+cuenta/ })).toBeTruthy();
    expect(createPurchase).not.toHaveBeenCalled();
  });

  it('"Iniciar sesión" de la cabecera abre el mismo modal, pero para entrar', async () => {
    const user = setupUser();
    renderAt(<LandingPage />, { auth: ANONYMOUS });

    await user.click(screen.getAllByRole('button', { name: /Iniciar sesión/ })[0]);

    expect(dialogs()).toHaveLength(1);
    expect(screen.getByRole('heading', { name: /Inicia\s+sesión/ })).toBeTruthy();
  });

  it('con sesión salta al paso exprés y dos clics seguidos crean una sola compra', async () => {
    const user = setupUser();
    vi.mocked(createPurchase).mockResolvedValue(PURCHASE);
    renderAt(<LandingPage />, { auth: signedIn() });

    await user.click(buyButton());
    await user.click(buyButton());

    expect(dialogs()).toHaveLength(1);
    expect(screen.getByRole('heading', { name: /Preparando tu\s+pago/ })).toBeTruthy();
    await waitFor(() => expect(redirectTo).toHaveBeenCalledWith(PURCHASE.checkoutUrl));
    expect(createPurchase).toHaveBeenCalledTimes(1);
  });

  it('si la pasarela falla con 503, el modal lo dice, ofrece reintentar y no manda a ningún sitio', async () => {
    const user = setupUser();
    vi.mocked(createPurchase).mockRejectedValue(GATEWAY_DOWN);
    renderAt(<LandingPage />, { auth: signedIn() });

    await user.click(buyButton());

    expect(await screen.findByRole('button', { name: /Reintentar/ })).toBeTruthy();
    expect(dialogs()).toHaveLength(1);
    expect(redirectTo).not.toHaveBeenCalled();
  });

  it('cerrar el modal lo desmonta, y al volver a abrirlo empieza limpio desde el primer paso', async () => {
    const user = setupUser();
    renderAt(<LandingPage />, { auth: ANONYMOUS });

    await user.click(buyButton());
    await user.type(screen.getByLabelText('Tu nombre'), 'Sebastián');
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(dialogs()).toHaveLength(0);

    await user.click(buyButton());
    expect(screen.getByRole('heading', { name: /Crea tu\s+cuenta/ })).toBeTruthy();
    expect((screen.getByLabelText('Tu nombre') as HTMLInputElement).value).toBe('');

    await user.keyboard('{Escape}');
    expect(dialogs()).toHaveLength(0);
  });
});
