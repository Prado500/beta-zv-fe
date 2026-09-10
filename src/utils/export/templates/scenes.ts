import type { ThemePalette } from '../../themePalette';
import { withAlpha } from '../../themePalette';
import { motifSvg, type ThemeDecor } from '../../themeDecor';
import { bloomSvg } from '../../bloomArt';
import { phraseSize, phraseStep } from '../../phraseLayout';
import {
  MEM_BEAT_STAGGER_MS,
  MEM_ENTER_STAGGER_MS,
  MEM_MAX,
  memBurst,
  memLayout,
  spotTransform,
} from '../../memoriesLayout';

/**
 * Los momentos que van entre el sobre y la carta, en su versión escrita.
 *
 * La previa de React monta y desmonta cada escena cuando le toca. Aquí no hay
 * React, así que las que van y vienen —la frase y los recuerdos— viajan dentro
 * de un `<template>`: su contenido está inerte, no se pinta ni arranca sus
 * animaciones, y el guion lo clona en el momento justo. Es lo más parecido a
 * montar un componente que da el HTML a secas, y evita el problema de que
 * todas las animaciones se disparen al abrir el archivo.
 *
 * Medidas, tiempos y colores salen de los mismos módulos que usa la app
 * (`utils/bloomArt`, `utils/phraseLayout`, `utils/memoriesLayout`).
 */

/* ---------- Momento 1: la floración ---------- */

/**
 * Se imprime de una vez y se queda: sus animaciones cuelgan de la clase
 * `is-running`, que el guion enciende al abrir el sobre. Igual que en la app.
 */
export const buildBloom = (
  flowers: string[],
  palette: ThemePalette,
  decor: ThemeDecor,
): string => `
    <div class="bloom-scene" id="bloom-scene" aria-hidden="true">
      ${bloomSvg(flowers, palette, decor, 'bloomx')}
    </div>`;

/* ---------- Momento 2: la frase suspendida ---------- */

export const buildPhrase = (phrase: string, palette: ThemePalette): string => {
  if (!phrase) return '';
  const words = phrase.split(' ').filter(Boolean);
  const step = phraseStep(words.length);

  const spans = words
    .map(
      (word, i) =>
        `<span class="phrase-scene__word" style="--d: ${Math.round(i * step)}ms;">${word}</span>`,
    )
    .join(' ');

  return `
    <template id="tpl-phrase"><div class="phrase-scene" aria-live="polite">
      <p class="phrase-scene__text" style="color: ${palette.accent}; font-size: ${phraseSize(
        phrase.length,
      )};">${spans}</p>
    </div></template>`;
};

/* ---------- Momento 3: descubrir los recuerdos ---------- */

/**
 * Cada foto lleva encima su posición final del abanico en `data-fan`, para que
 * el guion sólo tenga que copiarla al `transform` cuando estén todas
 * descubiertas: así el acomodo es una transición y no un salto.
 */
export const buildMemories = (
  photos: string[],
  palette: ThemePalette,
  decor: ThemeDecor,
): string => {
  const list = photos.slice(0, MEM_MAX);
  if (list.length === 0) return '';

  const n = list.length;
  const { spots, fan, width, fanScale } = memLayout(n);
  const mid = (n - 1) / 2;

  const burst = memBurst(width, palette.accent, decor.metal)
    .map(
      (p) =>
        `<span class="mem-burst__p" style="--dx: ${p.dx}; --dy: ${p.dy}; --r: ${p.rot};">${motifSvg(
          decor.motif,
          p.size,
          p.color,
        )}</span>`,
    )
    .join('');

  const cards = list
    .map(
      (src, i) =>
        `<button type="button" class="mem-photo" data-mem="${i}" data-fan="${spotTransform(
          fan[i],
          fanScale,
        )}" data-fanz="${10 + n - Math.abs(i - mid)}" style="width: ${width}px; transform: ${spotTransform(
          spots[i],
          1,
        )}; z-index: ${10 + i}; color: ${palette.accent}; --beat: ${
          i * MEM_BEAT_STAGGER_MS
        }ms;" aria-label="Descubrir recuerdo ${i + 1}" aria-pressed="false">
          <span class="mem-photo__inner" style="--d: ${i * MEM_ENTER_STAGGER_MS}ms; display: block;">
            <span class="mem-photo__frame" style="display: block;">
              <span class="mem-photo__pic" style="display: block;">
                <img class="mem-photo__img" src="${src}" alt="" draggable="false"/>
                <img class="mem-photo__img mem-photo__veil" src="${src}" alt="" draggable="false" aria-hidden="true"/>
              </span>
            </span>
          </span>
        </button>`,
    )
    .join('');

  return `
    <template id="tpl-memories"><div class="mem-scene">
      ${cards}
      <p class="mem-hint" style="color: ${palette.text}; background-color: ${withAlpha(
        palette.cardBg,
        0.8,
      )};">Toca para descubrir</p>
    </div></template>
    <template id="tpl-mem-burst"><span class="mem-burst" aria-hidden="true">${burst}</span></template>`;
};

/* ---------- Momento 4: el estallido que tapa la pantalla ---------- */

const BURST_COUNT = 32;

/**
 * Las flores del tema que brotan del centro y cubren todo, justo antes de la
 * carta. El reparto es una espiral áurea (137,5° entre flores) con radios que
 * crecen como la raíz del índice: se llenan el centro y los bordes por igual
 * sin que dos caigan en el mismo sitio. Posiciones fijas, no aleatorias, para
 * que cada apertura se vea igual.
 */
export const buildBurst = (flowers: string[]): string => {
  const petals = Array.from({ length: BURST_COUNT }, (_, i) => {
    const angle = i * 137.5 * (Math.PI / 180);
    const tx = Math.cos(angle) * Math.sqrt(i) * 36;
    const ty = Math.sin(angle) * Math.sqrt(i) * 78;
    const rot = (i * 40) % 360;
    const delay = (i % 6) * 0.03;
    const scale = 1.2 + ((Math.sin(i * 999) + 1) / 2) * 0.5;

    return `<div class="bloom" style="z-index: ${50 + i}; --tx: ${tx.toFixed(
      1,
    )}px; --ty: ${ty.toFixed(1)}px; --rot: ${rot}deg; --scale: ${scale.toFixed(
      3,
    )}; animation-delay: ${delay}s;"><img src="${flowers[i % flowers.length]}" alt=""/></div>`;
  }).join('');

  return `<div class="blooms">${petals}</div>`;
};
