import React from 'react';
import { GIFT_ART, type Gift as GiftName, type GiftPaint } from '../../utils/themeGifts';

interface GiftProps {
  gift: GiftName;
  paint: GiftPaint;
  /** Lado en px. Se aplica como atributo, no como clase, para no chocar con
   *  un `w-*` de quien lo use — el mismo problema que tuvo la filigrana. */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Un objeto de regalo del tema: ramo, bombones, farol… Ver `themeGifts.ts`
 * para el porqué de que sean dibujos y no fotografías.
 */
export const Gift: React.FC<GiftProps> = ({ gift, paint, size = 80, className = '', style }) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    fill="none"
    className={className}
    style={style}
    aria-hidden="true"
    focusable="false"
    dangerouslySetInnerHTML={{ __html: GIFT_ART[gift](paint) }}
  />
);
