import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import EditorPage from '../src/modules/editor/page/EditorPage';
import { CONFIRM_DELAY_SECONDS } from '../src/modules/editor/components/EmailConfirmModal';
import { asButton, renderAt, setupUser } from './testUtils';

/**
 * Andamio compartido por las pruebas del editor.
 *
 * Rellenar el paso 1 y llegar al botón de enviar es la mitad de cada caso; si
 * cada archivo lo escribe a su manera, cambiar una etiqueta rompe cinco pruebas
 * por motivos que no tienen nada que ver con lo que estaban comprobando.
 *
 * La confirmación del correo lleva un freno de tres segundos. Las suites que
 * pasan por ella instalan un reloj falso que sigue corriendo solo —lo que
 * necesitan `userEvent` y `waitFor`— y saltan el freno con `confirm`.
 */

export const PURCHASE_ID = 'pur_test_1';

export const VALID_LETTER = {
  title: 'Feliz Aniversario',
  recipient: 'Ana María',
  email: 'sebas@ejemplo.com',
  sender: 'Sebastián',
  message: 'Gracias por cada día a tu lado, mi amor.',
};

/** El editor exige una compra pagada; llega en el estado de la ruta. */
export const renderEditor = () =>
  renderAt(<EditorPage />, { path: '/editor', state: { purchaseId: PURCHASE_ID } });

/**
 * El correo ya no vive en el asistente: se pide en la última pantalla, la del
 * freno. Por eso este campo solo existe con ese modal abierto.
 */
export const emailField = () => screen.getByLabelText(/Tu correo \(o donde quieras/i);

export const fillStepOne = async (
  user: ReturnType<typeof setupUser>,
  overrides: Partial<typeof VALID_LETTER> = {},
) => {
  const data = { ...VALID_LETTER, ...overrides };
  await user.type(screen.getByLabelText('Título de la carta'), data.title);
  await user.type(screen.getByLabelText('Para quién es'), data.recipient);
  await user.type(screen.getByLabelText('De parte de'), data.sender);
  await user.type(screen.getByLabelText('Tu Mensaje'), data.message);
};

/** Escribe el correo dentro del modal, que es donde se pide ahora. */
export const typeEmail = async (
  user: ReturnType<typeof setupUser>,
  address: string = VALID_LETTER.email,
) => {
  await user.clear(emailField());
  await user.type(emailField(), address);
};

/** El botón de enviar solo existe en el paso 3, como para el usuario. */
export const goToStepThree = async (user: ReturnType<typeof setupUser>) => {
  await user.click(screen.getByRole('button', { name: /Siguiente/i }));
  await user.click(screen.getByRole('button', { name: /Siguiente/i }));
};

export const goToStepTwo = async (user: ReturnType<typeof setupUser>) => {
  await user.click(screen.getByRole('button', { name: /Siguiente/i }));
};

export const submitButton = () =>
  asButton(
    screen.getByRole('button', {
      name: /Guardar y compartir|Enviando…|Esperando las fotos/i,
    }),
  );

/** El botón de confirmar, en cualquiera de sus tres caras: freno, listo o enviando. */
/** El botón de "Continuar": cierra el paso de escribir y abre el de verificar. */
export const continueButton = () => asButton(screen.getByRole('button', { name: /^Continuar/i }));

/** El botón de enviar, en sus tres caras: freno, listo o enviando. */
export const confirmButton = () =>
  asButton(screen.getByRole('button', { name: /Sí, es correcto|Enviando tu carta|Espera \d/i }));

/* ---------- El freno de la confirmación ---------- */

export const CONFIRM_DELAY_MS = CONFIRM_DELAY_SECONDS * 1000;

/**
 * Reloj falso para toda la suite. `shouldAdvanceTime` deja que el tiempo siga
 * corriendo solo, así `waitFor` y `userEvent` no se quedan esperando un reloj
 * parado; el freno se salta a voluntad con `passFreeze`.
 */
export const installFreezeClock = () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
};

/** `userEvent` programa sus propios temporizadores: con el reloj falso hay que avanzarlos. */
export const setupEditorUser = () => setupUser({ advanceTimers: vi.advanceTimersByTime });

/** Deja pasar los tres segundos del freno. */
export const passFreeze = () =>
  act(() => {
    vi.advanceTimersByTime(CONFIRM_DELAY_MS);
  });

/** Escribe el correo y pasa al paso de verificar, donde vive el freno. */
export const goToVerify = async (
  user: ReturnType<typeof setupUser>,
  address: string = VALID_LETTER.email,
) => {
  await typeEmail(user, address);
  await user.click(continueButton());
};

/** El camino entero: escribir, verificar, esperar el freno y enviar. */
export const confirm = async (
  user: ReturnType<typeof setupUser>,
  address: string = VALID_LETTER.email,
) => {
  await goToVerify(user, address);
  passFreeze();
  await user.click(confirmButton());
};
