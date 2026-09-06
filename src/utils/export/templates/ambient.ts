/**
 * Fondos ambientales del documento exportado, uno por cada tipo de animación.
 *
 * Antes sólo existían "hearts" y "stars"; los otros seis temas caían a un
 * resplandor genérico ámbar que además no coincidía con su paleta. Ahora hay
 * los ocho, y los keyframes que usan viven en `styles.ts`.
 */

const HEART_PATH =
  'M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z';

const PETAL_PATH =
  'M12 2C6.5 2 2 6.5 2 12c0 3.5 2 6.5 5 8 1.5-3 3.5-6 5-10 1.5 4 3.5 7 5 10 3-1.5 5-4.5 5-8 0-5.5-4.5-10-10-10z';

const LEAF_PATH = 'M17 8C8 10 6 16.5 4 20c.5-3.5 2.5-10 13-12zm0 0c-4 4-8 8.5-13 12';

const BUTTERFLY_PATH =
  'M12 12c-2-3-6-4-8-1 0 3 2 6 5 6 2 0 3-2 3-5zm0 0c2-3 6-4 8-1 0 3-2 6-5 6-2 0-3-2-3-5zm0 0c-1 3-3 7-5 9 3 0 5-2 5-9zm0 0c1 3 3 7 5 9-3 0-5-2-5-9z';

interface Orb {
  css: string;
  color: string;
  size: number;
  animation?: string;
}

interface Sprite {
  path: string;
  color: string;
  size: number;
  left: string;
  duration: string;
  delay: string;
  tx: string;
}

const orb = ({ css, color, size, animation }: Orb): string =>
  `<div class="ambient__orb" style="${css} width: ${size}px; height: ${size}px; background: ${color};${
    animation ? ` animation: ${animation};` : ''
  }"></div>`;

const sprite = (keyframe: string, s: Sprite): string =>
  `<svg class="ambient__sprite" viewBox="0 0 24 24" fill="${s.color}" style="left: ${s.left}; width: ${s.size}px; height: ${s.size}px; animation: ${keyframe} ${s.duration} infinite ease-in-out ${s.delay}; --tx: ${s.tx};"><path d="${s.path}"/></svg>`;

const strokeSprite = (keyframe: string, s: Sprite): string =>
  `<svg class="ambient__sprite" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="1.6" stroke-linecap="round" style="left: ${s.left}; width: ${s.size}px; height: ${s.size}px; animation: ${keyframe} ${s.duration} infinite ease-in-out ${s.delay}; --tx: ${s.tx};"><path d="${s.path}"/></svg>`;

const wrap = (inner: string): string => `<div class="ambient">${inner}</div>`;

/* 1. Corazones que suben — Romántico Clásico */
const hearts = (): string =>
  wrap(
    orb({ css: 'top: 25%; left: -40px;', color: 'rgba(253,164,175,0.28)', size: 192 }) +
      orb({ css: 'bottom: 25%; right: -40px;', color: 'rgba(244,114,182,0.24)', size: 224 }) +
      [
        { left: '10%', size: 20, duration: '9s', delay: '0s', tx: '15px' },
        { left: '30%', size: 14, duration: '7s', delay: '2.5s', tx: '-20px' },
        { left: '55%', size: 24, duration: '10s', delay: '1s', tx: '25px' },
        { left: '75%', size: 16, duration: '8s', delay: '4s', tx: '-15px' },
        { left: '88%', size: 20, duration: '11s', delay: '2s', tx: '10px' },
      ]
        .map((s) =>
          sprite('floatUpRomantic', { ...s, path: HEART_PATH, color: 'rgba(251,113,133,0.42)' }),
        )
        .join(''),
  );

/* 2. Pétalos que caen — Rosado Pastel */
const petals = (): string =>
  wrap(
    orb({ css: 'top: -40px; right: 40px;', color: 'rgba(254,205,211,0.35)', size: 176 }) +
      [
        { left: '15%', size: 16, duration: '8s', delay: '0s', tx: '20px' },
        { left: '35%', size: 12, duration: '6s', delay: '3s', tx: '-15px' },
        { left: '60%', size: 18, duration: '9s', delay: '1s', tx: '30px' },
        { left: '80%', size: 14, duration: '7s', delay: '4s', tx: '-25px' },
      ]
        .map((s) => sprite('petalFall', { ...s, path: PETAL_PATH, color: 'rgba(253,164,175,0.5)' }))
        .join(''),
  );

/* 3. Polvo de estrellas — Noche Estrellada */
const stars = (): string =>
  wrap(
    orb({ css: 'top: 48px; left: 50%; margin-left: -128px;', color: 'rgba(79,70,229,0.2)', size: 256 }) +
      orb({ css: 'bottom: 40px; right: 0;', color: 'rgba(251,191,36,0.14)', size: 208 }) +
      [
        { left: '15%', top: '18%', size: 11, delay: '0s' },
        { left: '75%', top: '25%', size: 15, delay: '1.2s' },
        { left: '22%', top: '62%', size: 12, delay: '0.6s' },
        { left: '82%', top: '78%', size: 13, delay: '1.8s' },
      ]
        .map(
          (s) =>
            `<span class="ambient__glyph ambient__pulse" style="left: ${s.left}; top: ${s.top}; font-size: ${s.size}px; color: rgba(254,243,199,0.85); animation-delay: ${s.delay};">&#10022;</span>`,
        )
        .join('') +
      [
        { left: '20%', size: 4, duration: '6s', delay: '0s' },
        { left: '45%', size: 6, duration: '8s', delay: '2s' },
        { left: '68%', size: 4, duration: '7s', delay: '1s' },
        { left: '85%', size: 8, duration: '9s', delay: '3s' },
      ]
        .map(
          (d) =>
            `<div class="ambient__sprite" style="left: ${d.left}; width: ${d.size}px; height: ${d.size}px; border-radius: 999px; background: rgba(253,230,138,0.65); filter: blur(0.5px); animation: stardustRise ${d.duration} infinite linear ${d.delay};"></div>`,
        )
        .join(''),
  );

/* 4. Destellos — Sueño de Lavanda */
const sparkles = (): string =>
  wrap(
    orb({ css: 'top: 40px; left: 40px;', color: 'rgba(167,139,250,0.26)', size: 208 }) +
      orb({ css: 'bottom: 40px; right: 40px;', color: 'rgba(165,180,252,0.24)', size: 240 }) +
      [
        { left: '12%', top: '25%', delay: '0s', duration: '3s', glyph: '&#10055;' },
        { left: '48%', top: '15%', delay: '1s', duration: '4s', glyph: '&#10022;' },
        { left: '78%', top: '40%', delay: '0.5s', duration: '3.5s', glyph: '&#10022;' },
        { left: '25%', top: '70%', delay: '2s', duration: '4.5s', glyph: '&#10055;' },
        { left: '70%', top: '82%', delay: '1.5s', duration: '3.2s', glyph: '&#10022;' },
      ]
        .map(
          (s) =>
            `<span class="ambient__glyph" style="left: ${s.left}; top: ${s.top}; font-size: 15px; color: rgba(167,139,250,0.75); animation: sparkleGlow ${s.duration} infinite ease-in-out ${s.delay};">${s.glyph}</span>`,
        )
        .join(''),
  );

/* 5. Hojas a la deriva — Jardín Esmeralda */
const leaves = (): string =>
  wrap(
    orb({ css: 'top: -48px; left: 25%;', color: 'rgba(110,231,183,0.26)', size: 224 }) +
      [
        { left: '15%', size: 18, duration: '9s', delay: '0s', tx: '25px' },
        { left: '40%', size: 15, duration: '7s', delay: '3s', tx: '-20px' },
        { left: '72%', size: 21, duration: '10s', delay: '1.5s', tx: '15px' },
      ]
        .map((s) =>
          strokeSprite('leafDrift', { ...s, path: LEAF_PATH, color: 'rgba(16,185,129,0.45)' }),
        )
        .join(''),
  );

/* 6. Luciérnagas — Medianoche Azul */
const fireflies = (): string =>
  wrap(
    orb({ css: 'top: 33%; left: 33%;', color: 'rgba(14,165,233,0.16)', size: 256 }) +
      [
        { left: '20%', top: '60%', size: 8, duration: '6s', delay: '0s', tx: '15px', ty: '-30px' },
        { left: '50%', top: '40%', size: 6, duration: '7s', delay: '2s', tx: '-20px', ty: '-40px' },
        { left: '75%', top: '70%', size: 10, duration: '8s', delay: '1s', tx: '25px', ty: '-20px' },
        { left: '30%', top: '25%', size: 8, duration: '6.5s', delay: '3s', tx: '-10px', ty: '30px' },
      ]
        .map(
          (f) =>
            `<div class="ambient__sprite" style="left: ${f.left}; top: ${f.top}; width: ${f.size}px; height: ${f.size}px; border-radius: 999px; background: #7dd3fc; box-shadow: 0 0 8px #38bdf8; animation: fireflyFloat ${f.duration} infinite ease-in-out ${f.delay}; --tx: ${f.tx}; --ty: ${f.ty};"></div>`,
        )
        .join(''),
  );

/* 7. Mariposas — Carta Vintage */
const butterflies = (): string =>
  wrap(
    orb({ css: 'top: 25%; left: 40px;', color: 'rgba(253,230,138,0.26)', size: 192 }) +
      [
        { left: '18%', size: 20, duration: '11s', delay: '0s', tx: '35px' },
        { left: '65%', size: 16, duration: '9s', delay: '4s', tx: '-25px' },
      ]
        .map((s) =>
          sprite('butterflyFly', { ...s, path: BUTTERFLY_PATH, color: 'rgba(180,83,9,0.35)' }),
        )
        .join(''),
  );

/* 8. Resplandor cálido — Atardecer Cálido y respaldo general */
const sunsetGlow = (): string =>
  wrap(
    `<div class="ambient__orb" style="top: -80px; left: -80px; width: 140%; height: 80%; border-radius: 999px; background: linear-gradient(to bottom right, rgba(252,211,77,0.3), rgba(253,186,116,0.18), transparent); animation: ambientGlow 8s infinite ease-in-out alternate;"></div>` +
      `<div class="ambient__orb" style="bottom: -80px; right: -80px; width: 140%; height: 80%; border-radius: 999px; background: linear-gradient(to top left, rgba(251,191,36,0.24), rgba(253,164,175,0.18), transparent); animation: ambientGlow 10s infinite ease-in-out alternate-reverse;"></div>` +
      [
        { left: '15%', size: 12, duration: '8s', delay: '0s' },
        { left: '50%', size: 16, duration: '10s', delay: '3s' },
        { left: '80%', size: 10, duration: '7s', delay: '1.5s' },
      ]
        .map(
          (b) =>
            `<div class="ambient__sprite" style="left: ${b.left}; width: ${b.size}px; height: ${b.size}px; border-radius: 999px; background: rgba(252,211,77,0.45); filter: blur(1px); animation: bokehFloat ${b.duration} infinite ease-in-out ${b.delay};"></div>`,
        )
        .join(''),
  );

const BUILDERS: Record<string, () => string> = {
  hearts,
  petals,
  stars,
  sparkles,
  leaves,
  fireflies,
  butterflies,
  sunsetGlow,
};

export const buildAmbient = (animationType: string): string =>
  (BUILDERS[animationType] ?? sunsetGlow)();
