import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ApiError } from '../src/utils/api';
import PaymentReturnPage from '../src/modules/promo/page/PaymentReturnPage';
import {
  verifyPurchase,
  type PurchaseResponse,
  type PurchaseVerification,
} from '../src/modules/promo/services/checkout';
import { setupUser } from './testUtils';

/**
 * Vuelta de Mercado Pago (IOP #3).
 *
 * Aterrizar en esta URL no prueba nada: los parámetros los puede escribir
 * cualquiera. Lo que se comprueba aquí es que el editor solo se abre cuando el
 * **servidor** dice `paid`, y que cada forma de no estarlo tiene su mensaje.
 */

vi.mock('../src/modules/promo/services/checkout', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/promo/services/checkout')>()),
  verifyPurchase: vi.fn(),
}));

const PURCHASE_ID = 'pur_abc';
const PAYMENT_ID = '1234567890';

const purchase = (status: PurchaseResponse['status']): PurchaseResponse => ({
  id: PURCHASE_ID,
  status,
  amountCents: 1990000,
  currency: 'COP',
  externalReference: 'ref-abc',
  checkoutUrl: null,
  hasLetter: false,
  paidAt: status === 'paid' ? '2026-02-14T10:00:00Z' : null,
  expiresAt: '2026-02-15T00:00:00Z',
  createdAt: '2026-02-14T09:00:00Z',
});

const verification = (
  status: PurchaseResponse['status'],
  payment: string | null = null,
): PurchaseVerification => ({
  purchase: purchase(status),
  payment: payment ? { status: payment, statusDetail: null } : null,
  canCreateLetter: status === 'paid',
});

/** Doble del editor: enseña el `purchaseId` que le llegó en el estado de la ruta. */
const EditorStub = () => {
  const location = useLocation();
  const state = location.state as { purchaseId?: string } | null;
  return <p>EDITOR:{state?.purchaseId ?? 'sin-compra'}</p>;
};

const arriveFrom = (search: string) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/pago/retorno', search }]}>
      <Routes>
        <Route path="/pago/retorno" element={<PaymentReturnPage />} />
        <Route path="/editor" element={<EditorStub />} />
      </Routes>
    </MemoryRouter>,
  );

describe('PaymentReturnPage', () => {
  it('pago aprobado: lo confirma en el servidor y abre el editor', async () => {
    window.sessionStorage.setItem('checkout:purchaseId', PURCHASE_ID);
    vi.mocked(verifyPurchase).mockResolvedValue(verification('paid', 'approved'));

    arriveFrom(`?payment_id=${PAYMENT_ID}&status=approved`);

    expect(await screen.findByText(`EDITOR:${PURCHASE_ID}`)).toBeTruthy();
    expect(verifyPurchase).toHaveBeenCalledWith(PURCHASE_ID, PAYMENT_ID);
    // La referencia ya cumplió: dejarla puesta invita a reutilizarla.
    expect(window.sessionStorage.getItem('checkout:purchaseId')).toBeNull();
  });

  it('recupera la compra del parámetro cuando la pestaña no la recuerda', async () => {
    vi.mocked(verifyPurchase).mockResolvedValue(verification('paid', 'approved'));

    arriveFrom(`?payment_id=${PAYMENT_ID}&purchaseId=${PURCHASE_ID}`);

    expect(await screen.findByText(`EDITOR:${PURCHASE_ID}`)).toBeTruthy();
  });

  it('sin identificador de pago no gasta un IOP: dice que no se completó', async () => {
    window.sessionStorage.setItem('checkout:purchaseId', PURCHASE_ID);

    arriveFrom('?status=failure');

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('El pago no se completó');
    expect(verifyPurchase).not.toHaveBeenCalled();
  });

  it('sin compra que verificar, lo explica y remite al correo', async () => {
    arriveFrom(`?payment_id=${PAYMENT_ID}`);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('No encontramos la compra');
    expect(verifyPurchase).not.toHaveBeenCalled();
  });

  it('pago pendiente de acreditación: ni editor ni error alarmante', async () => {
    window.sessionStorage.setItem('checkout:purchaseId', PURCHASE_ID);
    vi.mocked(verifyPurchase).mockResolvedValue(verification('pending', 'pending'));

    arriveFrom(`?payment_id=${PAYMENT_ID}`);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('aún no acredita tu pago');
    expect(screen.queryByText(/^EDITOR:/)).toBeNull();
  });

  it('pago rechazado: no abre el editor aunque la URL diga que sí', async () => {
    window.sessionStorage.setItem('checkout:purchaseId', PURCHASE_ID);
    vi.mocked(verifyPurchase).mockResolvedValue(verification('pending', 'rejected'));

    // La URL miente a propósito: `status=approved` sin respaldo del servidor.
    arriveFrom(`?payment_id=${PAYMENT_ID}&status=approved`);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('no quedó aprobado');
    expect(screen.queryByText(/^EDITOR:/)).toBeNull();
  });

  it('si la verificación falla, se puede volver a comprobar', async () => {
    const user = setupUser();
    window.sessionStorage.setItem('checkout:purchaseId', PURCHASE_ID);
    vi.mocked(verifyPurchase).mockRejectedValueOnce(
      new ApiError(503, 'SERVICE_UNAVAILABLE', 'Proveedor caído.'),
    );

    arriveFrom(`?payment_id=${PAYMENT_ID}`);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('no está disponible');

    vi.mocked(verifyPurchase).mockResolvedValue(verification('paid', 'approved'));
    await user.click(screen.getByRole('button', { name: /Volver a comprobar/i }));

    expect(await screen.findByText(`EDITOR:${PURCHASE_ID}`)).toBeTruthy();
    expect(verifyPurchase).toHaveBeenCalledTimes(2);
  });

  it('verifica una sola vez por visita, aunque React monte dos veces', async () => {
    window.sessionStorage.setItem('checkout:purchaseId', PURCHASE_ID);
    vi.mocked(verifyPurchase).mockResolvedValue(verification('paid', 'approved'));

    arriveFrom(`?payment_id=${PAYMENT_ID}`);

    await waitFor(() => expect(verifyPurchase).toHaveBeenCalledTimes(1));
  });
});
