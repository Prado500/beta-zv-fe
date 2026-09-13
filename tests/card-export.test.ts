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

/* ------------------------------------------------------------------------- *
 * La carta descargada, abierta en un iPhone.
 *
 * Son dos averías distintas y se prueban por separado, porque se arreglan por
 * separado: el guión que no llega a correr, y la pantalla que no se mide como
 * parece.
 * ------------------------------------------------------------------------- */

/** La hoja principal: la que se aplica siempre, guión o no. */
const hojaPrincipal = (html: string) => html.slice(html.indexOf('<style>'), html.indexOf('</style>'));

/** La hoja de respaldo: solo la aplica el navegador cuando NO hay guión. */
const hojaSinGuion = (html: string) =>
  html.slice(html.indexOf('<noscript><style>'), html.indexOf('</style></noscript>'));

/** El cuerpo de una regla, para afirmar sobre ella y no sobre toda la hoja. */
const regla = (hoja: string, selector: string) => {
  const desde = hoja.indexOf(selector);
  return desde < 0 ? '' : hoja.slice(desde, hoja.indexOf('}', desde));
};

/** El primer número capturado por el patrón, como número. */
const espera = (hoja: string, patron: RegExp) => Number(hoja.match(patron)?.[1]);

/**
 * Abierto desde la vista previa de un gestor de archivos o de una app de
 * mensajería —el Quick Look de iOS, sin ir más lejos— el guión puede no
 * ejecutarse nunca. Toda la coreografía vive ahí dentro, así que sin red lo
 * único que se ve es un sobre bonito que no responde al tocarlo.
 */
describe('la carta descargada sin guión (Quick Look de iOS)', () => {
  it('lleva una hoja de respaldo en el <head>, y DESPUÉS de la principal', async () => {
    await downloadCardHtml(LETTER);
    const html = await readBlob(saved.blob as Blob);
    const head = html.slice(0, html.indexOf('</head>'));

    // Antes de la principal no pisaría nada: el orden es el que decide.
    expect(head).toContain('<noscript><style>');
    expect(head.indexOf('<noscript><style>')).toBeGreaterThan(head.indexOf('<style>'));
  });

  it('el gatillo del toque es hermano ANTERIOR del sobre, la floración, el estallido y la carta', async () => {
    await downloadCardHtml(LETTER);
    const html = await readBlob(saved.blob as Blob);

    /*
     * El combinador ~ solo alcanza hermanos POSTERIORES. Metido dentro del
     * <noscript> no llegaría a nadie, y duplicar el DOM ahí dentro doblaría el
     * peso de un archivo que lleva las fotos incrustadas.
     */
    const gatillo = html.indexOf('id="css-open-card"');
    expect(gatillo).toBeGreaterThan(html.indexOf('class="phone__screen"'));
    for (const despues of [
      '<div class="envelope" id="envelope">',
      'id="bloom-scene"',
      '<div class="blooms">',
      '<div class="card" id="card">',
    ]) {
      expect(html.indexOf(despues)).toBeGreaterThan(gatillo);
    }
    expect(html).toContain('<label for="css-open-card"');
  });

  it('tocar el sobre abre la solapa, lo aparta y trae la carta', async () => {
    await downloadCardHtml(LETTER);
    const hoja = hojaSinGuion(await readBlob(saved.blob as Blob));

    expect(hoja).toContain('#css-open-card:checked ~ .envelope .envelope__flap { transform: rotateX(-172deg); }');
    expect(hoja).toMatch(/#css-open-card:checked ~ \.envelope \{ animation: nsSalir [^}]*620ms/);
    expect(hoja).toContain('#css-open-card:checked ~ .card { animation-delay: 4820ms; }');
  });

  it('y si el visor no dejara tocar, se abre sola y en orden', async () => {
    await downloadCardHtml(LETTER);
    const hoja = hojaSinGuion(await readBlob(saved.blob as Blob));

    /*
     * No se puede comprobar desde aquí si el Quick Look deja marcar una casilla.
     * Si no dejara, sin esta red volveríamos al sobre que no responde, que es de
     * donde veníamos.
     */
    const sobre = espera(hoja, /^\s*\.envelope \{ animation: nsSalir 600ms ease (\d+)ms forwards; \}/m);
    const estallido = espera(hoja, /^\s*\.bloom \{ animation: flowerBloom [^}]*?\s(\d+)ms forwards !important/m);
    const carta = espera(hoja, /^\s*\.card \{ pointer-events: auto; animation: nsEntrar [^}]*?\s(\d+)ms forwards/m);

    expect(sobre).toBe(8000);
    expect(sobre).toBeLessThan(estallido);
    expect(estallido).toBeLessThan(carta);
  });

  it('la música, que tampoco puede sonar sin guión, se ofrece como enlace', async () => {
    await downloadCardHtml(LETTER);
    const hoja = hojaSinGuion(await readBlob(saved.blob as Blob));

    expect(hoja).toContain('.music__screen, .music .player--live { display: none; }');
    expect(hoja).toContain('.music .player--blocked { display: flex; }');
  });

  it('el toque adelanta la secuencia ENTERA: el desfase es el mismo en los tres momentos', async () => {
    await downloadCardHtml(LETTER);
    const hoja = hojaSinGuion(await readBlob(saved.blob as Blob));

    /*
     * Esta es la invariante que sostiene las doce esperas: entre la secuencia
     * que arranca sola y la que arranca al tocar solo cambia CUÁNDO empieza.
     * Si alguien retoca un número suelto, aquí se ve.
     */
    const autoSobre = espera(hoja, /^\s*\.envelope \{ animation: nsSalir 600ms ease (\d+)ms/m);
    const tocaSobre = espera(hoja, /#css-open-card:checked ~ \.envelope \{ animation: nsSalir 600ms ease (\d+)ms/);
    const autoEstallido = espera(hoja, /^\s*\.bloom \{ animation: flowerBloom [^}]*?\s(\d+)ms forwards !important/m);
    const tocaEstallido = espera(hoja, /#css-open-card:checked ~ \.blooms \.bloom \{ animation-delay: (\d+)ms !important/);
    const autoCarta = espera(hoja, /^\s*\.card \{ pointer-events: auto; animation: nsEntrar [^}]*?\s(\d+)ms forwards/m);
    const tocaCarta = espera(hoja, /#css-open-card:checked ~ \.card \{ animation-delay: (\d+)ms/);

    const desfase = autoSobre - tocaSobre;
    expect(desfase).toBeGreaterThan(0);
    expect(autoEstallido - tocaEstallido).toBe(desfase);
    expect(autoCarta - tocaCarta).toBe(desfase);

    // La floración se mide con calc() desde ese mismo arranque, en los dos casos
    expect(hoja).toContain(`calc(var(--d) + ${autoSobre}ms)`);
    expect(hoja).toContain(`calc(var(--d) + ${tocaSobre}ms)`);
  });

  it('el estallido lleva su retraso EN LÍNEA: solo !important lo gana', async () => {
    await downloadCardHtml(LETTER);
    const html = await readBlob(saved.blob as Blob);
    const hoja = hojaSinGuion(html);

    // Que el estilo en línea existe de verdad, y no se pide !important por costumbre
    expect(html).toMatch(/class="bloom" style="[^"]*animation-delay:/);
    expect(hoja).toMatch(/^\s*\.bloom \{ animation: flowerBloom [^}]*!important; \}/m);
    expect(hoja).toMatch(/#css-open-card:checked ~ \.blooms \.bloom \{ animation-delay: \d+ms !important; \}/);
  });

  it('la capa que recibe el toque se aparta con transform, no con visibility', async () => {
    await downloadCardHtml(LETTER);
    const hoja = hojaSinGuion(await readBlob(saved.blob as Blob));

    /*
     * Cubre la pantalla entera y no es hija del texto que se desplaza: dejarla
     * puesta era una carta que llega y no se deja leer hasta el final. Y se
     * aparta con transform porque WebKit no conserva el visibility del último
     * fotograma, y ahí seguía recibiendo toques.
     */
    const salida = hoja.match(/@keyframes nsGatilloFuera \{.*\}/)?.[0] ?? '';
    expect(salida).toContain('transform: translateY(-200%)');
    expect(salida).not.toContain('visibility');
    expect(hoja).toMatch(/\.css-trigger__hit \{[^}]*animation: nsGatilloFuera 1ms linear \d+ms forwards;/);
    // Una sola regla para la capa: no dos declaraciones sueltas del mismo selector
    expect(hoja.match(/^\s*\.css-trigger__hit \{/gm)).toHaveLength(1);
  });

  it('con guión, nada de esto existe para nadie', async () => {
    await downloadCardHtml(LETTER);
    const html = await readBlob(saved.blob as Blob);

    // El gatillo se apaga desde la hoja principal, que es la que sí corre siempre
    expect(hojaPrincipal(html)).toContain('.css-trigger { display: none; }');
    expect(hojaPrincipal(html)).not.toContain('#css-open-card');

    // Y ninguna regla del modo sin guión se escapa fuera del <noscript>
    const fuera = html.replace(/<noscript>[\s\S]*?<\/noscript>/g, '');
    expect(fuera).not.toContain('#css-open-card:checked');
    expect(fuera).not.toContain('nsEntrar');
    expect(fuera).not.toContain('nsGatilloFuera');
  });

  it('avisa de qué se está viendo, dentro de la carta y no tapando el sobre', async () => {
    await downloadCardHtml(LETTER);
    const html = await readBlob(saved.blob as Blob);

    expect(html).toMatch(/<noscript>\s*<p class="sin-guion">/);
    expect(html).toContain('archivo de respaldo sin conexión');
    expect(html).toContain('abre el enlace web (QR)');

    // Se lee cuando toca, al llegar: ni antes del sobre ni por delante de la hoja
    const aviso = html.indexOf('<p class="sin-guion">');
    expect(aviso).toBeGreaterThan(html.indexOf('<div class="card__inner">'));
    expect(aviso).toBeLessThan(html.indexOf('<div class="sheet">'));
  });
});

/**
 * En el móvil `100vh` es la pantalla CON la barra del navegador retraída, no la
 * que se ve. Con la barra delante el fondo del teléfono caía por debajo del
 * borde y, como el cuerpo no desplaza, no había manera de llegar al final de la
 * carta: se quedaba clavada donde acabara el texto.
 */
describe('la carta descargada y la barra del navegador', () => {
  it('el teléfono se mide con vh y, justo después, con dvh', async () => {
    await downloadCardHtml(LETTER);
    const phone = regla(hojaPrincipal(await readBlob(saved.blob as Blob)), '\n.phone {');

    // dvh DESPUÉS de vh, nunca en su lugar: quien no lo entienda se queda con la primera
    expect(phone).toContain('height: 100vh;');
    expect(phone.indexOf('height: 100dvh;')).toBeGreaterThan(phone.indexOf('height: 100vh;'));
  });

  it('el cuerpo y el escenario también', async () => {
    await downloadCardHtml(LETTER);
    const hoja = hojaPrincipal(await readBlob(saved.blob as Blob));

    for (const selector of ['\nbody {', '\n.stage {']) {
      const cuerpo = regla(hoja, selector);
      expect(cuerpo).toContain('min-height: 100vh;');
      expect(cuerpo.indexOf('min-height: 100dvh;')).toBeGreaterThan(cuerpo.indexOf('min-height: 100vh;'));
    }
  });

  it('y el teléfono de escritorio, que tiene su propia medida', async () => {
    await downloadCardHtml(LETTER);
    const hoja = hojaPrincipal(await readBlob(saved.blob as Blob));

    expect(hoja).toContain('max-height: 92vh;');
    expect(hoja.indexOf('max-height: 92dvh;')).toBeGreaterThan(hoja.indexOf('max-height: 92vh;'));
  });

  it('el visor de fotos ampliadas, donde la foto se salía por abajo', async () => {
    await downloadCardHtml(LETTER);
    const hoja = hojaPrincipal(await readBlob(saved.blob as Blob));

    for (const medida of [75, 55]) {
      expect(hoja).toContain(`max-height: ${medida}vh;`);
      expect(hoja.indexOf(`max-height: ${medida}dvh;`)).toBeGreaterThan(hoja.indexOf(`max-height: ${medida}vh;`));
    }
  });

  it('ninguna ALTURA en vh se queda huérfana', async () => {
    await downloadCardHtml(LETTER);
    const hoja = hojaPrincipal(await readBlob(saved.blob as Blob));

    /*
     * La red que cubre lo que venga después. Solo las alturas: `top: 5vh` del
     * rótulo del escenario es una posición, no una medida que decida si el
     * contenido cabe, y además solo existe en escritorio.
     */
    const alturas = [...hoja.matchAll(/((?:min-|max-)?height): (\d+)vh;/g)];
    expect(alturas.length).toBeGreaterThan(0);

    for (const altura of alturas) {
      const fin = (altura.index ?? 0) + altura[0].length;
      expect(hoja.slice(fin, fin + 80)).toContain(`${altura[1]}: ${altura[2]}dvh;`);
    }
  });
});
