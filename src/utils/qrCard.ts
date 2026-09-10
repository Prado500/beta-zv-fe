/**
 * La postal del QR: medidas y flores de fondo, en un solo sitio.
 *
 * La tarjeta se pinta en pantalla con HTML y, en el editor, también en un
 * canvas para el PNG; las dos tienen que salir idénticas. Por eso las medidas
 * no van sueltas en cada componente: se calculan aquí a partir del lado del QR.
 *
 * Por ahora la usa la muestra de la landing. Los trazados para canvas y el
 * recorte de la nota llegarán con la postal del editor.
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
