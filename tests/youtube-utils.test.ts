import { describe, expect, it } from 'vitest';
import {
  getYouTubeId,
  youtubeEmbedUrl,
  youtubeThumbnail,
  youtubeWatchUrl,
} from '../src/utils/youtube';

/**
 * El ID del vídeo es lo único que viaja: del enlace que pega el usuario salen
 * el reproductor, la miniatura y el enlace de escape.
 */
describe('getYouTubeId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=2Vv-BfVoq4g', '2Vv-BfVoq4g'],
    ['https://youtube.com/watch?v=2Vv-BfVoq4g&t=42s', '2Vv-BfVoq4g'],
    ['https://m.youtube.com/watch?v=2Vv-BfVoq4g', '2Vv-BfVoq4g'],
    ['https://music.youtube.com/watch?v=2Vv-BfVoq4g&list=RD', '2Vv-BfVoq4g'],
    ['https://youtu.be/2Vv-BfVoq4g', '2Vv-BfVoq4g'],
    ['https://youtu.be/2Vv-BfVoq4g?si=AbCdEf123456', '2Vv-BfVoq4g'],
    ['https://www.youtube.com/shorts/2Vv-BfVoq4g', '2Vv-BfVoq4g'],
    ['https://www.youtube.com/live/2Vv-BfVoq4g?feature=share', '2Vv-BfVoq4g'],
    ['https://www.youtube.com/embed/2Vv-BfVoq4g', '2Vv-BfVoq4g'],
    ['https://www.youtube-nocookie.com/embed/2Vv-BfVoq4g?autoplay=1', '2Vv-BfVoq4g'],
    ['youtube.com/watch?v=2Vv-BfVoq4g', '2Vv-BfVoq4g'],
    ['  https://youtu.be/2Vv-BfVoq4g  ', '2Vv-BfVoq4g'],
  ])('reconoce %s', (url, id) => {
    expect(getYouTubeId(url)).toBe(id);
  });

  it.each([
    [''],
    ['   '],
    ['2Vv-BfVoq4g'],
    ['https://vimeo.com/123456'],
    ['https://www.youtube.com/'],
    ['https://www.youtube.com/watch?v=corto'],
    ['https://www.youtube.com/watch?v=demasiado-largo-1'],
    ['https://www.youtube.com/channel/2Vv-BfVoq4g'],
    ['https://notyoutube.com/watch?v=2Vv-BfVoq4g'],
    ['no es un enlace'],
  ])('rechaza %j', (url) => {
    expect(getYouTubeId(url)).toBeNull();
  });

  it('no revienta con un valor que no es texto', () => {
    expect(getYouTubeId(undefined as unknown as string)).toBeNull();
  });
});

describe('constructores de URL', () => {
  it('el embed va por youtube-nocookie y solo lleva los parámetros pedidos', () => {
    expect(youtubeEmbedUrl('2Vv-BfVoq4g')).toBe('https://www.youtube-nocookie.com/embed/2Vv-BfVoq4g');
    expect(youtubeEmbedUrl('2Vv-BfVoq4g', { autoplay: 1, playsinline: 1, rel: 0 })).toBe(
      'https://www.youtube-nocookie.com/embed/2Vv-BfVoq4g?autoplay=1&playsinline=1&rel=0',
    );
  });

  it('miniatura y página del vídeo', () => {
    expect(youtubeThumbnail('2Vv-BfVoq4g')).toBe('https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg');
    expect(youtubeThumbnail('2Vv-BfVoq4g', 'maxres')).toBe(
      'https://i.ytimg.com/vi/2Vv-BfVoq4g/maxresdefault.jpg',
    );
    expect(youtubeWatchUrl('2Vv-BfVoq4g')).toBe('https://www.youtube.com/watch?v=2Vv-BfVoq4g');
  });
});
