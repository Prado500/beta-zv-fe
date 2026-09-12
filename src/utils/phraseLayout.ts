/**
 * La frase suspendida: tiempos y tamaño de letra.
 *
 * Compartido entre la previa (`scenes/PhraseScene.tsx`) y el HTML descargable
 * (`utils/export`), para que la frase entre igual en los dos.
 */

/** Duración total de la escena; quien la muestra espera esto antes de seguir. */
export const PHRASE_TOTAL_MS = 2800;

export const PHRASE_ENTER_MS = 700;
export const PHRASE_WORD_MS = 520;
/** Escalonado entre palabras; se comprime para que la entrada quepa en ENTER. */
export const PHRASE_WORD_STAGGER_MS = 80;
export const PHRASE_EXIT_MS = 420;
export const PHRASE_EXIT_AT_MS = PHRASE_TOTAL_MS - PHRASE_EXIT_MS;

/** Tamaño según largo: la script cabe en 4 líneas como mucho a 320 px. */
export const phraseSize = (length: number): string => {
  if (length <= 28) return '2.35rem';
  if (length <= 48) return '2rem';
  if (length <= 70) return '1.75rem';
  return '1.55rem';
};

/** Escalonado real: la entrada completa cabe en ENTER aunque haya 20 palabras. */
export const phraseStep = (wordCount: number): number =>
  Math.min(PHRASE_WORD_STAGGER_MS, (PHRASE_ENTER_MS - PHRASE_WORD_MS) / Math.max(1, wordCount - 1));

/* Ojo con los acentos graves aquí dentro: cierran la plantilla antes de tiempo. */
export const PHRASE_CSS = `
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
  animation: phraseExit ${PHRASE_EXIT_MS}ms var(--ease) ${PHRASE_EXIT_AT_MS}ms forwards;
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
  animation: phraseWord ${PHRASE_WORD_MS}ms var(--ease) var(--d) forwards;
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
