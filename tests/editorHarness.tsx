import { screen } from '@testing-library/react';
import EditorPage from '../src/modules/editor/page/EditorPage';
import { asButton, renderAt, setupUser } from './testUtils';

/**
 * Andamio compartido por las pruebas del editor.
 *
 * Rellenar el paso 1 y llegar al botón de enviar es la mitad de cada caso; si
 * cada archivo lo escribe a su manera, cambiar una etiqueta rompe cinco pruebas
 * por motivos que no tienen nada que ver con lo que estaban comprobando.
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

export const emailField = () => screen.getByLabelText(/Tu correo \(o el correo/i);

export const fillStepOne = async (
  user: ReturnType<typeof setupUser>,
  overrides: Partial<typeof VALID_LETTER> = {},
) => {
  const data = { ...VALID_LETTER, ...overrides };
  await user.type(screen.getByLabelText('Título de la carta'), data.title);
  await user.type(screen.getByLabelText('Para quién es'), data.recipient);
  await user.type(emailField(), data.email);
  await user.type(screen.getByLabelText('De parte de'), data.sender);
  await user.type(screen.getByLabelText('Tu Mensaje'), data.message);
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

export const confirmButton = () =>
  asButton(screen.getByRole('button', { name: /Sí, es correcto|Enviando tu carta/i }));
