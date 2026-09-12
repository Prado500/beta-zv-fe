import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { THEME_PRESETS, type DedicationForm } from '../types';
import { CENTER_ICON_RATIO, buildQrPalette, buildWingedCenterIcon } from '../../../utils/qrTheme';
import { decorFor, edgeCss, textureCss } from '../../../utils/themeDecor';
import { darkenUntilContrast, resolvePalette, withAlpha } from '../../../utils/themePalette';
import { firstPhrase } from '../../../utils/firstPhrase';
import { flowersFor } from '../../../utils/themeFlowers';
import { CornerFlourish } from '../../../components/decor';
import {
  CORNER_ANGLE,
  CORNER_ARC_INNER,
  CORNER_ARC_OUTER,
  CORNER_BOX,
  CORNER_DOTS,
  CORNER_LEAF,
  CARD_FLOWERS,
  DEFAULT_NOTE,
  SCAN_LINE,
  fitNote,
  qrCardMetrics,
} from '../../../utils/qrCard';

/**
 * La postal del QR tal como se entrega: papel del tema, filo, flores, "Para"
 * y "De" con los nombres, la primera frase de la dedicatoria como nota y el
 * código con el emblema alado en el centro.
 *
 * Se pinta dos veces con las mismas medidas —en pantalla con HTML y en el PNG
 * con canvas—, así que las dos salen iguales. Las medidas y los trazados
 * viven en `utils/qrCard`.
 */

interface ThemeQRCodeProps {
  data: DedicationForm;
  cardUrl: string;
  /**
   * Lado del QR de diseño, en px. NO cambia con la pantalla: el PNG se compone
   * siempre con esta medida y la postal se encoge por CSS para caber.
   */
  size?: number;
  /**
   * Pinta su propio botón de descarga bajo la postal. Con `false`, quien la
   * monta pone el botón donde quiera y dispara la descarga por `ref`.
   */
  showDownload?: boolean;
  /** Lo que se puede pedir desde fuera: componer y bajar el PNG. */
  ref?: React.Ref<ThemeQRCodeHandle>;
}

export interface ThemeQRCodeHandle {
  download: () => Promise<void>;
}

/** Factor de escala del PNG exportado respecto a la postal de diseño. */
const EXPORT_SCALE = 3;

const SERIF = '"Playfair Display", Georgia, serif';
const SCRIPT = '"Great Vibes", "Playfair Display", cursive';

const CORNERS = ['tl', 'tr', 'bl', 'br'] as const;

const CORNER_PLACEMENT: Record<(typeof CORNERS)[number], string> = {
  tl: 'top-3 left-3',
  tr: 'top-3 right-3',
  bl: 'bottom-3 left-3',
  br: 'bottom-3 right-3',
};

/**
 * Encoge la postal hasta que cabe a lo ancho del hueco que le deja el padre.
 *
 * Solo mide el ANCHO. El alto no sirve de referencia: quien lo define es la
 * propia postal, así que medirlo sería morderse la cola. Nunca la agranda: el
 * diseño está pensado a tamaño natural y estirarlo emborronaría el código.
 * Donde no existe `ResizeObserver` (jsdom) vale la medida inicial.
 */
const useFitScale = (width: number) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const box = ref.current?.parentElement;
    if (!box) return;

    const measure = () => {
      const available = box.clientWidth;
      if (!available) return;
      setScale(Math.min(1, available / width));
    };

    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [width]);

  return { ref, scale };
};

/** Descarga y decodifica una imagen; `null` si no se pudo. */
const loadImage = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

/* ---------- Componente ---------- */

export const ThemeQRCode: React.FC<ThemeQRCodeProps> = ({
  data,
  cardUrl,
  size = 212,
  showDownload = true,
  ref,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const m = useMemo(() => qrCardMetrics(size), [size]);
  const { ref: fitRef, scale } = useFitScale(m.width);

  const decor = decorFor(data.themeId);
  const theme = THEME_PRESETS[data.themeId] || THEME_PRESETS.classic;

  const { paper, qr, icon, texture, edge, metalInk } = useMemo(() => {
    const palette = resolvePalette(theme);
    const code = buildQrPalette(data.themeId);
    return {
      /* El papel de la postal es el del tema de verdad, también en los
         oscuros. El código va aparte, en su baldosa clara. */
      paper: palette,
      qr: code,
      icon: buildWingedCenterIcon(data.themeId, code.fg, code.bg, decor.metal),
      texture: textureCss(decor.texture, palette.text),
      edge: edgeCss(decor.edge, decor.metal),
      /* Los nombres van en el metal del tema, oscurecido hasta 3:1 contra el
         papel: el metal puro da ~2:1 y en los temas claros se perdía. En los
         oscuros el papel es oscuro, así que ahí no hace falta tocarlo. */
      metalInk: palette.isDark
        ? decor.metal
        : darkenUntilContrast(decor.metal, palette.cardBg, 3),
    };
  }, [theme, data.themeId, decor.texture, decor.edge, decor.metal]);

  const recipient = data.recipient?.trim() || 'ti';
  const sender = data.sender?.trim() || 'Alguien que te quiere';
  /** La nota es la primera frase de la dedicatoria: ya la sabe recortar. */
  const note = firstPhrase(data.message || '') || DEFAULT_NOTE;

  const flowers = flowersFor(data.themeId);

  const iconW = Math.round(size * 0.34);
  const noteMax = m.width - m.padX * 2;

  /**
   * Compone el PNG dibujando la MISMA postal en canvas.
   *
   * No se rasteriza el HTML: haría falta una librería. Se repite el dibujo
   * con las medidas de `qrCardMetrics` y los trazados de `qrCard`, que son
   * los que usa la postal de pantalla, así que las dos salen iguales. Y se
   * compone siempre a tamaño de diseño, no al que se esté viendo.
   */
  const download = useCallback(async () => {
    const source = cardRef.current?.querySelector('canvas');
    if (!source) return;

    const s = EXPORT_SCALE;
    const canvas = document.createElement('canvas');
    canvas.width = m.width * s;
    canvas.height = m.height * s;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(s, s);

    // Las fuentes deben estar listas antes de escribir nada
    if (document.fonts?.ready) await document.fonts.ready;

    // Papel del tema
    ctx.fillStyle = paper.cardBg;
    ctx.fillRect(0, 0, m.width, m.height);

    // Filo interior: el del tema, y un doble filete cuando el tema no trae
    ctx.strokeStyle = withAlpha(decor.metal, edge ? 0.5 : 0.45);
    ctx.lineWidth = 1;
    const inset = Math.round(m.padX * 0.42);
    ctx.beginPath();
    ctx.roundRect(inset, inset, m.width - inset * 2, m.height - inset * 2, m.radius * 0.7);
    ctx.stroke();
    ctx.strokeStyle = withAlpha(decor.metal, 0.18);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(
      inset + 3.5,
      inset + 3.5,
      m.width - (inset + 3.5) * 2,
      m.height - (inset + 3.5) * 2,
      m.radius * 0.6,
    );
    ctx.stroke();

    /*
     * Las flores del tema, en las mismas fracciones que en pantalla.
     * Hay que esperar a que carguen: `drawImage` con una imagen a medio
     * descargar no pinta nada y no avisa.
     */
    if (flowers.length > 0) {
      const loaded = await Promise.all(
        CARD_FLOWERS.map((f) => loadImage(flowers[f.pick % flowers.length])),
      );
      loaded.forEach((img, i) => {
        if (!img) return;
        const f = CARD_FLOWERS[i];
        const w = m.width * f.size;
        const h = (img.height / img.width) * w;
        const x = m.width * f.x;
        const y = m.height * f.y;
        ctx.save();
        ctx.globalAlpha = f.alpha;
        // El giro de CSS es sobre el centro del elemento; aquí igual
        ctx.translate(x + w / 2, y + h / 2);
        ctx.rotate((f.rot * Math.PI) / 180);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
      });
    }

    /** Enredadera de esquina, con el mismo giro que el componente. */
    const flourish = (corner: keyof typeof CORNER_ANGLE) => {
      const k = m.corner / CORNER_BOX;
      const x = corner === 'tl' || corner === 'bl' ? m.cornerInset : m.width - m.cornerInset - m.corner;
      const y = corner === 'tl' || corner === 'tr' ? m.cornerInset : m.height - m.cornerInset - m.corner;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(k, k);
      ctx.translate(CORNER_BOX / 2, CORNER_BOX / 2);
      ctx.rotate((CORNER_ANGLE[corner] * Math.PI) / 180);
      ctx.translate(-CORNER_BOX / 2, -CORNER_BOX / 2);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = withAlpha(decor.metal, 0.55 * 0.6);
      ctx.lineWidth = 1;
      ctx.stroke(new Path2D(CORNER_ARC_OUTER));
      ctx.strokeStyle = withAlpha(decor.metal, 0.3 * 0.6);
      ctx.lineWidth = 0.9;
      ctx.stroke(new Path2D(CORNER_ARC_INNER));
      ctx.strokeStyle = withAlpha(decor.metal, 0.45 * 0.6);
      ctx.stroke(new Path2D(CORNER_LEAF));
      ctx.fillStyle = withAlpha(decor.metal, 0.5 * 0.6);
      for (const [cx, cy] of CORNER_DOTS) {
        ctx.beginPath();
        ctx.arc(cx, cy, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };
    CORNERS.forEach(flourish);

    const mid = m.width / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    /**
     * Escribe una línea centrada dentro de la altura que tiene reservada,
     * como hace `line-height` en el navegador.
     *
     * Colocar el texto por su línea base no sirve: la letra manuscrita tiene
     * unos rasgos descendentes enormes y con la línea base fija se comía la
     * nota de abajo y el nombre de quien firma se salía por el borde.
     */
    const line = (text: string, top: number, height: number) => {
      const box = ctx.measureText(text);
      const asc = box.actualBoundingBoxAscent || height * 0.74;
      const desc = box.actualBoundingBoxDescent || height * 0.26;
      ctx.fillText(text, mid, top + (height - (asc + desc)) / 2 + asc);
    };

    let y = m.padTop;

    ctx.fillStyle = withAlpha(paper.text, 0.6);
    ctx.font = `600 ${m.nameLabel}px ${SERIF}`;
    line('P A R A', y, m.nameLabel);
    y += m.nameLabel;

    ctx.fillStyle = metalInk;
    ctx.font = `${m.nameSize}px ${SCRIPT}`;
    line(recipient, y, m.nameLine);
    y += m.nameLine + m.gapAfterName;

    ctx.fillStyle = withAlpha(paper.text, 0.8);
    ctx.font = `${m.noteSize}px ${SERIF}`;
    const noteLine = fitNote(note, noteMax, (t) => ctx.measureText(t).width);
    line(noteLine, y, m.noteLine);
    line(SCAN_LINE, y + m.noteLine, m.noteLine);
    y += m.noteLine * 2 + m.gapAfterNote;

    // Baldosa clara del código y el código encima
    const tile = m.qr + m.tilePad * 2;
    ctx.fillStyle = qr.bg;
    ctx.beginPath();
    ctx.roundRect(m.padX, y, tile, tile, m.tileRadius);
    ctx.fill();
    ctx.strokeStyle = withAlpha(decor.metal, 0.4);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.drawImage(source, m.padX + m.tilePad, y + m.tilePad, m.qr, m.qr);
    y += tile + m.gapAfterQr;

    ctx.fillStyle = withAlpha(paper.text, 0.6);
    ctx.font = `600 ${m.fromLabel}px ${SERIF}`;
    line('D E', y, m.fromLabel);
    y += m.fromLabel;

    ctx.fillStyle = metalInk;
    ctx.font = `${m.fromSize}px ${SCRIPT}`;
    line(sender, y, m.fromLine);

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `qr_${recipient.replace(/\s+/g, '_').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [m, paper, qr.bg, decor.metal, edge, metalInk, recipient, sender, note, noteMax, flowers]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      await download();
    } finally {
      setDownloading(false);
    }
  }, [download]);

  useImperativeHandle(ref, () => ({ download: handleDownload }), [handleDownload]);

  const label = (fontSize: number): React.CSSProperties => ({
    fontSize,
    lineHeight: `${fontSize}px`,
    letterSpacing: '0.4em',
    color: withAlpha(paper.text, 0.6),
  });

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Ocupa exactamente lo que mide la postal ya encogida, para que el
          hueco del modal no se descuadre. */}
      <div ref={fitRef} style={{ width: m.width * scale, height: m.height * scale }} className="shrink-0">
        <div
          ref={cardRef}
          className="relative overflow-hidden shadow-[0_22px_48px_-20px_rgba(94,10,27,0.5)]"
          style={{
            width: m.width,
            height: m.height,
            borderRadius: m.radius,
            backgroundColor: paper.cardBg,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {/* Grano del papel del tema, muy tenue */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: texture.backgroundImage,
              backgroundSize: texture.backgroundSize,
              opacity: texture.opacity,
            }}
          />

          {/* Filo interior: el del tema si lo trae, y si no un doble filete */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute"
            style={{
              inset: Math.round(m.padX * 0.42),
              borderRadius: m.radius * 0.7,
              border: edge?.border ?? `1px solid ${withAlpha(decor.metal, 0.45)}`,
              boxShadow: edge?.boxShadow ?? `inset 0 0 0 2.5px ${withAlpha(decor.metal, 0.18)}`,
            }}
          />

          {/* Las flores del tema, en las bandas sin texto de los costados */}
          {flowers.length > 0 &&
            CARD_FLOWERS.map((f, i) => (
              <img
                key={i}
                src={flowers[f.pick % flowers.length]}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="pointer-events-none absolute select-none"
                style={{
                  left: m.width * f.x,
                  top: m.height * f.y,
                  width: m.width * f.size,
                  opacity: f.alpha,
                  transform: `rotate(${f.rot}deg)`,
                }}
              />
            ))}

          {CORNERS.map((corner) => (
            <CornerFlourish
              key={corner}
              corner={corner}
              color={decor.metal}
              size={m.corner}
              placement={CORNER_PLACEMENT[corner]}
              className="opacity-60"
            />
          ))}

          <div
            className="relative h-full flex flex-col items-center text-center"
            style={{ paddingTop: m.padTop, paddingInline: m.padX }}
          >
            <span className="font-serif font-semibold uppercase" style={label(m.nameLabel)}>
              Para
            </span>
            <span
              className="font-script"
              style={{ fontSize: m.nameSize, lineHeight: `${m.nameLine}px`, color: metalInk }}
            >
              {recipient}
            </span>

            <span
              className="font-serif"
              style={{
                marginTop: m.gapAfterName,
                height: m.noteLine * 2,
                fontSize: m.noteSize,
                lineHeight: `${m.noteLine}px`,
                color: withAlpha(paper.text, 0.8),
              }}
            >
              {fitNote(note, noteMax, (t) => t.length * m.noteSize * 0.46)}
              <br />
              {SCAN_LINE}
            </span>

            {/* Baldosa clara del código: en los temas oscuros el papel es
                oscuro y un QR invertido no lo lee la mitad de los lectores. */}
            <div
              style={{
                marginTop: m.gapAfterNote,
                padding: m.tilePad,
                borderRadius: m.tileRadius,
                backgroundColor: qr.bg,
                boxShadow: `0 0 0 1px ${withAlpha(decor.metal, 0.4)}`,
                lineHeight: 0,
              }}
            >
              <QRCodeCanvas
                value={cardUrl}
                size={m.qr}
                level="H"
                /* 4 módulos de zona de silencio, el estándar. La baldosa clara solo
                   aporta ~1 y en los temas oscuros el papel de al lado es oscuro. */
                marginSize={4}
                fgColor={qr.fg}
                bgColor={qr.bg}
                imageSettings={{
                  src: icon,
                  width: iconW,
                  height: Math.round(iconW * CENTER_ICON_RATIO),
                  excavate: true,
                }}
              />
            </div>

            <span
              className="font-serif font-semibold uppercase"
              style={{ ...label(m.fromLabel), marginTop: m.gapAfterQr }}
            >
              De
            </span>
            <span
              className="font-script"
              style={{ fontSize: m.fromSize, lineHeight: `${m.fromLine}px`, color: metalInk }}
            >
              {sender}
            </span>
          </div>
        </div>
      </div>

      {showDownload && (
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-wine text-white font-semibold text-sm shadow-[0_10px_24px_-10px_rgba(140,17,40,0.8)] hover:bg-primary hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait disabled:hover:translate-y-0"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          {downloading ? 'Generando…' : 'Descargar postal QR (PNG)'}
        </button>
      )}
    </div>
  );
};
