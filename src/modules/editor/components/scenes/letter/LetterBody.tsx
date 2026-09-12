import React from 'react';
import { Ornament } from '../../../../../components/decor';
import type { ThemePalette } from '../../../../../utils/themePalette';
import type { ThemeDecor } from '../../../../../utils/themeDecor';
import type { Block } from './letterBlocks';

/** Grados de inclinación de cada polaroid, en ciclo. */
const ROTATIONS = [-3, 2.5, -2, 3, -2.5];

interface LetterBodyProps {
  blocks: Block[];
  /** URLs pintables de las fotos, en el orden del formulario. */
  photos: string[];
  palette: ThemePalette;
  decor: ThemeDecor;
  onOpenPhoto: (index: number) => void;
}

/**
 * Pinta los bloques del cuerpo de la carta.
 *
 * Una foto no se pinta sola: se mete DENTRO del párrafo que la sigue, flotada
 * al costado, para que el texto la rodee como en una revista. Sólo cuando no
 * hay párrafo detrás —la última foto del mensaje— queda como bloque suelto.
 */
export const LetterBody: React.FC<LetterBodyProps> = ({
  blocks,
  photos,
  palette,
  decor,
  onOpenPhoto,
}) => {
  const polaroid = (idx: number) => (
    <button
      key={idx}
      type="button"
      className="letter-polaroid"
      style={{ transform: `rotate(${ROTATIONS[idx % ROTATIONS.length]}deg)` }}
      onClick={() => onOpenPhoto(idx)}
      aria-label={`Ver foto ${idx + 1}`}
    >
      <img src={photos[idx]} alt={`Foto ${idx + 1}`} draggable={false} />
    </button>
  );

  return (
    <>
      {blocks.map((block) => {
        if (block.type === 'divider') {
          return (
            <div key={block.key} className="letter-divider reveal" data-reveal>
              <Ornament color={decor.metal} motif={decor.motif} width={120} className="opacity-70" />
            </div>
          );
        }

        if (block.type === 'gallery') {
          return (
            <div key={block.key} className="letter-gallery reveal" data-reveal>
              {block.indices.map(polaroid)}
            </div>
          );
        }

        return (
          <p key={block.key} className="letter-p reveal" data-reveal style={{ color: palette.text }}>
            {block.segments.map((seg, i) =>
              seg.kind === 'photo' ? (
                <span key={`f${i}`} className={`letter-float letter-float--${seg.side}`}>
                  {polaroid(seg.index)}
                </span>
              ) : (
                <React.Fragment key={`t${i}`}>{seg.text}</React.Fragment>
              ),
            )}
          </p>
        );
      })}
    </>
  );
};
