import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import {
  createLetter,
  uploadEagerPhoto,
  type EagerPhoto,
} from '../src/modules/editor/services/letters';
import {
  PURCHASE_ID,
  confirmButton,
  fillStepOne,
  goToStepTwo,
  renderEditor,
  submitButton,
} from './editorHarness';
import { deferred, setupUser } from './testUtils';

/**
 * Subida anticipada de fotos (IOP #4).
 *
 * La foto sale hacia el servidor al elegirla, no al enviar la carta. Lo que se
 * comprueba aquí es el trato completo: se ve al instante (con la copia local),
 * viaja sola, y hasta que no ha llegado no se deja enviar la carta —si se
 * enviara antes, el backend movería una foto que todavía no existe.
 */

vi.mock('../src/modules/editor/components/PhonePreview', () => ({
  PhonePreview: () => null,
}));

// jsdom no decodifica imágenes: el compresor real se quedaría esperando un
// `onload` que nunca llega. Lo que se prueba aquí es la subida, no el canvas.
vi.mock('../src/utils/compressImage', () => ({
  compressImage: vi.fn(async (file: File) => ({ blob: file, originalSize: file.size })),
}));

vi.mock('../src/modules/editor/services/letters', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/editor/services/letters')>()),
  createLetter: vi.fn(),
  uploadEagerPhoto: vi.fn(),
}));

const QUEUED = { mode: 'queued', message: 'En cola.' } as const;

const photo = (name = 'nosotros.jpg') =>
  new File(['contenido-de-la-foto'], name, { type: 'image/jpeg' });

const stored = (tempId: string, fileName = 'nosotros.jpg'): EagerPhoto => ({
  tempId,
  fileName,
  contentType: 'image/jpeg',
  byteSize: 20,
});

const fileInput = () => screen.getByLabelText('Subir fotos');

describe('EditorPage · subida anticipada de fotos', () => {
  it('elegir una foto la sube en caliente, sin esperar al envío', async () => {
    const user = setupUser();
    vi.mocked(uploadEagerPhoto).mockResolvedValue(stored('tmp-1'));

    renderEditor();
    await goToStepTwo(user);
    await user.upload(fileInput(), photo());

    await waitFor(() => expect(uploadEagerPhoto).toHaveBeenCalledTimes(1));
    // La miniatura se pinta con la copia local: el contenedor del servidor es
    // privado y no devuelve ninguna URL que se pueda mostrar.
    const preview = await screen.findByAltText('nosotros.jpg');
    expect(preview.getAttribute('src')).toMatch(/^blob:/);
  });

  it('mientras la foto sube, el envío queda bloqueado y lo dice', async () => {
    const user = setupUser();
    const pending = deferred<EagerPhoto>();
    vi.mocked(uploadEagerPhoto).mockReturnValue(pending.promise);

    renderEditor();
    await fillStepOne(user);
    await goToStepTwo(user);
    await user.upload(fileInput(), photo());
    await waitFor(() => expect(screen.getAllByText(/Subiendo a la nube/i).length).toBeGreaterThan(0));

    await user.click(screen.getByRole('button', { name: /Siguiente/i }));

    await waitFor(() => expect(submitButton().disabled).toBe(true));
    expect(submitButton().textContent).toContain('Esperando las fotos');

    pending.resolve(stored('tmp-1'));
    await waitFor(() => expect(submitButton().disabled).toBe(false));
  });

  it('cuando termina, el tempId viaja dentro del formulario', async () => {
    const user = setupUser();
    vi.mocked(uploadEagerPhoto).mockResolvedValue(stored('tmp-42'));
    vi.mocked(createLetter).mockResolvedValue(QUEUED);

    renderEditor();
    await fillStepOne(user);
    await goToStepTwo(user);
    await user.upload(fileInput(), photo());
    await waitFor(() => expect(uploadEagerPhoto).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /Siguiente/i }));
    await waitFor(() => expect(submitButton().disabled).toBe(false));
    await user.click(submitButton());
    await screen.findByRole('dialog');
    await user.click(confirmButton());

    await waitFor(() =>
      expect(createLetter).toHaveBeenCalledWith(
        PURCHASE_ID,
        expect.objectContaining({
          photos: [
            expect.objectContaining({ tempId: 'tmp-42', status: 'ready', fileName: 'nosotros.jpg' }),
          ],
        }),
      ),
    );
  });

  it('si una foto no sube, se marca y la carta sale sin ella', async () => {
    const user = setupUser();
    vi.mocked(uploadEagerPhoto).mockRejectedValue(new Error('sin red'));
    vi.mocked(createLetter).mockResolvedValue(QUEUED);

    renderEditor();
    await fillStepOne(user);
    await goToStepTwo(user);
    await user.upload(fileInput(), photo());

    await waitFor(() => expect(screen.getByText(/No subió; quítala/i)).toBeTruthy());
    // Una foto fallida no bloquea el envío: lo que bloquea es una en vuelo.
    await user.click(screen.getByRole('button', { name: /Siguiente/i }));
    expect(submitButton().disabled).toBe(false);
  });

  it('quitar una foto la saca del formulario', async () => {
    const user = setupUser();
    vi.mocked(uploadEagerPhoto).mockResolvedValue(stored('tmp-1'));

    renderEditor();
    await goToStepTwo(user);
    await user.upload(fileInput(), photo());
    await screen.findByAltText('nosotros.jpg');

    await user.click(screen.getByRole('button', { name: /Quitar nosotros.jpg/i }));

    await waitFor(() => expect(screen.queryByAltText('nosotros.jpg')).toBeNull());
  });

  it('pasarse del máximo avisa y no sube nada', async () => {
    const user = setupUser();
    vi.mocked(uploadEagerPhoto).mockResolvedValue(stored('tmp-1'));

    renderEditor();
    await goToStepTwo(user);
    await user.upload(
      fileInput(),
      Array.from({ length: 6 }, (_, i) => photo(`foto-${i}.jpg`)),
    );

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('máximo de 5 fotos');
    expect(uploadEagerPhoto).not.toHaveBeenCalled();
  });
});
