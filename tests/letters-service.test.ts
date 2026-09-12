import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiPostResult, apiUrl } from '../src/utils/api';
import { createLetter, publicQrPath } from '../src/modules/editor/services/letters';
import type { DedicationForm } from '../src/modules/editor/types';

/**
 * Traducción de la respuesta de `POST /api/v1/letters` a lo que pinta la interfaz.
 *
 * El QR es el punto delicado: el backend manda un `qrUrl` construido sobre el
 * origen del frontend y contra un endpoint con sesión, que un `<img>` no puede
 * cargar. El servicio debe ignorarlo y pedir siempre el QR público por slug.
 */

vi.mock('../src/utils/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/utils/api')>()),
  apiPostResult: vi.fn(),
}));

const FORM: DedicationForm = {
  title: 'Feliz Aniversario',
  recipient: 'Ana María',
  recipientEmail: 'sebas@ejemplo.com',
  sender: 'Sebastián',
  message: 'Gracias por cada día a tu lado, mi amor.',
  songUrl: 'https://youtu.be/dQw4w9WgXcQ',
  themeId: 'pastelPink',
  photos: [
    { tempId: 'tmp_1', previewUrl: 'blob:mock/1', fileName: 'uno.jpg', status: 'ready' },
    { tempId: null, previewUrl: 'blob:mock/2', fileName: 'dos.jpg', status: 'uploading' },
    { tempId: null, previewUrl: 'blob:mock/3', fileName: 'tres.jpg', status: 'error' },
  ],
};

/** Cuerpo del 201 tal como lo construye `_letter_payload` en el backend. */
const CREATED = {
  id: '11111111-2222-3333-4444-555555555555',
  publicSlug: 'ana-maria-x1',
  publicUrl: 'https://front.test/carta/ana-maria-x1',
  qrUrl: 'https://front.test/api/v1/letters/11111111-2222-3333-4444-555555555555/qr.png',
};

const respond = (status: number, data: unknown) =>
  vi.mocked(apiPostResult).mockResolvedValue({ status, data });

describe('createLetter', () => {
  beforeEach(() => vi.mocked(apiPostResult).mockReset());

  it('201 con slug: enlace del backend y QR del endpoint público, nunca el qrUrl recibido', async () => {
    respond(201, CREATED);

    const outcome = await createLetter('pur_1', FORM);

    expect(outcome).toEqual({
      mode: 'ready',
      publicUrl: CREATED.publicUrl,
      qrUrl: apiUrl(publicQrPath(CREATED.publicSlug)),
      message: '',
    });
    expect(outcome.mode === 'ready' ? outcome.qrUrl : null).not.toBe(CREATED.qrUrl);
  });

  it('201 solo con publicUrl: el slug se saca del enlace', async () => {
    respond(201, { publicUrl: 'https://front.test/carta/solo-enlace?x=1' });

    const outcome = await createLetter('pur_1', FORM);

    expect(outcome.mode).toBe('ready');
    expect(outcome.mode === 'ready' ? outcome.qrUrl : null).toBe(
      apiUrl(publicQrPath('solo-enlace')),
    );
  });

  it('201 sin enlace ni slug se trata como encolada: no hay nada que enseñar', async () => {
    respond(201, { id: 'x', message: 'Creada.' });
    expect(await createLetter('pur_1', FORM)).toEqual({ mode: 'queued', message: 'Creada.' });
  });

  it('202 es encolada con el mensaje del backend', async () => {
    respond(202, { status: 'queued', purchaseId: 'pur_1', message: 'En cola.' });
    expect(await createLetter('pur_1', FORM)).toEqual({ mode: 'queued', message: 'En cola.' });
  });

  it('manda el tema en kebab-case y solo las fotos ya subidas', async () => {
    respond(201, CREATED);

    await createLetter('pur_1', FORM);

    expect(apiPostResult).toHaveBeenCalledWith('/api/v1/letters', {
      purchaseId: 'pur_1',
      title: 'Feliz Aniversario',
      recipientName: 'Ana María',
      recipientEmail: 'sebas@ejemplo.com',
      body:
        'Gracias por cada día a tu lado, mi amor.\n\nDe parte de: Sebastián\n\nCanción: https://youtu.be/dQw4w9WgXcQ',
      theme: 'pastel-pink',
      temp_photos: [{ tempId: 'tmp_1', fileName: 'uno.jpg' }],
    });
  });
});
