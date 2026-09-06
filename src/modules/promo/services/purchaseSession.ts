/**
 * Memoria de la compra mientras el usuario está fuera, en Mercado Pago.
 *
 * La vuelta de la pasarela es una navegación completa: React se desmonta y todo
 * el estado en memoria se pierde. Sin este apunte, al regresar no sabríamos qué
 * compra verificar (IOP #3) y el pago quedaría cobrado y sin carta.
 *
 * Es `sessionStorage` y no `localStorage` a propósito: la referencia muere con
 * la pestaña. Guardar el identificador de una compra pagada en un almacén que
 * sobrevive al navegador es dejar una llave puesta en la cerradura.
 *
 * Guarda un identificador, no una autorización: quien decide si la compra está
 * pagada es siempre el servidor.
 */

const KEY = 'checkout:purchaseId';

const storage = (): Storage | null => {
  try {
    return window.sessionStorage;
  } catch {
    // Modo privado de Safari y navegadores con almacenamiento bloqueado.
    return null;
  }
};

export const rememberPurchaseId = (purchaseId: string): void => {
  try {
    storage()?.setItem(KEY, purchaseId);
  } catch {
    /* Sin almacenamiento el flujo sigue: la vuelta usará el parámetro de la URL. */
  }
};

export const recallPurchaseId = (): string | null => {
  try {
    return storage()?.getItem(KEY) ?? null;
  } catch {
    return null;
  }
};

export const forgetPurchaseId = (): void => {
  try {
    storage()?.removeItem(KEY);
  } catch {
    /* Nada que limpiar. */
  }
};
