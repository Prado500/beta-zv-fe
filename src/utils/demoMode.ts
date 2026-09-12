/**
 * Modo demostración: `?demo=1` en la URL.
 *
 * La carta tiene dos pasos que exigen la mano de quien la recibe —descubrir
 * las fotos una a una y mantener presionado el lacre—, y eso vuelve imposible
 * grabarla de un tirón para un anuncio: cada toque mete una pausa distinta.
 * Con este modo esos dos pasos corren solos y la carta se desplaza sola,
 * de modo que la grabación sale siempre igual.
 *
 * El primer toque, el del sobre, se queda a propósito: es el gesto que
 * desbloquea el audio en iOS y Android, y además se ve bien en el video.
 */
export const isDemoMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('demo') === '1';
  } catch {
    return false;
  }
};
