/**
 * La postal del QR: medidas y trazados, en un solo sitio.
 *
 * La tarjeta se pinta dos veces —en pantalla con HTML y en el PNG con canvas—
 * y tienen que salir idénticas. Por eso las medidas no van sueltas en cada
 * lado: se calculan aquí a partir del lado del QR, y los trazados de las
 * esquinas son cadenas de `path` que sirven igual para un <svg> que para un
 * `Path2D` del canvas.
 */

/** Lado del QR para el que está pensado el diseño; el resto escala desde aquí. */
const REF_QR = 212;

export interface QrCardMetrics {
  qr: number;
  width: number;
  height: number;
  padX: number;
  padTop: number;
  padBottom: number;
  radius: number;
  /** Lado de la enredadera de esquina y su separación del borde. */
  corner: number;
  cornerInset: number;
  /** Margen claro alrededor del código, dentro de su baldosa. */
  tilePad: number;
  tileRadius: number;
  nameLabel: number;
  nameSize: number;
  nameLine: number;
  gapAfterName: number;
  noteSize: number;
  noteLine: number;
  gapAfterNote: number;
  gapAfterQr: number;
  fromLabel: number;
  fromSize: number;
  fromLine: number;
}

/**
 * @param withNote  Reserva la banda de la nota. Las postales de muestra de la
 *                  landing no la llevan —ahí no hay dedicatoria que resumir—,
 *                  y sin quitarla del alto quedaría un hueco en medio.
 */
export const qrCardMetrics = (qr: number, withNote = true): QrCardMetrics => {
  const k = qr / REF_QR;
  const px = (v: number) => Math.round(v * k);

  const padX = px(30);
  const padTop = px(34);
  const padBottom = px(28);
  const tilePad = px(10);
  const nameLabel = px(11);
  const nameLine = px(44);
  const gapAfterName = px(8);
  const noteLine = px(20);
  const gapAfterNote = px(14);
  const gapAfterQr = px(16);
  const fromLabel = px(10);
  const fromLine = px(38);

  const noteBand = withNote ? noteLine * 2 + gapAfterNote : 0;

  const height =
    padTop +
    nameLabel +
    nameLine +
    gapAfterName +
    noteBand +
    qr +
    tilePad * 2 +
    gapAfterQr +
    fromLabel +
    fromLine +
    padBottom;

  return {
    qr,
    width: qr + tilePad * 2 + padX * 2,
    height,
    padX,
    padTop,
    padBottom,
    radius: px(24),
    corner: px(38),
    cornerInset: px(12),
    tilePad,
    tileRadius: px(12),
    nameLabel,
    nameSize: px(38),
    nameLine,
    gapAfterName,
    noteSize: px(13),
    noteLine,
    gapAfterNote,
    gapAfterQr,
    fromLabel,
    fromSize: px(32),
    fromLine,
  };
};

/* ---------- Enredadera de esquina ---------- */

/**
 * Los mismos trazados que `CornerFlourish`, sueltos, en una caja de 64×64.
 *
 * Se repiten aquí en vez de importarlos del componente porque el canvas no
 * puede dibujar JSX: necesita las cadenas para construir `Path2D`.
 */
export const CORNER_BOX = 64;
export const CORNER_ARC_OUTER = 'M2 40 C2 19 19 2 40 2';
export const CORNER_ARC_INNER = 'M9 40 C9 23 23 9 40 9';
export const CORNER_LEAF = 'M20 14 C24 9 30 8 34 9 C31 14 25 16 20 14 Z';
export const CORNER_DOTS: [number, number][] = [
  [40, 2],
  [2, 40],
];

/** Giro de la enredadera según la esquina, igual que en el componente. */
export const CORNER_ANGLE = { tl: 0, tr: 90, br: 180, bl: 270 } as const;

/* ---------- Flores del tema ---------- */

export interface CardFlower {
  /** Esquina superior izquierda, en fracción del ancho y del alto. */
  x: number;
  y: number;
  /** Lado, en fracción del ancho de la tarjeta. */
  size: number;
  rot: number;
  alpha: number;
  /** Cuál de las tres flores del tema. */
  pick: number;
}

/**
 * Cuatro flores del tema, dos arriba y dos abajo, pegadas a los costados.
 *
 * Van en fracción y no en píxeles para que valgan a cualquier tamaño, y
 * ocupan solo las bandas donde no hay texto: los rótulos y los nombres van
 * centrados, así que los bordes quedan libres. Son cuatro y no más a
 * propósito —la postal tiene que respirar—, y muy apagadas: acompañan al
 * código, no compiten con él.
 */
export const CARD_FLOWERS: CardFlower[] = [
  { x: 0.015, y: 0.055, size: 0.2, rot: -16, alpha: 0.5, pick: 0 },
  { x: 0.79, y: 0.115, size: 0.16, rot: 20, alpha: 0.4, pick: 1 },
  { x: 0.01, y: 0.79, size: 0.17, rot: 13, alpha: 0.44, pick: 2 },
  { x: 0.81, y: 0.855, size: 0.145, rot: -14, alpha: 0.38, pick: 0 },
];

/* ---------- Texto ---------- */

/** Nota por defecto cuando la dedicatoria aún no tiene mensaje. */
export const DEFAULT_NOTE = 'Eres muy especial en mi vida.';

/** Segunda línea fija, la que invita a escanear. */
export const SCAN_LINE = 'Escanéalo…';

/**
 * Recorta la nota a una línea que quepa en `maxWidth`.
 *
 * `measure` la pone quien llama: el canvas mide de verdad con `ctx.measureText`
 * y en pantalla basta con estimar por número de caracteres.
 */
export const fitNote = (text: string, maxWidth: number, measure: (s: string) => number): string => {
  if (measure(text) <= maxWidth) return text;

  const words = text.split(/\s+/).filter(Boolean);
  let out = '';
  for (const word of words) {
    const candidate = out ? `${out} ${word}` : word;
    if (measure(`${candidate}…`) > maxWidth) break;
    out = candidate;
  }
  // Si ni la primera palabra cabe, se corta por letras
  if (!out) {
    out = text;
    while (out.length > 1 && measure(`${out}…`) > maxWidth) out = out.slice(0, -1);
  }
  return `${out.replace(/[,;:.]+$/, '')}…`;
};
