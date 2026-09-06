import React from 'react';
import { garlandArt, type GiftPaint } from '../../utils/themeGifts';

interface GarlandProps {
  paint: GiftPaint;
  /** Ancho en px. Va como atributo, no como clase, para no chocar con un `w-*`. */
  width?: number;
  className?: string;
}

/** Guirnalda de flores del tema, para colgar sobre el sobre de la portada. */
export const Garland: React.FC<GarlandProps> = ({ paint, width = 230, className = '' }) => (
  <svg
    viewBox="0 0 240 72"
    width={width}
    height={Math.round((width / 240) * 72)}
    fill="none"
    className={className}
    aria-hidden="true"
    focusable="false"
    dangerouslySetInnerHTML={{ __html: garlandArt(paint) }}
  />
);
