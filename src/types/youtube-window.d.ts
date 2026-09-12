/**
 * Lo que el script de la IFrame API cuelga de `window` y `@types/youtube` no
 * declara. Ambos son opcionales: no existen hasta que el script carga.
 */
interface Window {
  YT?: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
}
