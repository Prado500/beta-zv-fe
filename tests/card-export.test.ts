import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadCardHtml } from '../src/utils/export';
import type { DedicationForm } from '../src/modules/editor/types';

/**
 * El exportador de la carta en HTML: un solo archivo, con las fotos y las
 * flores incrustadas, que abre sin internet. Se prueba lo que sale —el
 * documento y su nombre— y lo que NO pasa: ninguna llamada a la API.
 */

// Las fotos son `blob:` locales; aquí se sustituye la lectura por un `data:` reconocible.
vi.mock('../src/utils/export/media', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/utils/export/media')>()),
  blobToBase64: vi.fn(async (url: string) => `data:image/jpeg;base64,${url.replace(/[^a-z0-9]/gi, '')}`),
}));

vi.mock('../src/utils/export/flowers', () => ({
  encodeFlowerAssets: vi.fn(async () => [
    'data:image/png;base64,FLOR1',
    'data:image/png;base64,FLOR2',
    'data:image/png;base64,FLOR3',
  ]),
}));

const LETTER: DedicationForm = {
  title: 'Feliz Aniversario',
  recipient: 'Ana María',
  recipientEmail: 'sebas@ejemplo.com',
  sender: 'Sebastián',
  message: 'Gracias por cada día a tu lado, mi amor.',
  songUrl: 'https://youtu.be/dQw4w9WgXcQ',
  themeId: 'classic',
  photos: [
    { tempId: 'tmp-1', previewUrl: 'blob:mock/1', fileName: 'uno.jpg', status: 'ready' },
    { tempId: 'tmp-2', previewUrl: 'blob:mock/2', fileName: 'dos.jpg', status: 'ready' },
  ],
};

let saved: { blob: Blob | null; name: string; href: string };

const readBlob = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob);
  });

beforeEach(() => {
  saved = { blob: null, name: '', href: '' };
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    saved.blob = blob as Blob;
    return 'blob:mock/carta';
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    saved.name = this.download;
    saved.href = this.href;
  });
  vi.spyOn(globalThis, 'fetch');
});

afterEach(() => vi.restoreAllMocks());

describe('downloadCardHtml', () => {
  it('produce un HTML autocontenido con la carta, las fotos y las flores incrustadas', async () => {
    await downloadCardHtml(LETTER);

    expect(saved.blob?.type).toBe('text/html');
    const html = await readBlob(saved.blob as Blob);
    expect(html).toContain('<html');
    expect(html).toContain('Feliz Aniversario');
    expect(html).toContain('Ana María');
    expect(html).toContain('Gracias por cada día a tu lado, mi amor.');
    expect(html).toContain('data:image/jpeg;base64,blobmock1');
    expect(html).toContain('data:image/jpeg;base64,blobmock2');
    expect(html).toContain('data:image/png;base64,FLOR1');
    expect(saved.href).toBe('blob:mock/carta');
  });

  it('el nombre del archivo sale del destinatario, sin acentos ni espacios', async () => {
    await downloadCardHtml(LETTER);
    expect(saved.name).toBe('dedicatoria_ana_maria.html');
  });

  it('sin datos usa los textos de respaldo', async () => {
    await downloadCardHtml({ ...LETTER, title: '', recipient: '', sender: '', message: '', songUrl: '', photos: [] });

    const html = await readBlob(saved.blob as Blob);
    expect(html).toContain('Una Carta Especial');
    expect(html).toContain('Tu Persona Especial');
    expect(html).toContain('Alguien que te quiere');
    expect(saved.name).toBe('dedicatoria_tu_persona_especial.html');
  });

  it('escapa lo que escribió la persona: un < en el mensaje no rompe la carta', async () => {
    await downloadCardHtml({ ...LETTER, message: 'Te quiero <mucho> & más' });

    const html = await readBlob(saved.blob as Blob);
    expect(html).toContain('Te quiero &lt;mucho&gt; &amp; más');
    expect(html).not.toContain('<mucho>');
  });

  it('la canción viaja como enlace de YouTube cuando hay una', async () => {
    await downloadCardHtml(LETTER);
    const html = await readBlob(saved.blob as Blob);
    expect(html).toContain('dQw4w9WgXcQ');
  });

  it('no llama a la API: todo se compone en el navegador', async () => {
    await downloadCardHtml(LETTER);
    expect(fetch).not.toHaveBeenCalled();
  });
});

/**
 * El archivo descargado cuenta la misma historia que la previa:
 * sobre -> floración -> frase -> recuerdos -> estallido -> carta.
 */
describe('los momentos de la carta descargada', () => {
  it('la floración de tallos viaja lista para arrancar, con su pasto', async () => {
    await downloadCardHtml(LETTER);
    const html = await readBlob(saved.blob as Blob);

    expect(html).toContain('id="bloom-scene"');
    // 18 tallos entre las tres filas, y el pasto de la escena
    expect(html.match(/class="bloom-stem"/g)).toHaveLength(18);
    expect(html.match(/class="bloom-blade"/g)?.length).toBeGreaterThan(20);
    // Quieta hasta que el guion la encienda
    expect(html).toContain('.bloom-scene.is-running');
  });

  it('la frase suspendida es la primera del mensaje, palabra por palabra', async () => {
    await downloadCardHtml(LETTER);
    const html = await readBlob(saved.blob as Blob);

    expect(html).toContain('id="tpl-phrase"');
    expect(html).toContain('class="phrase-scene__word"');
    // La frase corta en el primer punto: lo que sigue no entra
    expect(html).toContain('>lado,</span>');
    expect(html).not.toContain('>mejor</span>');
  });

  it('los recuerdos llevan una foto por tarjeta y su sitio en el abanico', async () => {
    await downloadCardHtml(LETTER);
    const html = await readBlob(saved.blob as Blob);

    expect(html).toContain('id="tpl-memories"');
    expect(html.match(/data-mem="\d"/g)).toHaveLength(LETTER.photos.length);
    expect(html).toContain('data-fan=');
    expect(html).toContain('id="tpl-mem-burst"');
  });

  it('sin fotos no hay recuerdos que descubrir', async () => {
    await downloadCardHtml({ ...LETTER, photos: [] });
    const html = await readBlob(saved.blob as Blob);

    expect(html).not.toContain('id="tpl-memories"');
    // La floración sí: esa no depende de que haya fotos
    expect(html).toContain('id="bloom-scene"');
  });

  it('el estallido de flores es el último momento, no el primero', async () => {
    await downloadCardHtml(LETTER);
    const html = await readBlob(saved.blob as Blob);

    expect(html).toContain('[data-state="burst"] .bloom');
    expect(html).not.toContain('[data-state="blooming"] .bloom');
  });
});

describe('la música de la carta descargada', () => {
  it('el marco de YouTube se ve: nada de opacidad al 1% ni medidas de un píxel', async () => {
    await downloadCardHtml(LETTER);
    const html = await readBlob(saved.blob as Blob);

    expect(html).toContain('id="music-frame"');
    expect(html).toContain('aspect-ratio: 16 / 9');
    expect(html).not.toContain('opacity: 0.01');
  });

  it('la dirección va en data-src: el guion le añade el origin que YouTube exige', async () => {
    await downloadCardHtml(LETTER);
    const html = await readBlob(saved.blob as Blob);

    expect(html).toContain('data-src="https://www.youtube.com/embed/dQw4w9WgXcQ?');
    expect(html).toContain('enablejsapi=1');
    // Sin `src` fijo: abierto desde el disco no hay origen válido y ni se carga
    expect(html).not.toMatch(/id="music-frame"[\s\S]{0,200}\ssrc="/);
  });

  it('sin canción no se imprime el módulo de música', async () => {
    await downloadCardHtml({ ...LETTER, songUrl: '' });
    const html = await readBlob(saved.blob as Blob);

    expect(html).not.toContain('id="music-frame"');
  });
});
