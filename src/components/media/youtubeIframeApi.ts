import { YOUTUBE_IFRAME_API_URL } from '../../utils/youtube';

/**
 * Carga la IFrame Player API una sola vez y entrega el espacio `YT` listo.
 *
 * El script de YouTube avisa llamando a `window.onYouTubeIframeAPIReady`, un
 * único callback global. Si dos reproductores lo pidieran a la vez y cada uno
 * lo sobrescribiera, el primero nunca se enteraría; por eso la promesa se
 * comparte y el callback anterior, si lo hubiera, se encadena.
 */

let loading: Promise<typeof YT> | null = null;

export const loadYouTubeIframeApi = (): Promise<typeof YT> => {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (loading) return loading;

  loading = new Promise<typeof YT>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error('La IFrame API de YouTube cargó sin exponer YT.Player.'));
    };

    const script = document.createElement('script');
    script.src = YOUTUBE_IFRAME_API_URL;
    script.async = true;
    script.onerror = () => {
      loading = null;
      reject(new Error('No se pudo cargar la IFrame API de YouTube.'));
    };
    document.head.appendChild(script);
  });

  return loading;
};

/** Solo para pruebas: olvida una carga en curso entre casos. */
export const resetYouTubeIframeApi = (): void => {
  loading = null;
};
