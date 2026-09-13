import { EXIT_MS, FLOWER_MS, GLOW_MS, LEAF_MS, POP, STEM_DRAW_MS } from '../../bloomArt';

/**
 * La carta, legible aunque el guión no llegue a correr.
 *
 * Toda la coreografía del documento exportado vive en `templates/runtime.ts`.
 * Abierto desde la vista previa de un gestor de archivos o de una app de
 * mensajería —el Quick Look de iOS, sin ir más lejos— ese guión puede no
 * ejecutarse nunca: la hoja se queda en opacidad 0 y lo único que se ve es un
 * sobre bonito que no responde al tocarlo.
 *
 * Aquí vive la red: la misma secuencia contada en CSS puro, más el aviso de
 * qué se está viendo. Nada de esto existe cuando el guión sí corre.
 *
 * Son cuatro piezas y se montan en tres sitios distintos —el `<head>`, la
 * pantalla y la carta—, así que viven juntas aquí en vez de repartidas por los
 * tres archivos que las imprimen.
 */

/* -------------------------------------------------------------------------- *
 * La línea de tiempo
 * -------------------------------------------------------------------------- */

/**
 * La misma secuencia, dos veces: una que arranca sola —por si el visor no deja
 * tocar— y otra que empieza en cuanto alguien toca el sobre. Entre las dos solo
 * cambia CUÁNDO empieza; todo lo que viene después se mide desde ese arranque.
 * Con estos cuatro números se escriben las doce esperas, y ninguna puede
 * desincronizarse de las demás.
 */
const AUTO_MS = 8000;
const TAP_MS = 620;
const BURST_AFTER_MS = 2700;
const CARD_AFTER_MS = 4200;

/** La curva de la coreografía. `--ease` solo existe dentro de la floración. */
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

/** Los cuatro momentos, medidos desde el instante en que arranca la secuencia. */
const secuencia = (arranque: number) => ({
  sobre: arranque,
  /* Cada tallo lleva su propio retraso en `--d`: se desplazan enteros. */
  floracion: `calc(var(--d) + ${arranque}ms)`,
  estallido: arranque + BURST_AFTER_MS,
  carta: arranque + CARD_AFTER_MS,
});

const sola = secuencia(AUTO_MS);
const alTocar = secuencia(TAP_MS);

/**
 * Las piezas de la floración. Duraciones y curva se traen de `bloomArt`, que es
 * quien las define para la coreografía con guión: así las dos cuentan lo mismo
 * sin que nadie tenga que acordarse de cambiar los números dos veces.
 */
const FLORACION = [
  ['stem', `stemDraw ${STEM_DRAW_MS}ms var(--ease)`],
  ['leaf', `leafOpen ${LEAF_MS}ms var(--ease)`],
  ['flower', `flowerOpen ${FLOWER_MS}ms ${POP}`],
  ['glow', `glowBurst ${GLOW_MS}ms var(--ease)`],
  ['blade', 'bladeGrow 620ms var(--ease)'],
  ['mote', 'moteRise 1500ms var(--ease)'],
] as const;

const floracionSola = FLORACION.map(
  ([pieza, animacion]) => `  .bloom-${pieza} { animation: ${animacion} ${sola.floracion} forwards; }`,
).join('\n');

/* Una sola regla: lo único que cambia entre las seis es el nombre de la pieza. */
const floracionAlTocar = `  #css-open-card:checked ~ .bloom-scene :is(${FLORACION.map(
  ([pieza]) => `.bloom-${pieza}`,
).join(', ')}) { animation-delay: ${alTocar.floracion}; }`;

/* -------------------------------------------------------------------------- *
 * Las cuatro piezas
 * -------------------------------------------------------------------------- */

/**
 * Para la hoja principal: apaga el gatillo siempre que SÍ haya guión. La hoja
 * de respaldo, que va después y solo se aplica sin guión, lo vuelve a encender.
 */
export const NO_JS_TRIGGER_CSS = `
/* El gatillo del modo sin guión: no existe para nadie mientras haya guión. */
.css-trigger { display: none; }
`;

/**
 * El gatillo, para la pantalla. Va de PRIMER HIJO de `.phone__screen`, no
 * dentro del `<noscript>`: el combinador `~` solo alcanza hermanos posteriores,
 * así que tiene que preceder al sobre, a la floración, al estallido y a la
 * carta. Y duplicar el DOM dentro del `<noscript>` doblaría el peso de un
 * archivo que ya lleva las fotos incrustadas.
 */
export const NO_JS_TRIGGER_HTML = `<input type="checkbox" id="css-open-card" class="css-trigger" aria-hidden="true" tabindex="-1">
      <label for="css-open-card" class="css-trigger css-trigger__hit" aria-hidden="true"></label>`;

/**
 * El aviso, para la carta. Va DENTRO de la hoja y no fijo en pantalla: se lee
 * cuando toca, al llegar, y no tapa el sobre ni la floración.
 */
export const NO_JS_NOTICE_HTML = `<noscript>
          <p class="sin-guion">
            Estás viendo tu <b>archivo de respaldo sin conexión</b>. Para escuchar tu
            canción y disfrutar de las animaciones completas, abre el enlace web (QR)
            original desde tu navegador.
          </p>
        </noscript>`;

/**
 * La hoja de respaldo, para el `<head>`. Va DESPUÉS de la principal: buena
 * parte de lo que hace es pisarla, y el orden es lo único que lo decide.
 */
export const NO_JS_STYLES_HTML = `<noscript><style>
  /*
   * La coreografía, en CSS puro y CON el toque de la persona.
   *
   * El motor es un checkbox: el <label> tapa el sobre, tocarlo lo marca, y a
   * partir de ahí todo cuelga de #css-open-card:checked. Funciona sin guión
   * porque marcar una casilla desde su etiqueta lo hace el navegador.
   */
  .css-trigger { display: block; }

  /*
   * El gatillo: cubre el sobre entero, no se ve, y se retira al arrancar la
   * secuencia sola. Se aparta con transform y no con visibility porque WebKit
   * no conserva el visibility del último fotograma, y ahí seguía recibiendo
   * toques: la capa cubre la pantalla entera y no es hija del texto que se
   * desplaza, así que quedarse puesta era una carta que llega y no se deja leer
   * hasta el final. Comprobado con elementFromPoint, que es quien dice la verdad.
   */
  .css-trigger__hit {
    position: absolute;
    inset: 0;
    z-index: 31;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    animation: nsGatilloFuera 1ms linear ${sola.sobre}ms forwards;
  }
  input.css-trigger { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
  /* Marcado, el gatillo sobra y no debe tapar la carta */
  #css-open-card:checked ~ .css-trigger__hit { display: none; }

  /* --- Paso 1: la solapa se abre --- */
  .envelope__flap {
    transform-origin: 50% 0%;
    transition: transform 700ms ${EASE};
  }
  #css-open-card:checked ~ .envelope .envelope__flap { transform: rotateX(-172deg); }
  #css-open-card:checked ~ .envelope .envelope__seal-anchor {
    transition: opacity 350ms ease, transform 350ms ease;
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.6);
  }

  /* --- Paso 2: el sobre se retira --- */
  .envelope { animation: nsSalir 600ms ease ${sola.sobre}ms forwards; }
  #css-open-card:checked ~ .envelope { animation: nsSalir 600ms ease ${alTocar.sobre}ms forwards; }

  /* --- Paso 3: la floración --- */
${floracionSola}
  .bloom-scene { animation: bloomExit ${EXIT_MS}ms var(--ease) ${sola.estallido}ms forwards; }
${floracionAlTocar}
  #css-open-card:checked ~ .bloom-scene { animation-delay: ${alTocar.estallido}ms; }

  /* --- Paso 4: el estallido ---
     Cada pétalo lleva su retraso EN LÍNEA para escalonarse, y un estilo en
     línea gana a la hoja: por eso aquí hace falta !important. */
  .bloom { animation: flowerBloom 2.6s cubic-bezier(0.22, 1, 0.36, 1) ${sola.estallido}ms forwards !important; }
  #css-open-card:checked ~ .blooms .bloom { animation-delay: ${alTocar.estallido}ms !important; }

  /* --- Paso 5: la carta sube y aparece --- */
  .card { pointer-events: auto; animation: nsEntrar 800ms ${EASE} ${sola.carta}ms forwards; }
  #css-open-card:checked ~ .card { animation-delay: ${alTocar.carta}ms; }
  /* Cerrar la carta no lleva a ninguna parte: el sobre ya se fue */
  .card__close { display: none; }

  @keyframes nsSalir { to { opacity: 0; visibility: hidden; } }
  @keyframes nsGatilloFuera { to { transform: translateY(-200%); } }
  @keyframes nsEntrar {
    from { opacity: 0; transform: translateY(18px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* --- El aviso, dentro de la carta y con los colores del tema --- */
  .sin-guion {
    margin: 0 0 14px;
    padding: 10px 14px;
    border-radius: 14px;
    font-size: 11px;
    line-height: 1.5;
    text-align: center;
    color: var(--text);
    background: color-mix(in srgb, var(--card-bg) 55%, transparent);
    border: 1px solid var(--border);
  }
  .sin-guion b { font-weight: 600; color: var(--accent); }

  /* La música no puede sonar sin guión: en su lugar, el enlace a YouTube */
  .music__screen, .music .player--live { display: none; }
  .music .player--blocked { display: flex; }
</style></noscript>`;
