import React, { useMemo } from 'react';
import type { ThemePalette } from '../../../../utils/themePalette';

/**
 * Momento 3: la frase suspendida.
 *
 * Antes de la carta completa, sólo la primera frase del mensaje, centrada, en
 * la tipografía script, sin nada más en pantalla. Entra palabra por palabra,
 * se sostiene, y se retira dando paso a la dedicatoria.
 *
 * La frase la extrae `utils/firstPhrase.ts`.
 */

/** Duración total de la escena; PhonePreview espera esto antes de la carta. */
export const PHRASE_TOTAL_MS = 2800;

const ENTER_MS = 700;
const WORD_MS = 520;
/** Escalonado entre palabras; se comprime para que la entrada quepa en ENTER_MS. */
const WORD_STAGGER_MS = 80;
const EXIT_MS = 420;
const EXIT_AT_MS = PHRASE_TOTAL_MS - EXIT_MS;

/** Tamaño según largo: la script cabe en 4 líneas como mucho a 320 px. */
const sizeFor = (length: number): string => {
  if (length <= 28) return '2.35rem';
  if (length <= 48) return '2rem';
  if (length <= 70) return '1.75rem';
  return '1.55rem';
};

const CSS = `
.phrase-scene {
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  inset: 0;
  z-index: 45;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 32px;
  pointer-events: none;
  animation: phraseExit ${EXIT_MS}ms var(--ease) ${EXIT_AT_MS}ms forwards;
}
.phrase-scene__text {
  font-family: 'Great Vibes', 'Playfair Display', cursive;
  line-height: 1.32;
  text-align: center;
  margin: 0;
  max-width: 300px;
  overflow-wrap: anywhere;
}
.phrase-scene__word {
  display: inline-block;
  opacity: 0;
  transform: translateY(10px);
  animation: phraseWord ${WORD_MS}ms var(--ease) var(--d) forwards;
}
@keyframes phraseWord {
  to { opacity: 1; transform: translateY(0); }
}
@keyframes phraseExit {
  to { opacity: 0; transform: translateY(-10px); }
}
/* La frase se muestra también con "Reducir movimiento": es contenido. Las
   palabras entran sin desplazamiento, sólo en fundido. */
@media (prefers-reduced-motion: reduce) {
  .phrase-scene__word { transform: none; }
}
`;

interface PhraseSceneProps {
  phrase: string;
  palette: ThemePalette;
}

export const PhraseScene: React.FC<PhraseSceneProps> = ({ phrase, palette }) => {
  const words = useMemo(() => phrase.split(' ').filter(Boolean), [phrase]);
  // Entrada completa en ENTER_MS aunque la frase tenga 20 palabras
  const step = Math.min(WORD_STAGGER_MS, (ENTER_MS - WORD_MS) / Math.max(1, words.length - 1));

  return (
    <div className="phrase-scene" aria-live="polite">
      <style>{CSS}</style>
      <p className="phrase-scene__text" style={{ color: palette.accent, fontSize: sizeFor(phrase.length) }}>
        {words.map((word, i) => (
          <React.Fragment key={i}>
            <span
              className="phrase-scene__word"
              style={{ '--d': `${Math.round(i * step)}ms` } as React.CSSProperties}
            >
              {word}
            </span>
            {i < words.length - 1 ? ' ' : null}
          </React.Fragment>
        ))}
      </p>
    </div>
  );
};
