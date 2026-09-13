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

/**
 * Lo que hace falta para que la carta descargada sirva en un teléfono, que es
 * donde se abre casi siempre.
 */
describe('la carta descargada en el móvil', () => {
  it('mide la pantalla con dvh, no solo con vh', async () => {
    await downloadCardHtml(LETTER);
    const html = await readBlob(saved.blob as Blob);

    /*
     * En el móvil 100vh es la pantalla CON la barra del navegador retraída. Con
     * la barra delante, el fondo del teléfono caía fuera y no había forma de
     * llegar al final de la carta. `dvh` va DESPUÉS de `vh`, nunca en su lugar:
     * quien no lo entienda se queda con la primera.
     */
    expect(html).toContain('height: 100vh;');
    expect(html).toContain('height: 100dvh;');
    const vh = html.indexOf('height: 100vh;');
    expect(html.indexOf('height: 100dvh;')).toBeGreaterThan(vh);
  });

  it('sin JavaScript la carta se lee igual, en vez de quedarse en el sobre', async () => {
    await downloadCardHtml(LETTER);
    const html = await readBlob(saved.blob as Blob);

    /*
     * Toda la coreografía vive en el guión. Abierto desde la vista previa de un
     * gestor de archivos o de una app de mensajería —el Quick Look de iOS, sin
     * ir más lejos—, el guión puede no correr nunca: sin esto quedaba un sobre
     * bonito que no responde al tocarlo.
     */
    expect(html).toContain('<noscript>');
    expect(html).toMatch(/<noscript>[\s\S]*\.envelope \{ animation: nsSalir[\s\S]*<\/noscript>/);
    // La carta deja de estar escondida; quien la destapa es la línea de tiempo
    expect(html).toMatch(/<noscript>[\s\S]*animation: nsEntrar[\s\S]*<\/noscript>/);
    // Y la canción, que tampoco puede sonar sin guión, se ofrece como enlace
    expect(html).toMatch(/<noscript>[\s\S]*\.player--blocked \{ display: flex[\s\S]*<\/noscript>/);
  });

  it('y dice qué se ve así, para que no parezca que la carta llegó rota', async () => {
    await downloadCardHtml(LETTER);
    const html = await readBlob(saved.blob as Blob);

    expect(html).toMatch(/<noscript>[\s\S]*sin-guion[\s\S]*<\/noscript>/);
    expect(html).toContain('archivo de respaldo sin conexión');
    expect(html).toContain('abre el enlace web (QR)');
    // El aviso va DENTRO de la carta: no debe tapar el sobre ni la floración
    const aviso = html.indexOf('<p class="sin-guion">');
    expect(aviso).toBeGreaterThan(html.indexOf('<div class="card__inner">'));
    expect(aviso).toBeLessThan(html.indexOf('class="sheet"'));
  });

  it('el gatillo del toque vive en el DOM normal, no dentro del <noscript>', async () => {
    await downloadCardHtml(LETTER);
    const html = await readBlob(saved.blob as Blob);

    /*
     * El combinador ~ solo alcanza HERMANOS POSTERIORES: metido dentro del
     * <noscript> no llegaría ni al sobre. Va de primer hijo de la pantalla, y
     * es el CSS quien lo apaga —`.css-trigger { display: none }`— siempre que
     * el guión sí corra.
     */
    const pantalla = html.indexOf('class="phone__screen"');
    const casilla = html.indexOf('id="css-open-card"');
    expect(casilla).toBeGreaterThan(pantalla);
    expect(casilla).toBeLessThan(html.indexOf('class="envelope"'));
    expect(html).toContain('<label for="css-open-card"');
    expect(html).toContain('.css-trigger { display: none; }');
  });

  it('sin JavaScript la coreografía la lleva el CSS, y la dispara el toque', async () => {
    await downloadCardHtml(LETTER);
    const html = await readBlob(saved.blob as Blob);
    const bloque = html.slice(html.indexOf('<noscript><style>'), html.indexOf('</style></noscript>'));

    // Tocar el sobre abre la solapa y lo aparta: eso es lo que se siente
    expect(bloque).toContain('#css-open-card:checked ~ .envelope .envelope__flap { transform: rotateX(');
    expect(bloque).toContain('#css-open-card:checked ~ .envelope { animation: nsSalir');
    // La floración se desplaza entera para empezar cuando el sobre se va
    expect(bloque).toMatch(
      /#css-open-card:checked ~ \.bloom-scene \.bloom-stem\s+\{ animation-delay: calc\(var\(--d\) \+ 620ms\); \}/,
    );
    // El estallido lleva su retraso en línea: solo !important lo gana
    expect(bloque).toMatch(/\.bloom \{ animation: flowerBloom[^}]*!important/);
    expect(bloque).toContain('#css-open-card:checked ~ .blooms .bloom { animation-delay: 3320ms !important; }');
    expect(bloque).toContain('.card { pointer-events: auto; animation: nsEntrar');
    expect(bloque).toContain('#css-open-card:checked ~ .card { animation-delay: 4820ms; }');
  });

  it('y si el visor no dejara tocar, se abre sola a los 8 s', async () => {
    await downloadCardHtml(LETTER);
    const html = await readBlob(saved.blob as Blob);
    const bloque = html.slice(html.indexOf('<noscript><style>'), html.indexOf('</style></noscript>'));

    /*
     * No se puede comprobar desde aquí si el Quick Look de iOS deja marcar una
     * casilla. Si no dejara, sin esta red volveríamos exactamente al sobre que
     * no responde, que es de donde veníamos: cada paso lleva su retraso largo,
     * y el toque no hace otra cosa que adelantarlos.
     */
    expect(bloque).toContain('.envelope { animation: nsSalir 600ms ease 8000ms forwards; }');
    expect(bloque).toContain('calc(var(--d) + 8000ms)');
    expect(bloque).toMatch(/\.bloom \{ animation: flowerBloom[^}]*10700ms/);
    expect(bloque).toMatch(/\.card \{ pointer-events: auto; animation: nsEntrar[^}]*12200ms/);

    /*
     * Y la capa que recibe el toque se aparta al arrancar: cubre la pantalla
     * entera y no es hija del texto que se desplaza, asi que quedarse puesta
     * era una carta que llega y no se deja leer hasta el final.
     */
    expect(bloque).toContain('.css-trigger__hit { animation: nsGatilloFuera 1ms linear 8000ms forwards; }');
    expect(bloque).toContain('@keyframes nsGatilloFuera { to { transform: translateY(-200%); } }');
  });
});
