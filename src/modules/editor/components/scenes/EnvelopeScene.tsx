import React from 'react';
import { CornerFlourish, Garland, Gift, Motif, Ornament } from '../../../../components/decor';
import { hexToRgb, rgbToHex, withAlpha, type ThemePalette } from '../../../../utils/themePalette';
import type { EdgeCss, TextureCss, ThemeDecor } from '../../../../utils/themeDecor';
import type { Gift as GiftName, GiftPaint } from '../../../../utils/themeGifts';

/**
 * Momento 1: el sobre cerrado y su apertura.
 *
 * Fases:
 *  - closed:   el sobre espera el toque. Llega deslizándose y el lacre respira.
 *  - opening:  ~1000 ms encadenados — se despeja la escena, el lacre se parte
 *              y cae, la solapa gira hacia atrás sobre su bisagra y la carta
 *              sale de adentro. Sin cortes: el estado `blooming` llega cuando
 *              la carta ya está fuera.
 *  - blooming: sólo queda la carta, que se disuelve mientras arranca la
 *              floración.
 *
 * Toda la coreografía es CSS sobre `transform` y `opacity`, con una sola curva.
 * La solapa usa dos caras (frontal y trasera) con `backface-visibility` y la
 * misma bisagra como `transform-origin`: así no hay que animar `z-index` para
 * que la solapa abierta quede detrás de la carta que sube.
 */

export type EnvelopePhase = 'closed' | 'opening' | 'blooming';

interface EnvelopeSceneProps {
  phase: EnvelopePhase;
  palette: ThemePalette;
  decor: ThemeDecor;
  paint: GiftPaint;
  gifts: [GiftName, GiftName];
  texture: TextureCss;
  edge: EdgeCss | null;
  title: string;
  recipient: string;
  sender: string;
  onOpen: () => void;
}

/**
 * Duración total de la apertura; PhonePreview espera esto antes de florecer.
 *
 * La carta termina de salir a los ~1440 ms y el resto es pausa: el nombre de
 * ella se queda solo en pantalla el tiempo suficiente para leerlo. Antes toda
 * la coreografía cabía en 1 s y el nombre pasaba de largo.
 */
export const ENVELOPE_OPEN_MS = 2100;

/** Interpola dos colores hex. */
const mix = (from: string, to: string, t: number): string => {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return rgbToHex({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  });
};

const CSS = `
.env-scene {
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --letter-rise: -150px;
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.env-scene.is-open { cursor: default; pointer-events: none; }

/* ---- Llegada del sobre ---- */
.env-center {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: envArrive 600ms var(--ease) both;
}
@keyframes envArrive {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ---- Marco y adornos que se retiran al abrir ---- */
.env-frame {
  position: absolute;
  inset: 10px;
  border-radius: 26px;
  pointer-events: none;
}
.env-garland { display: block; line-height: 0; margin-bottom: 4px; opacity: 0.95; }
.env-gifts {
  position: relative;
  z-index: 0;
  margin-top: -32px;
  display: flex;
  width: 280px;
  align-items: flex-end;
  justify-content: space-between;
}
.env-gifts__rest {
  position: absolute;
  bottom: 6px;
  left: 50%;
  width: 224px;
  height: 24px;
  transform: translateX(-50%);
  border-radius: 50%;
  filter: blur(10px);
}
.env-gift { position: relative; line-height: 0; }
.env-gift--l { transform: rotate(-7deg); }
.env-gift--r { transform: rotate(8deg); }
.env-hint {
  margin-top: 20px;
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  animation: envHint 2.4s var(--ease) infinite;
}
@keyframes envHint {
  0%, 100% { opacity: 0.9; }
  50%      { opacity: 0.45; }
}

/* ---- El sobre ---- */
.env-stack {
  position: relative;
  z-index: 10;
  width: 250px;
  transition: transform 150ms var(--ease);
}
.env-scene:not(.is-open):active .env-stack { transform: scale(0.985); }

.env-body {
  position: relative;
  z-index: 3;
  width: 100%;
  padding: 92px 20px 24px;
  border-radius: 16px;
  box-shadow: 0 22px 44px -18px rgba(0, 0, 0, 0.45);
}
.env-body__layer {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  pointer-events: none;
}
.env-body__edge {
  position: absolute;
  inset: 8px;
  border-radius: 10px;
  pointer-events: none;
}
.env-body__content { position: relative; text-align: center; }
.env-body__title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
  margin: 0;
}
.env-body__label {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.65;
  margin: 0;
}
.env-body__sender {
  font-family: 'Great Vibes', 'Playfair Display', cursive;
  font-size: 1.9rem;
  line-height: 1;
  padding-bottom: 2px;
  margin: 0;
}

/* Solapa: dos caras sobre la misma bisagra (el borde superior del sobre) */
.env-flap {
  position: absolute;
  left: 0;
  width: 100%;
  height: 60px;
  pointer-events: none;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  will-change: transform;
}
.env-flap svg { display: block; width: 100%; height: 100%; }
.env-flap--front {
  top: 0;
  z-index: 4;
  transform-origin: 50% 0%;
  transform: perspective(800px) rotateX(0deg);
}
.env-flap--back {
  top: -60px;
  z-index: 1;
  transform-origin: 50% 100%;
  transform: perspective(800px) rotateX(180deg);
}

/* Lacre en dos mitades, para poder partirlo */
.env-seal {
  position: absolute;
  left: 50%;
  top: 56px;
  z-index: 5;
  width: 48px;
  height: 48px;
  margin: -24px 0 0 -24px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform, opacity;
}
.env-seal--l { clip-path: inset(0 50% 0 0); }
.env-seal--r { clip-path: inset(0 0 0 50%); }

/*
 * La sombra va en su propia pieza, detrás de las dos mitades.
 *
 * Puesta sobre las mitades quedaba recortada por el mismo clip-path que las
 * parte, y como ese recorte es rectangular la sombra salía como un cuadro gris
 * con bordes duros alrededor del lacre. Aquí el disco no se recorta, así que
 * la sombra vuelve a ser redonda; al abrirse el sobre se desvanece y las
 * mitades se van cada una por su lado sin arrastrarla.
 *
 * (Ojo con los acentos graves en este comentario: va dentro de la plantilla
 *  de CSS, y uno solo la cierra antes de tiempo.)
 */
.env-seal-shade {
  position: absolute;
  left: 50%;
  top: 56px;
  z-index: 4;
  width: 48px;
  height: 48px;
  margin: -24px 0 0 -24px;
  border-radius: 999px;
  box-shadow: 0 6px 14px -4px rgba(0, 0, 0, 0.45);
  transition: opacity 200ms var(--ease);
}
.is-open .env-seal-shade { opacity: 0; }
.env-scene:not(.is-open) .env-seal,
.env-scene:not(.is-open) .env-seal-shade { animation: envBreathe 2.6s var(--ease) infinite; }
@keyframes envBreathe {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.06); }
}

/* La carta, guardada entre la cara trasera y la frontal del sobre */
.env-letter {
  position: absolute;
  left: 12px;
  right: 12px;
  top: 14px;
  height: 172px;
  z-index: 2;
  padding: 22px 16px 0;
  border-radius: 14px;
  box-shadow: 0 14px 30px -16px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  will-change: transform, opacity;
}
.env-letter__grain {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  pointer-events: none;
}
.env-letter__eyebrow {
  position: relative;
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  opacity: 0.7;
  margin: 0 0 4px;
}
.env-letter__name {
  position: relative;
  font-family: 'Great Vibes', 'Playfair Display', cursive;
  line-height: 1.1;
  margin: 0 0 6px;
  overflow-wrap: anywhere;
}
.env-letter__orn { position: relative; display: block; margin: 0 auto; }

/* ---- Apertura (~2100 ms) ----
 * 0–500    se despeja la escena
 * 0–560    el lacre se parte y cae
 * 220–1000 la solapa gira hacia atrás
 * 620–1440 la carta sale del sobre
 * 1000–1320 el cuerpo del sobre se retira
 * 1440–2100 pausa: el nombre de ella, solo en pantalla
 */
.is-open .env-fade   { animation: envFade 500ms var(--ease) forwards; }
.is-open .env-gifts  { animation: envGiftsOut 500ms var(--ease) forwards; }
.is-open .env-hint   { animation: envFade 350ms var(--ease) forwards; }
.is-open .env-stack  { animation: envLift 500ms var(--ease) forwards; }
.is-open .env-seal--l { animation: envSealL 560ms var(--ease) forwards; }
.is-open .env-seal--r { animation: envSealR 560ms var(--ease) forwards; }
.is-open .env-flap--front {
  animation:
    envFlapFront 780ms var(--ease) 220ms forwards,
    envFade 300ms var(--ease) 1000ms forwards;
}
.is-open .env-flap--back {
  animation:
    envFlapBack 780ms var(--ease) 220ms forwards,
    envFade 300ms var(--ease) 1000ms forwards;
}
.is-open .env-letter { animation: envLetterRise 820ms var(--ease) 620ms forwards; }
.is-open .env-body   { animation: envBodyOut 320ms var(--ease) 1000ms forwards; }
.is-blooming .env-letter { animation: envLetterOut 620ms var(--ease) forwards; }

@keyframes envFade { to { opacity: 0; } }
@keyframes envGiftsOut { to { opacity: 0; transform: translateY(6px); } }
@keyframes envLift { to { transform: translateY(-6px); } }
@keyframes envSealL { to { transform: translate(-16px, 46px) rotate(-28deg); opacity: 0; } }
@keyframes envSealR { to { transform: translate(16px, 46px) rotate(28deg); opacity: 0; } }
@keyframes envFlapFront { to { transform: perspective(800px) rotateX(-180deg); } }
@keyframes envFlapBack  { to { transform: perspective(800px) rotateX(0deg); } }
@keyframes envLetterRise {
  from { transform: translateY(0) scale(0.94); }
  to   { transform: translateY(var(--letter-rise)) scale(1); }
}
@keyframes envBodyOut { to { opacity: 0; transform: translateY(10px); } }
@keyframes envLetterOut {
  from { transform: translateY(var(--letter-rise)) scale(1); opacity: 1; }
  to   { transform: translateY(calc(var(--letter-rise) - 12px)) scale(1.08); opacity: 0; }
}

/* "Reducir movimiento": la apertura se ve igual (es la escena); sólo se
   apagan los latidos de invitación, que son lo que de verdad molesta. */
@media (prefers-reduced-motion: reduce) {
  .env-scene:not(.is-open) .env-seal,
  .env-scene:not(.is-open) .env-seal-shade { animation: none; }
  .env-hint { animation: none; opacity: 0.9; }
}
`;

export const EnvelopeScene: React.FC<EnvelopeSceneProps> = ({
  phase,
  palette,
  decor,
  paint,
  gifts,
  texture,
  edge,
  title,
  recipient,
  sender,
  onOpen,
}) => {
  const isOpen = phase !== 'closed';
  const [giftLeft, giftRight] = gifts;

  /** Papel de la carta: un punto más claro (o más oscuro) que el sobre. */
  const letterPaper = palette.isDark
    ? mix(palette.cardBg, '#000000', 0.32)
    : mix(palette.cardBg, '#ffffff', 0.55);
  /** Cara interior de la solapa: el mismo papel, apenas sombreado. */
  const flapBack = mix(palette.cardBg, palette.text, 0.07);

  const restShadow = `drop-shadow(0 9px 11px ${withAlpha(palette.text, 0.3)})`;
  const nameSize = recipient.length > 16 ? '1.55rem' : '2rem';

  const seal = (side: 'l' | 'r') => (
    <span
      aria-hidden="true"
      className={`env-seal env-seal--${side}`}
      style={{
        backgroundColor: palette.accent,
        border: `2px solid ${withAlpha(decor.metal, 0.75)}`,
      }}
    >
      <Motif motif={decor.motif} size={22} color={palette.cardBg} />
    </span>
  );

  return (
    <div
      className={`env-scene${isOpen ? ' is-open' : ''}${phase === 'blooming' ? ' is-blooming' : ''}`}
      onClick={() => {
        if (phase === 'closed') onOpen();
      }}
      role="button"
      aria-label="Abrir la carta"
      tabIndex={0}
      onKeyDown={(e) => {
        if (phase === 'closed' && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <style>{CSS}</style>

      {/* Marco interior: encierra la composición como una invitación */}
      <span
        aria-hidden="true"
        className="env-frame env-fade"
        style={{
          border: `1px solid ${withAlpha(decor.metal, 0.45)}`,
          boxShadow: `inset 0 0 0 3px ${withAlpha(decor.metal, 0.1)}`,
        }}
      />
      <CornerFlourish corner="tl" color={decor.metal} size={54} placement="top-5 left-5" className="env-fade opacity-40" />
      <CornerFlourish corner="tr" color={decor.metal} size={54} placement="top-5 right-5" className="env-fade opacity-40" />
      <CornerFlourish corner="bl" color={decor.metal} size={54} placement="bottom-5 left-5" className="env-fade opacity-40" />
      <CornerFlourish corner="br" color={decor.metal} size={54} placement="bottom-5 right-5" className="env-fade opacity-40" />

      <div className="env-center">
        <Garland paint={paint} width={238} className="env-garland env-fade" />

        <div className="env-stack">
          {/* Cara interior de la solapa: sólo se ve cuando ya giró */}
          <div className="env-flap env-flap--back" aria-hidden="true">
            <svg viewBox="0 0 250 60" preserveAspectRatio="none">
              <path
                d="M0 60 H250 V52 L125 4 L0 52 Z"
                fill={flapBack}
                stroke={withAlpha(decor.metal, 0.55)}
                strokeWidth="1"
              />
            </svg>
          </div>

          {/* La carta que va a salir */}
          <div
            className="env-letter"
            aria-hidden="true"
            style={{ backgroundColor: letterPaper, border: `1px solid ${palette.border}` }}
          >
            <span
              className="env-letter__grain"
              style={{
                backgroundImage: texture.backgroundImage,
                backgroundSize: texture.backgroundSize,
                opacity: texture.opacity,
              }}
            />
            <p className="env-letter__eyebrow" style={{ color: palette.text }}>
              Para
            </p>
            <p className="env-letter__name" style={{ color: palette.accent, fontSize: nameSize }}>
              {recipient}
            </p>
            <Ornament color={decor.metal} motif={decor.motif} width={120} className="env-letter__orn opacity-90" />
          </div>

          {/* Cuerpo del sobre */}
          <div
            className="env-body"
            style={{ backgroundColor: palette.cardBg, border: `1px solid ${palette.border}` }}
          >
            <span
              aria-hidden="true"
              className="env-body__layer"
              style={{
                backgroundImage: texture.backgroundImage,
                backgroundSize: texture.backgroundSize,
                opacity: texture.opacity,
              }}
            />
            {edge && (
              <span
                aria-hidden="true"
                className="env-body__edge"
                style={{ border: edge.border, boxShadow: edge.boxShadow }}
              />
            )}
            <CornerFlourish corner="bl" color={decor.metal} size={38} placement="bottom-3 left-3" className="opacity-55" />
            <CornerFlourish corner="br" color={decor.metal} size={38} placement="bottom-3 right-3" className="opacity-55" />

            <div className="env-body__content">
              <h2 className="env-body__title" style={{ color: palette.text }}>
                {title}
              </h2>
              <Ornament color={decor.metal} motif={decor.motif} width={124} className="mx-auto my-2 opacity-95" />
              <p className="env-body__label" style={{ color: palette.text }}>
                De parte de
              </p>
              <p className="env-body__sender" style={{ color: palette.accent }}>
                {sender}
              </p>
            </div>
          </div>

          {/* Cara frontal de la solapa */}
          <div className="env-flap env-flap--front" aria-hidden="true">
            <svg viewBox="0 0 250 60" preserveAspectRatio="none">
              <path
                d="M0 0 H250 V8 L125 56 L0 8 Z"
                fill={withAlpha(palette.accent, 0.1)}
                stroke={withAlpha(decor.metal, 0.55)}
                strokeWidth="1"
              />
            </svg>
          </div>

          <span className="env-seal-shade" aria-hidden="true" />
          {seal('l')}
          {seal('r')}
        </div>

        {/* Los objetos del tema, apoyados bajo el sobre */}
        <div className="env-gifts" aria-hidden="true">
          <span className="env-gifts__rest" style={{ backgroundColor: withAlpha(palette.text, 0.2) }} />
          <Gift gift={giftLeft} paint={paint} size={76} className="env-gift env-gift--l" style={{ filter: restShadow }} />
          <Gift gift={giftRight} paint={paint} size={66} className="env-gift env-gift--r" style={{ filter: restShadow }} />
        </div>

        <p
          className="env-hint"
          style={{ color: palette.text, backgroundColor: withAlpha(palette.cardBg, 0.75) }}
        >
          Toca para abrir
        </p>
      </div>
    </div>
  );
};
