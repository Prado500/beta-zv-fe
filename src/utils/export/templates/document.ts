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
</head>
<body>

<div class="stage" id="stage" data-state="envelope">
${buildStageDecor(palette, copy)}

  <div class="phone">
    <div class="phone__screen" id="screen">
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
