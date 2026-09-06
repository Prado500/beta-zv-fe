import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../../../utils/api';
import {
  createPurchase,
  formatPrice,
  login,
  MIN_PASSWORD,
  newIdempotencyKey,
  register,
  verifyPurchase,
  type PurchaseResponse,
} from '../../services/checkout';
import { Ornament, CornerFlourish } from '../../../../components/decor';

/**
 * Compra en tres pasos: cuenta, pasarela y desbloqueo del editor.
 *
 * El editor se abre **solo** cuando el backend confirma `status: 'paid'`; el
 * `purchaseId` viaja en el estado de la ruta, no en `localStorage`, porque es la
 * llave de una compra pagada y no debe sobrevivir a la pestaña.
 *
 * El paso de pago simula lo que hará Mercado Pago: el navegador aporta el
 * identificador del pago y el servidor decide si vale. Cuando la pasarela real
 * entre, este botón se sustituye por la redirección a `checkoutUrl` y la vuelta
 * llama exactamente al mismo `verifyPurchase`.
 */

/** Pago aprobado en el proveedor de pruebas del backend. */
const SIMULATED_PAYMENT_ID = '900001';

type Stage = 'account' | 'payment' | 'paid';

interface PurchaseModalProps {
  open: boolean;
  onClose: () => void;
}

const FIELD =
  'w-full bg-paper/60 border border-wine/15 rounded-xl px-4 py-3 outline-none transition-all focus:border-wine focus:bg-white focus:ring-2 focus:ring-wine/15';

const LABEL = 'block text-[11px] font-bold text-wine/75 uppercase tracking-wider mb-1.5';

export const PurchaseModal: React.FC<PurchaseModalProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('account');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [purchase, setPurchase] = useState<PurchaseResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstField = useRef<HTMLInputElement>(null);
  /** Misma clave mientras dure el intento: dos clics no crean dos compras. */
  const idempotencyKey = useRef<string>(newIdempotencyKey());

  useEffect(() => {
    if (open) firstField.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const change = (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [event.target.name]: event.target.value });

  const describe = (problem: unknown): string => {
    if (problem instanceof ApiError) {
      if (problem.code === 'EMAIL_IN_USE' || problem.code === 'INVALID_CREDENTIALS') {
        return 'Ese correo ya tiene cuenta y la contraseña no coincide. Usa otro correo o la contraseña correcta.';
      }
      return problem.message;
    }
    return 'No pudimos completar la operación. Intenta de nuevo.';
  };

  /** Registro + sesión + intención de compra, en una sola pasada. */
  const startPurchase = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.password.length < MIN_PASSWORD) {
      setError(`La contraseña necesita al menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      try {
        await register({ name: form.name, email: form.email, password: form.password });
      } catch (problem) {
        // Cuenta ya existente: se intenta sesión con las mismas credenciales antes
        // de dar el intento por perdido.
        if (!(problem instanceof ApiError) || problem.status !== 409) throw problem;
      }
      await login(form.email, form.password);
      setPurchase(await createPurchase(idempotencyKey.current));
      setStage('payment');
    } catch (problem) {
      setError(describe(problem));
    } finally {
      setBusy(false);
    }
  };

  /** Simula la vuelta de la pasarela: el servidor es quien confirma el pago. */
  const simulatePayment = async () => {
    if (!purchase) return;
    setBusy(true);
    setError(null);
    try {
      const result = await verifyPurchase(purchase.id, SIMULATED_PAYMENT_ID);
      if (result.purchase.status !== 'paid') {
        setError('El pago no quedó aprobado. Intenta de nuevo en unos segundos.');
        return;
      }
      setStage('paid');
      // El editor necesita saber qué compra está habilitando su carta.
      navigate('/editor', { state: { purchaseId: result.purchase.id }, replace: false });
    } catch (problem) {
      setError(describe(problem));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center px-4 py-8 bg-wine-deep/45 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-title"
      onClick={() => !busy && onClose()}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-4xl shadow-2xl border border-wine/15 p-7 md:p-8 overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-wine-deep via-wine to-tertiary" />
        <CornerFlourish corner="tl" tone="gold" size={56} className="opacity-60" />
        <CornerFlourish corner="br" tone="gold" size={56} className="opacity-60" />

        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-wine/60 hover:text-wine transition-colors disabled:opacity-40 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="text-center mb-5">
          <h2 id="purchase-title" className="font-headline-md text-xl font-bold text-on-background">
            {stage === 'account' ? (
              <>
                Crea tu{' '}
                <span className="font-script font-normal text-wine text-[1.6em] leading-none">
                  cuenta
                </span>
              </>
            ) : (
              <>
                Confirma tu{' '}
                <span className="font-script font-normal text-wine text-[1.6em] leading-none">
                  pago
                </span>
              </>
            )}
          </h2>
          <Ornament tone="gold" width={140} className="mx-auto mt-1" />
        </div>

        {stage === 'account' && (
          <form onSubmit={startPurchase} className="flex flex-col gap-4">
            <div>
              <label className={LABEL} htmlFor="buy-name">
                Tu nombre
              </label>
              <input
                id="buy-name"
                ref={firstField}
                name="name"
                value={form.name}
                onChange={change}
                required
                maxLength={120}
                autoComplete="name"
                placeholder="Sebastián"
                className={FIELD}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="buy-email">
                Tu correo
              </label>
              <input
                id="buy-email"
                type="email"
                name="email"
                value={form.email}
                onChange={change}
                required
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
                className={FIELD}
              />
              <p className="text-xs text-wine/60 mt-1.5">
                Aquí te llegará el enlace de tu carta cuando esté lista.
              </p>
            </div>
            <div>
              <label className={LABEL} htmlFor="buy-password">
                Contraseña
              </label>
              <input
                id="buy-password"
                type="password"
                name="password"
                value={form.password}
                onChange={change}
                required
                minLength={MIN_PASSWORD}
                maxLength={128}
                autoComplete="new-password"
                placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
                className={FIELD}
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-1 w-full py-3.5 rounded-full bg-wine text-white font-semibold text-sm shadow-lg hover:bg-primary transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-wait disabled:opacity-70"
            >
              {busy ? 'Creando tu compra…' : 'Continuar al pago'}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </form>
        )}

        {stage !== 'account' && purchase && (
          <div className="flex flex-col gap-4 text-center">
            <div className="bg-paper/70 rounded-2xl px-5 py-4 ring-1 ring-wine/10">
              <p className="text-[11px] font-bold text-wine/70 uppercase tracking-wider">Total</p>
              <p className="text-3xl font-bold text-wine mt-0.5">
                {formatPrice(purchase.amountCents, purchase.currency)}
              </p>
              <p className="text-[11px] text-wine/55 mt-1">
                Referencia {purchase.externalReference}
              </p>
            </div>

            <button
              type="button"
              onClick={simulatePayment}
              disabled={busy || stage === 'paid'}
              className="w-full py-3.5 rounded-full bg-[#009ee3] text-white font-semibold text-sm shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-wait disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-[18px]">credit_card</span>
              {stage === 'paid'
                ? 'Pago aprobado, abriendo el editor…'
                : busy
                  ? 'Confirmando con el proveedor…'
                  : 'Simular Pago en Mercado Pago'}
            </button>

            <p className="text-xs text-wine/60 leading-relaxed">
              El pago lo confirma el servidor contra el proveedor: volver del checkout no
              basta para desbloquear la carta.
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-error text-center mt-4" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
