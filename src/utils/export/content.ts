import { photoSide, photoSlots } from '../photoPlan';

/** Grados de inclinación de cada polaroid, en ciclo. */
const ROTATIONS = [-6, 5, -4, 6, -3];

export interface PhotoCard {
  /** Índice global, el que recibe el visor de fotos. */
  index: number;
  src: string;
  rotation: number;
  side: 'left' | 'right';
}

export type Segment =
  | { type: 'photo'; card: PhotoCard }
  | { type: 'text'; text: string };

export interface ParagraphPlan {
  empty: boolean;
  segments: Segment[];
}

export interface ContentPlan {
  paragraphs: ParagraphPlan[];
  /** Fotos que no cupieron intercaladas: van en la galería del pie. */
  gallery: PhotoCard[];
  /** Todas las fotos en orden, tal como las indexa el visor. */
  photos: string[];
}

/**
 * Reparte las fotos entre el cuerpo del mensaje y la galería inferior.
 * Es una función pura: la misma entrada da siempre el mismo reparto, así el
 * HTML exportado calca lo que se ve en la vista previa del editor.
 */
export const planContent = (message: string, photos: string[]): ContentPlan => {
  const photosList = photos.slice(0, 5);
  const paragraphsWithWords = message.split('\n').map((p) => p.split(/\s+/).filter(Boolean));
  const totalWords = paragraphsWithWords.reduce((sum, words) => sum + words.length, 0);

  // El reparto vive en photoPlan.ts, compartido con la previa del editor
  const insertionIndices = photoSlots(totalWords, photosList.length);
  const inlineCount = insertionIndices.length;

  const makeCard = (index: number): PhotoCard => ({
    index,
    src: photosList[index],
    rotation: ROTATIONS[index % ROTATIONS.length],
    side: photoSide(index),
  });

  let globalWordIdx = 0;
  let photoCounter = 0;

  const paragraphs: ParagraphPlan[] = paragraphsWithWords.map((words) => {
    if (words.length === 0) return { empty: true, segments: [] };

    const segments: Segment[] = [];
    let pending = '';

    const flushText = () => {
      if (pending) {
        segments.push({ type: 'text', text: pending });
        pending = '';
      }
    };

    for (const word of words) {
      while (photoCounter < inlineCount && globalWordIdx === insertionIndices[photoCounter]) {
        flushText();
        segments.push({ type: 'photo', card: makeCard(photoCounter) });
        photoCounter++;
      }
      pending += `${word} `;
      globalWordIdx++;
    }

    flushText();
    return { empty: false, segments };
  });

  const gallery = photosList.slice(inlineCount).map((_, i) => makeCard(inlineCount + i));

  return { paragraphs, gallery, photos: photosList };
};
