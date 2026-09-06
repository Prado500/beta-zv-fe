import { blobToBase64 } from './media';

import t1a from '../../assets/flores/tema 1/flor_1.png';
import t1b from '../../assets/flores/tema 1/flor_2.png';
import t1c from '../../assets/flores/tema 1/flor_3.png';

import t2a from '../../assets/flores/tema 2/flor_1.png';
import t2b from '../../assets/flores/tema 2/flor_2.png';
import t2c from '../../assets/flores/tema 2/flor_3.png';

import t3a from '../../assets/flores/tema 3/flor_1.png';
import t3b from '../../assets/flores/tema 3/flor_2.png';
import t3c from '../../assets/flores/tema 3/flor_3.png';

import t4a from '../../assets/flores/tema 4/flor_1.png';
import t4b from '../../assets/flores/tema 4/flor_2.png';
import t4c from '../../assets/flores/tema 4/flor_3.png';

import t5a from '../../assets/flores/tema 5/flor_1.png';
import t5b from '../../assets/flores/tema 5/flor_2.png';
import t5c from '../../assets/flores/tema 5/flor_3.png';

import t6a from '../../assets/flores/tema 6/flor_1.png';
import t6b from '../../assets/flores/tema 6/flor_2.png';
import t6c from '../../assets/flores/tema 6/flor_3.png';

import t7a from '../../assets/flores/tema 7/flor_1.png';
import t7b from '../../assets/flores/tema 7/flor_2.png';
import t7c from '../../assets/flores/tema 7/flor_3.png';

import t8a from '../../assets/flores/tema 8/flor_1.png';
import t8b from '../../assets/flores/tema 8/flor_2.png';
import t8c from '../../assets/flores/tema 8/flor_3.png';

const SET_1 = [t1a, t1b, t1c];
const SET_2 = [t2a, t2b, t2c];
const SET_3 = [t3a, t3b, t3c];
const SET_4 = [t4a, t4b, t4c];
const SET_5 = [t5a, t5b, t5c];
const SET_6 = [t6a, t6b, t6c];
const SET_7 = [t7a, t7b, t7c];
const SET_8 = [t8a, t8b, t8c];

/** Los 8 temas, más el tipo de animación como respaldo. */
const FLOWERS_BY_KEY: Record<string, string[]> = {
  classic: SET_1,
  pastelPink: SET_2,
  sunset: SET_3,
  starry: SET_4,
  lavender: SET_5,
  emerald: SET_6,
  midnight: SET_7,
  vintage: SET_8,

  hearts: SET_1,
  petals: SET_2,
  sunsetGlow: SET_3,
  stars: SET_4,
  sparkles: SET_5,
  leaves: SET_6,
  fireflies: SET_7,
  butterflies: SET_8,
};

/** Devuelve las 3 flores del tema, con respaldo por tipo de animación. */
export const getFlowerAssets = (themeId: string, animationType: string): string[] =>
  FLOWERS_BY_KEY[themeId] || FLOWERS_BY_KEY[animationType] || SET_1;

/**
 * Incrusta sólo las 3 flores que el tema elegido necesita. Codificar las 24
 * infla la exportación y tarda de más sin que se usen.
 */
export const encodeFlowerAssets = (themeId: string, animationType: string): Promise<string[]> =>
  Promise.all(getFlowerAssets(themeId, animationType).map(blobToBase64));
