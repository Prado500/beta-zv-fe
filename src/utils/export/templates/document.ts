import type { ContentPlan } from '../content';
import type { ThemePalette } from '../../themePalette';
import type { ThemeDecor } from '../../themeDecor';
import type { Gift } from '../../themeGifts';
import { buildAmbient } from './ambient';
import { buildRuntime } from './runtime';
import { buildStyles } from './styles';
import { buildBloom, buildBurst, buildMemories, buildPhrase } from './scenes';
import {
  buildCard,
  buildEnvelope,
  buildLightbox,
  buildMusic,
  buildStageDecor,
  type CardCopy,
} from './screens';

export interface DocumentInput {
  copy: CardCopy;
  palette: ThemePalette;
  decor: ThemeDecor;
  /** Los dos objetos que acompañan al tema. */
  gifts: [Gift, Gift];
  animationType: string;
  plan: ContentPlan;
  flowers: string[];
  /** La primera frase del mensaje, para el momento suspendido. */
  phrase: string;
}

/**
 * Ensambla el documento final. Cada pieza vive en su propio módulo; aquí sólo
 * se ordenan las capas y se fija el estado inicial del escenario.
 */
export const buildDocument = ({
  copy,
  palette,
  decor,
  gifts,
  animationType,
  plan,
  flowers,
  phrase,
}: DocumentInput): string => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>${copy.title} — Para ${copy.recipient}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400;1,600&family=Be+Vietnam+Pro:wght@400;500;600;700&family=Great+Vibes&display=swap">
<style>${buildStyles(palette, decor)}</style>

<!--
  Red de seguridad: la carta, legible aunque el guión no llegue a correr.

  Toda la coreografía vive en JavaScript, así que sin él la hoja se queda en
  opacidad 0 y lo único que se ve es un sobre que no responde al tocarlo. Y eso
  pasa de verdad: al abrir el archivo desde la vista previa de un gestor de
  archivos o de una app de mensajería, el guión puede no ejecutarse nunca.

  Aquí se renuncia a la coreografía y se entrega lo importante: el texto. El
  reproductor tampoco puede sonar sin guión, asi que en su lugar se ofrece el
  enlace a YouTube, que es lo que ese panel ya sabe hacer.
-->
<noscript><style>
  /*
   * La coreografía, en CSS puro, y CON el toque de la persona.
   *
   * El motor es un checkbox: el <label> tapa el sobre, tocarlo lo marca, y a
   * partir de ahí todo cuelga de #css-open-card:checked. Funciona sin
   * guión porque marcar una casilla desde su etiqueta lo hace el navegador,
   * no JavaScript.
   *
   * El gatillo está en el DOM normal, de primer hijo de la pantalla, porque el
   * combinador ~ solo alcanza HERMANOS POSTERIORES: metido dentro de este
   * <noscript> no llegaría ni al sobre.
   *
   * Y además se abre sola a los 8 s. No se puede comprobar desde aqui si la
   * vista previa de iOS deja tocar; si no dejara, sin esa red la carta se
   * quedaría en un sobre que no responde, que es justo de donde veníamos.
   */
  .css-trigger { display: block; }

  /* El gatillo: cubre el sobre entero y no se ve */
  .css-trigger__hit {
    position: absolute;
    inset: 0;
    z-index: 31;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  input.css-trigger {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }
  /* Marcado, el gatillo sobra y no debe tapar la carta */
  #css-open-card:checked ~ .css-trigger__hit { display: none; }
  /*
   * Y si nadie toca, se retira igual al arrancar la secuencia sola. La capa
   * cubre la pantalla entera y no es hija del texto que se desplaza: dejarla
   * puesta significaba una carta que llega y no se deja leer hasta el final.
   * Se aparta con transform y no con visibility: WebKit no conserva el
   * visibility de un fotograma al terminar, y ahi seguia recibiendo toques.
   * Comprobado con elementFromPoint, que es quien dice la verdad.
   */
  .css-trigger__hit { animation: nsGatilloFuera 1ms linear 8000ms forwards; }

  /* --- Paso 1: la solapa se abre --- */
  .envelope__flap {
    transform-origin: 50% 0%;
    transition: transform 700ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  #css-open-card:checked ~ .envelope .envelope__flap { transform: rotateX(-172deg); }
  #css-open-card:checked ~ .envelope .envelope__seal-anchor {
    transition: opacity 350ms ease, transform 350ms ease;
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.6);
  }

  /* --- Paso 2: el sobre se retira --- */
  .envelope { animation: nsSalir 600ms ease 8000ms forwards; }
  #css-open-card:checked ~ .envelope { animation: nsSalir 600ms ease 620ms forwards; }

  /* --- Paso 3: la floración ---
     Sus retrasos vienen por elemento en --d, así que se desplazan enteros con
     calc() para que arranque cuando el sobre se va. */
  .bloom-stem   { animation: stemDraw 800ms var(--ease) calc(var(--d) + 8000ms) forwards; }
  .bloom-leaf   { animation: leafOpen 420ms var(--ease) calc(var(--d) + 8000ms) forwards; }
  .bloom-flower { animation: flowerOpen 620ms cubic-bezier(0.34,1.56,0.64,1) calc(var(--d) + 8000ms) forwards; }
  .bloom-glow   { animation: glowBurst 760ms var(--ease) calc(var(--d) + 8000ms) forwards; }
  .bloom-blade  { animation: bladeGrow 620ms var(--ease) calc(var(--d) + 8000ms) forwards; }
  .bloom-mote   { animation: moteRise 1500ms var(--ease) calc(var(--d) + 8000ms) forwards; }
  .bloom-scene  { animation: bloomExit 300ms var(--ease) 10700ms forwards; }
  #css-open-card:checked ~ .bloom-scene .bloom-stem   { animation-delay: calc(var(--d) + 620ms); }
  #css-open-card:checked ~ .bloom-scene .bloom-leaf   { animation-delay: calc(var(--d) + 620ms); }
  #css-open-card:checked ~ .bloom-scene .bloom-flower { animation-delay: calc(var(--d) + 620ms); }
  #css-open-card:checked ~ .bloom-scene .bloom-glow   { animation-delay: calc(var(--d) + 620ms); }
  #css-open-card:checked ~ .bloom-scene .bloom-blade  { animation-delay: calc(var(--d) + 620ms); }
  #css-open-card:checked ~ .bloom-scene .bloom-mote   { animation-delay: calc(var(--d) + 620ms); }
  #css-open-card:checked ~ .bloom-scene { animation-delay: 3320ms; }

  /* --- Paso 4: el estallido ---
     Cada pétalo lleva su retraso EN LÍNEA para escalonarse, y un estilo en
     línea gana a la hoja: por eso aquí hace falta !important. */
  .bloom { animation: flowerBloom 2.6s cubic-bezier(0.22,1,0.36,1) 10700ms forwards !important; }
  #css-open-card:checked ~ .blooms .bloom { animation-delay: 3320ms !important; }

  /* --- Paso 5: la carta sube y aparece --- */
  .card { pointer-events: auto; animation: nsEntrar 800ms cubic-bezier(0.4,0,0.2,1) 12200ms forwards; }
  #css-open-card:checked ~ .card { animation-delay: 4820ms; }
  /* Cerrar la carta no lleva a ninguna parte: el sobre ya se fue */
  .card__close { display: none; }

  @keyframes nsSalir  { to { opacity: 0; visibility: hidden; } }
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
</style></noscript>
</head>
<body>

<div class="stage" id="stage" data-state="envelope">
${buildStageDecor(palette, copy)}

  <div class="phone">
    <div class="phone__screen" id="screen">
      <!--
        El gatillo del modo sin guión. Va AQUÍ, de primer hijo, y no dentro del
        <noscript>: tiene que ser hermano anterior del sobre, de la floración,
        del estallido y de la carta para que el selector ~ los alcance. Metido
        en el <noscript> no alcanzaría a nadie, y duplicar el DOM ahí dentro
        doblaría el peso del archivo, que lleva las fotos incrustadas.

        Con guión los dos van en display:none y no existen para nadie.
      -->
      <input type="checkbox" id="css-open-card" class="css-trigger" aria-hidden="true" tabindex="-1">
      <label for="css-open-card" class="css-trigger css-trigger__hit" aria-hidden="true"></label>
      <div class="phone__bg"></div>
      ${buildAmbient(animationType)}

${buildEnvelope(copy, palette, decor, gifts)}

<!--
  Los momentos, en orden: la floración de tallos sale del sobre; luego la frase
  suspendida; luego los recuerdos, que se descubren tocándolos; y al terminar,
  el estallido de flores que tapa la pantalla y da paso a la carta.

  La floración y el estallido se imprimen aquí y esperan quietos. La frase y
  los recuerdos van en <template>: el guion los clona cuando les toca, para que
  sus animaciones arranquen en ese momento y no al abrir el archivo.
-->
${buildBloom(flowers, palette, decor)}
${buildPhrase(phrase, palette)}
${buildMemories(plan.photos, palette, decor)}
${buildBurst(flowers)}

${buildCard(plan, copy, palette, decor, gifts, buildMusic(copy)).replace(
  '<div class="card__inner">',
  `${buildAmbient(animationType).replace('class="ambient"', 'class="ambient ambient--front"')}<div class="card__inner">`,
)}


${buildLightbox(plan.photos.length)}
    </div>
  </div>
</div>

<script>${buildRuntime(plan.photos, Boolean(phrase))}</script>
</body>
</html>`;
