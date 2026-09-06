import type { ContentPlan, PhotoCard } from '../content';
import type { ThemePalette } from '../../themePalette';
import { motifSvg, type ThemeDecor } from '../../themeDecor';
import { COVER_DUST, garlandSvg, giftSvg, type Gift, type GiftPaint } from '../../themeGifts';
import { withAlpha } from '../../themePalette';
import { cornerFlourish, heartConfetti, icon, ornament, rose } from './ornaments';

/** Colores con los que se tiñen los objetos del tema. */
const paintFor = (palette: ThemePalette, decor: ThemeDecor): GiftPaint => ({
  accent: palette.accent,
  metal: decor.metal,
  ink: palette.text,
  paper: palette.cardBg,
  motif: decor.motif,
});

export interface CardCopy {
  title: string;
  recipient: string;
  /** Iniciales de quien recibe, para la marca de agua de la hoja. */
  monogram: string;
  sender: string;
  songUrl: string;
  hasSong: boolean;
}

/* ---------- Escenario de escritorio ---------- */

/**
 * Lo que rodea al teléfono cuando la carta se abre en un computador. Antes era
 * un plano gris pizarra; ahora es una hoja con luz, grano, corazones, dos
 * rosas y un rótulo, en la misma línea visual del resto del producto.
 */
export const buildStageDecor = (palette: ThemePalette, copy: CardCopy): string => {
  const roseColor = palette.isDark ? withAlpha(palette.accent, 0.9) : '#8c1128';
  const leafColor = palette.isDark ? 'rgba(148,163,184,0.7)' : '#6b7f5c';

  return `
  <div class="stage__glow"></div>
  <div class="stage__grain"></div>
  <div class="stage__decor">
    ${heartConfetti(22)}
    ${rose(roseColor, leafColor, 132, 'stage__rose--left')}
    ${rose(roseColor, leafColor, 112, 'stage__rose--right')}
  </div>
  <div class="stage__caption">
    <span class="stage__caption-script">para ${copy.recipient}</span>
  </div>
  <div class="stage__vignette"></div>`;
};

/* ---------- Sobre ---------- */

export const buildEnvelope = (
  copy: CardCopy,
  palette: ThemePalette,
  decor: ThemeDecor,
  gifts: [Gift, Gift],
): string => {
  const paint = paintFor(palette, decor);

  return `
    <div class="envelope" id="envelope">
      <span class="envelope__frame" aria-hidden="true"></span>
      ${cornerFlourish(decor.metal, 54, 'tl')}
      ${cornerFlourish(decor.metal, 54, 'tr')}
      ${cornerFlourish(decor.metal, 54, 'bl')}
      ${cornerFlourish(decor.metal, 54, 'br')}
      ${COVER_DUST.map(
        (speck) =>
          `<span class="envelope__dust" style="left: ${speck.x}%; top: ${speck.y}%; transform: translate(-50%, -50%) rotate(${speck.rot}deg); opacity: ${speck.alpha};" aria-hidden="true">${motifSvg(
            decor.motif,
            speck.size,
            speck.tint === 'accent' ? palette.accent : decor.metal,
          )}</span>`,
      ).join('')}

      <!-- Guirnalda colgada sobre el sobre: llena el hueco de arriba, que era
           el que dejaba el inicio con cara de plano vacío. -->
      <span class="envelope__garland" aria-hidden="true">${garlandSvg(238, paint)}</span>

      <div class="envelope__stack">
        <div class="envelope__card">
          <span class="envelope__grain" aria-hidden="true"></span>
          <span class="envelope__edge" aria-hidden="true"></span>

          <!--
            Solapa y lacre dentro del MISMO sistema de coordenadas: el SVG se
            estira exacto al contenedor, así el vértice cae siempre en (125,56)
            y el lacre se ancla a ese punto. Antes la solapa se medía contra la
            caja de padding de la tarjeta y el lacre contra el contenedor, que
            son cajas distintas — de ahí el desvío.
          -->
          <div class="envelope__fold">
            <svg class="envelope__flap" viewBox="0 0 250 60" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 0 H250 V8 L125 56 L0 8 Z" fill="${withAlpha(palette.accent, 0.1)}" stroke="${withAlpha(
                decor.metal,
                0.55,
              )}" stroke-width="1"/>
            </svg>

            <!-- El ancla hace la traslación; el lacre solo escala al latir -->
            <span class="envelope__seal-anchor">
              <span class="envelope__seal" aria-hidden="true">${motifSvg(decor.motif, 22, palette.cardBg)}</span>
            </span>
          </div>

          ${cornerFlourish(decor.metal, 38, 'bl')}
          ${cornerFlourish(decor.metal, 38, 'br')}

          <div class="envelope__content">
            <h2 class="envelope__title">${copy.title}</h2>
            ${ornament(decor.metal, 124, decor.motif)}
            <p class="envelope__label">De parte de</p>
            <p class="envelope__sender">${copy.sender}</p>
          </div>
        </div>
      </div>

      <!--
        Los objetos del tema apoyados bajo el sobre, que les monta un poco
        encima. Puestos detrás quedaban tapados casi enteros; aquí el inicio
        se lee como un regalo sobre una mesa y no como una tarjeta flotando.
      -->
      <div class="envelope__gifts" aria-hidden="true">
        <span class="envelope__rest"></span>
        <span class="envelope__gift envelope__gift--left">${giftSvg(gifts[0], 84, paint)}</span>
        <span class="envelope__gift envelope__gift--right">${giftSvg(gifts[1], 74, paint)}</span>
      </div>

      <p class="envelope__hint">Toca para abrir</p>
    </div>`;
};

/* ---------- Estallido de flores ---------- */

const TOTAL_BLOOMS = 32;

export const buildBlooms = (flowers: string[]): string => {
  const petals = Array.from({ length: TOTAL_BLOOMS }, (_, i) => {
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

/* ---------- Carta ---------- */

const polaroid = (card: PhotoCard, variant: 'inline' | 'gallery'): string => {
  const side = variant === 'inline' ? ` is-${card.side}` : '';
  return `<button type="button" class="polaroid polaroid--${variant}${side}" data-photo="${card.index}" style="transform: rotate(${card.rotation}deg);" aria-label="Ver foto ${card.index + 1}"><span class="polaroid__frame"><img src="${card.src}" alt=""/></span></button>`;
};

const buildBody = (plan: ContentPlan, copy: CardCopy): string => {
  let html = `<p class="card__greeting">Querida/o ${copy.recipient},</p>`;

  for (const paragraph of plan.paragraphs) {
    if (paragraph.empty) {
      html += '<div class="card__spacer"></div>';
      continue;
    }
    const inner = paragraph.segments
      .map((segment) =>
        segment.type === 'photo' ? polaroid(segment.card, 'inline') : segment.text.trim(),
      )
      .join(' ');
    html += `<div class="card__paragraph">${inner}</div>`;
  }

  if (plan.gallery.length > 0) {
    html += `<div class="card__gallery">${plan.gallery
      .map((card) => polaroid(card, 'gallery'))
      .join('')}</div>`;
  }

  return html;
};

export const buildCard = (
  plan: ContentPlan,
  copy: CardCopy,
  palette: ThemePalette,
  decor: ThemeDecor,
  gifts: [Gift, Gift],
  player: string,
): string => {
  const paint = paintFor(palette, decor);

  return `
    <div class="card" id="card">
      <div class="card__inner">
        <button type="button" class="card__close" id="close-card">${icon('lock', 13)} Cerrar</button>

        <!--
          Objetos asomando por detrás de la hoja: los márgenes laterales
          quedaban en blanco durante todo el desplazamiento. Van en porcentaje
          para que se repartan igual con una carta corta que con una larga.
        -->
        <span class="card__gift card__gift--left" aria-hidden="true">${giftSvg(
          gifts[0],
          94,
          paint,
        )}</span>
        <span class="card__gift card__gift--right" aria-hidden="true">${giftSvg(
          gifts[1],
          86,
          paint,
        )}</span>

        <!-- La hoja: el texto va sobre papel, no flotando sobre el fondo -->
        <div class="sheet">
          <span class="sheet__grain" aria-hidden="true"></span>
          <span class="sheet__edge" aria-hidden="true"></span>
          ${copy.monogram ? `<span class="sheet__monogram" aria-hidden="true">${copy.monogram}</span>` : ''}
          ${cornerFlourish(decor.metal, 40, 'tl')}
          ${cornerFlourish(decor.metal, 40, 'br')}

          <div class="sheet__content">
            <header class="sheet__head">
              <span class="card__eyebrow">${copy.title}</span>
              <h3 class="card__title">Para</h3>
              <p class="card__recipient">${copy.recipient}</p>
              ${ornament(decor.metal, 150, decor.motif)}
            </header>

            <div class="card__body">
              ${buildBody(plan, copy)}
              <div style="clear: both;"></div>

              <div class="sheet__sign">
                <span class="sheet__seal" aria-hidden="true">${motifSvg(decor.motif, 20, palette.accent)}</span>
                <span class="sheet__sign-text">
                  <span class="sheet__sign-label">De parte de</span>
                  <span class="card__signature">${copy.sender}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!--
          Cierre de la carta: los mismos objetos, apoyados bajo la hoja. Antes
          la lectura terminaba en seco en la firma y quedaba un tramo largo de
          fondo vacío hasta el reproductor.
        -->
        <div class="sheet__outro" aria-hidden="true">
          <span class="sheet__outro-rest"></span>
          ${giftSvg(gifts[0], 64, paint, 'sheet__outro-gift sheet__outro-gift--a')}
          <span class="sheet__outro-motif">${motifSvg(decor.motif, 15, decor.metal)}</span>
          ${giftSvg(gifts[1], 56, paint, 'sheet__outro-gift sheet__outro-gift--b')}
        </div>
        <span class="sheet__outro-orn">${ornament(decor.metal, 140, decor.motif)}</span>
        ${player}
      </div>
    </div>`;
};

/* ---------- Reproductor ---------- */

export const buildPlayer = (copy: CardCopy): string => {
  if (!copy.hasSong) return '';
  return `
    <div class="player" id="player">
      <a class="player__button" href="${copy.songUrl}" target="_blank" rel="noopener noreferrer" aria-label="Escuchar en YouTube">${icon(
        'note',
        17,
      )}</a>
      <div class="player__meta" data-song="${copy.songUrl}">
        <p class="player__title">Canción dedicada</p>
        <p class="player__hint">Toca para escuchar en YouTube</p>
      </div>
      <span class="player__icon">${icon('headphones', 17)}</span>
    </div>`;
};

/* ---------- Visor de fotos ---------- */

export const buildLightbox = (photoCount: number): string => {
  if (photoCount === 0) return '';
  const nav =
    photoCount > 1
      ? `<button type="button" class="lightbox__nav lightbox__nav--prev" id="photo-prev" aria-label="Anterior">${icon(
          'left',
          15,
        )}</button>
        <button type="button" class="lightbox__nav lightbox__nav--next" id="photo-next" aria-label="Siguiente">${icon(
          'right',
          15,
        )}</button>`
      : '';

  return `
    <div class="lightbox" id="lightbox">
      <button type="button" class="lightbox__close" id="photo-close" aria-label="Cerrar">${icon(
        'close',
        16,
      )}</button>
      <div class="lightbox__frame" id="lightbox-frame">
        <img class="lightbox__img" id="lightbox-img" src="" alt=""/>
        <p class="lightbox__counter" id="lightbox-counter">1 de ${photoCount}</p>
        ${nav}
      </div>
    </div>`;
};
