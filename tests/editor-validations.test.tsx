import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { fillStepOne, renderEditor } from './editorHarness';
import { setupUser } from './testUtils';

/**
 * Validación fail-fast del editor.
 *
 * El contrato con el usuario es que se entera en la tecla, no al enviar: rojo en
 * cuanto algo está mal, verde en cuanto lo arregla. Estas pruebas escriben letra
 * a letra con `userEvent` y miran el DOM, que es lo que la persona ve.
 */

// La maqueta del móvil no aporta nada aquí y arrastra medio megabyte de flores.
vi.mock('../src/modules/editor/components/PhonePreview', () => ({
  PhonePreview: () => null,
}));

vi.mock('../src/modules/editor/services/letters', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/editor/services/letters')>()),
  createLetter: vi.fn(),
  uploadEagerPhoto: vi.fn(),
}));

describe('EditorPage · validaciones en vivo', () => {
  it('un nombre con números se marca en rojo mientras se escribe', async () => {
    const user = setupUser();
    renderEditor();

    const recipient = screen.getByLabelText('Para quién es');
    await user.type(recipient, 'Ana123');

    await waitFor(() => expect(recipient.getAttribute('aria-invalid')).toBe('true'));
    expect(recipient.className).toContain('border-error');
    expect(screen.getByText(/Solo letras, espacios y guiones/i)).toBeTruthy();
  });

  it('al corregir el nombre el borde pasa a verde y el aviso desaparece', async () => {
    const user = setupUser();
    renderEditor();

    const recipient = screen.getByLabelText('Para quién es');
    await user.type(recipient, 'Ana123');
    await waitFor(() => expect(recipient.className).toContain('border-error'));

    await user.clear(recipient);
    await user.type(recipient, 'Ana María');

    await waitFor(() => expect(recipient.getAttribute('aria-invalid')).toBe('false'));
    expect(recipient.className).toMatch(/border-emerald/);
    expect(screen.queryByText(/Solo letras, espacios y guiones/i)).toBeNull();
  });

  it('el remitente tampoco admite símbolos raros', async () => {
    const user = setupUser();
    renderEditor();

    const sender = screen.getByLabelText('De parte de');
    await user.type(sender, 'Seb@stian');

    await waitFor(() => expect(sender.getAttribute('aria-invalid')).toBe('true'));
    expect(sender.className).toContain('border-error');
  });

  /*
   * El correo ya no está en el asistente: se pide en la última pantalla, la
   * del freno, y su aviso se comprueba allí (`editor-double-check`).
   */
  it('el asistente ya no pregunta el correo: eso pasa al final', () => {
    renderEditor();
    expect(screen.queryByLabelText(/Tu correo/i)).toBeNull();
  });

  it('un título de una letra avisa y deja de avisar al completarlo', async () => {
    const user = setupUser();
    renderEditor();

    const title = screen.getByLabelText('Título de la carta');
    await user.type(title, 'Fe');
    await waitFor(() => expect(screen.getByText(/al menos 3 caracteres/i)).toBeTruthy());

    await user.type(title, 'liz Aniversario');
    await waitFor(() => expect(screen.queryByText(/al menos 3 caracteres/i)).toBeNull());
    expect(title.className).toMatch(/border-emerald/);
  });

  it('el enlace de la canción solo se acepta si es de YouTube', async () => {
    const user = setupUser();
    renderEditor();

    await user.click(screen.getByRole('button', { name: /Siguiente/i }));

    const song = screen.getByLabelText(/Enlace de Canción/i);
    await user.type(song, 'https://ejemplo.com/cancion');
    await waitFor(() => expect(song.getAttribute('aria-invalid')).toBe('true'));

    await user.clear(song);
    await user.type(song, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await waitFor(() => expect(song.getAttribute('aria-invalid')).toBe('false'));
  });

  it('un formulario completo y correcto no deja ni un campo en rojo', async () => {
    const user = setupUser();
    const { container } = renderEditor();

    await fillStepOne(user);

    await waitFor(() => expect(container.querySelectorAll('[aria-invalid="true"]').length).toBe(0));
    expect(container.querySelectorAll('[class*="border-emerald"]').length).toBeGreaterThan(0);
  });
});
