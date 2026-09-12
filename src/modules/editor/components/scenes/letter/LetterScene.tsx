import React, { useEffect, useMemo, useState } from 'react';
import { CornerFlourish, Garland, Gift, Motif, Ornament } from '../../../../../components/decor';
import { withAlpha, type ThemePalette } from '../../../../../utils/themePalette';
import type { EdgeCss, TextureCss, ThemeDecor } from '../../../../../utils/themeDecor';
import type { Gift as GiftName, GiftPaint } from '../../../../../utils/themeGifts';
import { LETTER_CSS } from './letterCss';
import { planBlocks } from './letterBlocks';
import { LetterBody } from './LetterBody';
import { Signature } from './Signature';
import { Seal } from './Seal';
import { useAutoScroll } from './useAutoScroll';
import { useRevealOnScroll } from './useRevealOnScroll';

/**
 * La carta completa y su cierre (momento 5).
 *
 * - Cuerpo a 17 px, interlineado 1.7, alineado a la izquierda, sobre una hoja
 *   a todo el ancho con márgenes reales. Las fotos van entre párrafos, no
 *   flotando: a 17 px en 360 px no cabe texto al lado de una polaroid.
 * - Cada bloque entra al hacer scroll, una sola vez (`useRevealOnScroll`).
 * - La firma se escribe sola (`Signature`) y después mantener presionado
 *   sella la carta con lacre (`Seal`). Debajo, la marca.
 * - "Nuestra canción" no la pinta esta escena: recibe el reproductor ya
 *   armado en `song` y lo coloca al final, tras la firma. Así el reproductor
 *   visible, su estado y sus políticas viven en un solo sitio.
 *
 * Está siempre montada, también con el sobre cerrado: el reproductor tiene
 * que existir antes del toque, y al activarse solo cambia de opacidad.
 */

/**
 * Los objetos del tema asomando por los costados, cortados por el borde.
 * `top` va en % de la carta para que se repartan igual con un mensaje corto
 * que con uno largo. Alternan lado y objeto (índice 0 o 1 del par del tema).
 */
const DECOR_GIFTS = [
  { top: 14, side: 'l' as const, gift: 0, size: 96, rot: -9 },
  { top: 37, side: 'r' as const, gift: 1, size: 88, rot: 8 },
  { top: 60, side: 'l' as const, gift: 1, size: 84, rot: 7 },
  { top: 82, side: 'r' as const, gift: 0, size: 92, rot: -6 },
];

/**
 * Motivos del tema regados por el fondo, pegados a los costados para que la
 * hoja sólo les tape un borde. Posiciones fijas, no aleatorias: la carta se ve
 * igual cada vez que se abre.
 */
const DECOR_DUST = [
  { x: 7, y: 6, size: 16, rot: -14, alpha: 0.16, tint: 'metal' as const },
  { x: 92, y: 11, size: 13, rot: 20, alpha: 0.14, tint: 'accent' as const },
  { x: 4, y: 21, size: 12, rot: 8, alpha: 0.12, tint: 'accent' as const },
  { x: 95, y: 28, size: 15, rot: -18, alpha: 0.15, tint: 'metal' as const },
  { x: 6, y: 44, size: 14, rot: 16, alpha: 0.13, tint: 'metal' as const },
  { x: 93, y: 50, size: 11, rot: -10, alpha: 0.12, tint: 'accent' as const },
  { x: 3, y: 66, size: 15, rot: -6, alpha: 0.15, tint: 'accent' as const },
  { x: 96, y: 71, size: 13, rot: 22, alpha: 0.13, tint: 'metal' as const },
  { x: 8, y: 87, size: 12, rot: 12, alpha: 0.12, tint: 'metal' as const },
  { x: 91, y: 93, size: 16, rot: -16, alpha: 0.15, tint: 'accent' as const },
];

export interface LetterSceneProps {
  active: boolean;
  title: string;
  recipient: string;
  sender: string;
  message: string;
  /** URLs pintables de las fotos, en el orden del formulario. */
  photos: string[];
  monogram: string;
  /** Id del tema. Sólo se usa para reiniciar el lacre al cambiarlo. */
  themeId: string;
  palette: ThemePalette;
  decor: ThemeDecor;
  paint: GiftPaint;
  gifts: [GiftName, GiftName];
  texture: TextureCss;
  edge: EdgeCss | null;
  /**
   * Contenedor con scroll de la carta. Lo entrega quien la monta para poder
   * medir contra él —el chip de la canción sabe así cuándo el reproductor
   * quedó fuera de la vista— y la escena lo usa para sus propios efectos.
   */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /** "Nuestra canción": el reproductor visible, bajo el membrete y antes del texto. */
  song?: React.ReactNode;
  /** Modo demo: la carta se desplaza sola y se sella sola, para grabarla. */
  demo?: boolean;
  onClose: () => void;
  onOpenPhoto: (index: number) => void;
}

export const LetterScene: React.FC<LetterSceneProps> = ({
  active,
  title,
  recipient,
  sender,
  message,
  photos,
  monogram,
  themeId,
  palette,
  decor,
  paint,
  gifts,
  texture,
  edge,
  scrollRef,
  song,
  demo = false,
  onClose,
  onOpenPhoto,
}) => {
  const [signed, setSigned] = useState(false);
  const [hint, setHint] = useState<'off' | 'on' | 'gone'>('off');
  const blocks = useMemo(() => planBlocks(message, photos.length), [message, photos.length]);

  /**
   * Aviso de que hay más carta abajo. Sólo aparece si el contenido no cabe, y
   * se va al primer desplazamiento: con una dedicatoria larga, quien la recibe
   * puede quedarse en la primera pantalla sin saber que sigue.
   */
  useEffect(() => {
    const el = scrollRef.current;
    if (!active || !el || demo) return;

    const check = () => {
      if (el.scrollHeight - el.clientHeight > 60) setHint((h) => (h === 'off' ? 'on' : h));
    };
    const onScroll = () => {
      if (el.scrollTop > 30) setHint((h) => (h === 'on' ? 'gone' : h));
    };
    const t = window.setTimeout(check, 400);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(t);
      el.removeEventListener('scroll', onScroll);
    };
  }, [scrollRef, active, demo, blocks]);

  const { backToTop } = useAutoScroll({ scrollRef, active, demo, contentKey: blocks });
  useRevealOnScroll({ scrollRef, active, contentKey: blocks });

  return (
    <div
      className={`letter absolute inset-0 z-10 overflow-hidden transition-all duration-1000 ease-in-out ${
        active ? 'is-active opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-95'
      }`}
    >
      <style>{LETTER_CSS}</style>

      <div ref={scrollRef} className="letter__scroll">
        <div className="relative z-10 w-full min-h-full px-6 pt-14 pb-10 flex flex-col items-center">
          {/* Los dibujos del tema, detrás de la hoja, que les tapa un borde */}
          <div className="letter-stage">
            <div className="letter-decor" aria-hidden="true">
              {DECOR_GIFTS.map((g, i) => (
                <span
                  key={`g-${i}`}
                  className={`letter-decor__gift letter-decor__gift--${g.side}`}
                  style={{ top: `${g.top}%`, transform: `rotate(${g.rot}deg)` }}
                >
                  <Gift
                    gift={gifts[g.gift]}
                    paint={paint}
                    size={g.size}
                    style={{ filter: `drop-shadow(0 8px 10px ${withAlpha(palette.text, 0.22)})` }}
                  />
                </span>
              ))}
              {DECOR_DUST.map((d, i) => (
                <span
                  key={`d-${i}`}
                  className="letter-decor__motif"
                  style={{
                    left: `${d.x}%`,
                    top: `${d.y}%`,
                    transform: `translate(-50%, -50%) rotate(${d.rot}deg)`,
                    opacity: d.alpha,
                  }}
                >
                  <Motif
                    motif={decor.motif}
                    size={d.size}
                    color={d.tint === 'accent' ? palette.accent : decor.metal}
                  />
                </span>
              ))}
            </div>

            <article
              className="letter-sheet"
              style={{
                backgroundColor: palette.cardBg,
                border: `1px solid ${palette.border}`,
                /* Dos hojas más asomando por detrás: el papel gana grosor */
                boxShadow: `0 18px 40px -18px rgba(0, 0, 0, 0.35),
                  5px 6px 0 -1px ${withAlpha(palette.border, 0.85)},
                  10px 12px 0 -3px ${withAlpha(palette.border, 0.5)}`,
              }}
            >
              <span
                aria-hidden="true"
                className="letter-sheet__layer"
                style={{
                  backgroundImage: texture.backgroundImage,
                  backgroundSize: texture.backgroundSize,
                  opacity: texture.opacity,
                }}
              />
              {edge && (
                <span
                  aria-hidden="true"
                  className="letter-sheet__edge"
                  style={{ border: edge.border, boxShadow: edge.boxShadow }}
                />
              )}
              {monogram && (
                <span aria-hidden="true" className="letter-sheet__monogram" style={{ color: palette.accent }}>
                  {monogram}
                </span>
              )}
              <CornerFlourish corner="tl" color={decor.metal} size={40} placement="top-3 left-3" className="opacity-60" />
              <CornerFlourish corner="br" color={decor.metal} size={40} placement="bottom-3 right-3" className="opacity-60" />

              <header
                className="letter-head reveal"
                data-reveal
                style={{
                  backgroundImage: `linear-gradient(to bottom, ${withAlpha(palette.accent, 0.1)}, ${withAlpha(palette.accent, 0)})`,
                  borderBottom: `1px solid ${withAlpha(decor.metal, 0.35)}`,
                }}
              >
                <Garland paint={paint} width={188} className="letter-head__garland" />
                <span className="letter-head__eyebrow" style={{ color: palette.accent }}>
                  {title}
                </span>
                <h3 className="letter-head__para" style={{ color: palette.text }}>
                  Para
                </h3>
                <p className="letter-head__name" style={{ color: palette.accent }}>
                  {recipient}
                </p>
                <Ornament color={decor.metal} motif={decor.motif} width={150} className="mx-auto opacity-95" />
              </header>

              <div className="letter-body">
                <p className="letter-greeting reveal" data-reveal style={{ color: palette.accent }}>
                  Querida/o {recipient},
                </p>

                <LetterBody
                  blocks={blocks}
                  photos={photos}
                  palette={palette}
                  decor={decor}
                  onOpenPhoto={onOpenPhoto}
                />

                <div className="sign reveal" data-reveal>
                  <span
                    className="sign__seal"
                    aria-hidden="true"
                    style={{
                      backgroundColor: withAlpha(palette.accent, 0.18),
                      border: `1px solid ${withAlpha(palette.accent, 0.35)}`,
                    }}
                  >
                    <Motif motif={decor.motif} size={20} color={palette.accent} />
                  </span>
                  <div className="sign__text">
                    <span className="sign__label" style={{ color: palette.text }}>
                      De parte de
                    </span>
                    <Signature name={sender} color={palette.accent} root={scrollRef} onSigned={() => setSigned(true)} />
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/*
            "Nuestra canción", al final: la carta se lee de un tirón y la música
            aparece cuando ya se firmó. Va fuera de la hoja, apoyada sobre el
            fondo del tema.

            Lo que cuesta bajarla: al abrirse la carta el reproductor queda bajo
            el pliegue, y YouTube pide verlo para arrancar solo. Si lo rechaza,
            el mando flotante —que aparece justo mientras el vídeo no se ve—
            lo dice y un toque lleva hasta él.
          */}
          {song && <div className="letter-song">{song}</div>}

          {/* Sellar no corta la canción: la música sólo se detiene al cerrar */}
          {/*
            La llave con el tema reinicia el lacre al cambiar de estilo. Sin
            ella la carta se quedaba sellada de la prueba anterior y no había
            forma de volver a probar el gesto sin recargar.
          */}
          <Seal key={themeId} ready={signed} palette={palette} decor={decor} paint={paint} gifts={gifts} auto={demo} />

          {/* Sube otra vez al principio de la carta, con la música intacta */}
          <button
            type="button"
            className="replay"
            onClick={backToTop}
            style={{ color: palette.text, borderColor: withAlpha(decor.metal, 0.55) }}
          >
            <span className="material-symbols-outlined text-[16px]">expand_less</span>
            Volver a leerla
          </button>

          <p className="brand" style={{ color: palette.text }}>
            ZyvenCore
          </p>
        </div>
      </div>

      {/* Fuera del scroll: antes se perdía de vista al bajar por la carta */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 z-30 min-h-11 px-4 rounded-full flex items-center gap-1.5 text-[12px] text-white bg-black/25 hover:bg-black/40 backdrop-blur-md transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[14px]">lock</span> Cerrar
      </button>

      {/* "Hay más abajo": se va al primer desplazamiento */}
      {hint !== 'off' && (
        <div className={`letter__hint${hint === 'gone' ? ' is-gone' : ''}`} aria-hidden="true">
          <span className="letter__hint-bob">
            <svg width="24" height="13" viewBox="0 0 24 13" fill="none">
              <path
                d="M2 2 L12 11 L22 2"
                stroke={decor.metal}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      )}
    </div>
  );
};
