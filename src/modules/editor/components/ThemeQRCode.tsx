import React, { useCallback, useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import type { DedicationForm } from '../types';
import { buildCenterIcon, buildQrPalette } from '../../../utils/qrTheme';
import { Bow, CornerFlourish, Ornament } from '../../../components/decor';
import { decorFor, edgeCss, textureCss } from '../../../utils/themeDecor';

interface ThemeQRCodeProps {
  data: DedicationForm;
  cardUrl: string;
  /** Lado del QR en px. El PNG se exporta al triple para que imprima nítido. */
  size?: number;
}

/** Factor de escala del PNG exportado respecto al QR en pantalla. */
const EXPORT_SCALE = 3;

/* ---------- Componente ---------- */

export const ThemeQRCode: React.FC<ThemeQRCodeProps> = ({ data, cardUrl, size = 264 }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const decor = decorFor(data.themeId);
  // La trama se tiñe con la tinta de la tarjeta: en los temas oscuros el fondo
  // del QR es blanco y el color de texto del tema quedaría invisible.
  const { qr, icon, texture, edge } = useMemo(() => {
    const palette = buildQrPalette(data.themeId);
    return {
      qr: palette,
      icon: buildCenterIcon(data.themeId, palette.fg, palette.bg),
      texture: textureCss(decor.texture, palette.ink),
      edge: edgeCss(decor.edge, decor.metal),
    };
  }, [data.themeId, decor.texture, decor.edge, decor.metal]);

  const recipient = data.recipient?.trim() || 'ti';

  /**
   * Compone el PNG: no exporta el canvas pelado, sino el QR sobre su marco,
   * con zona de silencio y el nombre al pie, listo para imprimir o enviar.
   */
  const handleDownload = useCallback(async () => {
    const source = wrapperRef.current?.querySelector('canvas');
    if (!source) return;

    setDownloading(true);
    try {
      const pad = 28 * EXPORT_SCALE;
      const captionBand = 54 * EXPORT_SCALE;
      const width = source.width + pad * 2;
      const height = source.height + pad * 2 + captionBand;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = qr.bg;
      ctx.fillRect(0, 0, width, height);

      // Filete interior del marco
      ctx.strokeStyle = qr.frame;
      ctx.lineWidth = Math.max(1, 1.5 * EXPORT_SCALE);
      const inset = 10 * EXPORT_SCALE;
      const radius = 18 * EXPORT_SCALE;
      ctx.beginPath();
      ctx.roundRect(inset, inset, width - inset * 2, height - inset * 2, radius);
      ctx.stroke();

      ctx.drawImage(source, pad, pad);

      // Las fuentes del documento deben estar listas antes de dibujar texto
      if (document.fonts?.ready) await document.fonts.ready;
      ctx.fillStyle = qr.ink;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${22 * EXPORT_SCALE}px "Playfair Display", Georgia, serif`;
      ctx.fillText(`Para ${recipient}`, width / 2, source.height + pad + captionBand / 2 - 4);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `qr_${recipient.replace(/\s+/g, '_').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloading(false);
    }
  }, [qr.bg, qr.frame, qr.ink, recipient]);

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Halo cálido en el acento del tema, detrás de la tarjeta */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[48px] blur-2xl opacity-70"
        style={{ background: `radial-gradient(60% 55% at 50% 40%, ${qr.frame}, transparent 70%)` }}
      />

      {/* Lazo sobre la tarjeta, como una etiqueta de regalo */}
      <Bow
        size={98}
        className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 drop-shadow-[0_8px_14px_rgba(94,10,27,0.32)]"
      />

      {/* Tarjeta del QR: doble filete, filigrana en las cuatro esquinas */}
      <div
        ref={wrapperRef}
        className="relative rounded-[30px] px-6 pt-8 pb-5 overflow-hidden shadow-[0_26px_56px_-22px_rgba(94,10,27,0.5)]"
        style={{ backgroundColor: qr.bg, border: `1px solid ${qr.frame}` }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[30px]"
          style={{
            backgroundImage: texture.backgroundImage,
            backgroundSize: texture.backgroundSize,
            opacity: texture.opacity,
          }}
        />
        {edge && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-2.5 rounded-[22px]"
            style={{ border: edge.border, boxShadow: edge.boxShadow }}
          />
        )}

        <CornerFlourish corner="tl" color={decor.metal} size={46} placement="top-3 left-3" className="opacity-55" />
        <CornerFlourish corner="tr" color={decor.metal} size={46} placement="top-3 right-3" className="opacity-55" />
        <CornerFlourish corner="bl" color={decor.metal} size={46} placement="bottom-3 left-3" className="opacity-55" />
        <CornerFlourish corner="br" color={decor.metal} size={46} placement="bottom-3 right-3" className="opacity-55" />

        <div className="relative flex flex-col items-center">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.22em] pb-3 opacity-70"
            style={{ color: qr.ink }}
          >
            Escanea para abrirla
          </p>

          <div className="rounded-md p-1" style={{ boxShadow: `0 0 0 1px ${qr.frame}`, backgroundColor: qr.bg }}>
            <QRCodeCanvas
              value={cardUrl}
              size={size}
              level="H"
              marginSize={2}
              fgColor={qr.fg}
              bgColor={qr.bg}
              imageSettings={{
                src: icon,
                height: Math.round(size * 0.19),
                width: Math.round(size * 0.19),
                excavate: true,
              }}
            />
          </div>

          <Ornament color={decor.metal} motif={decor.motif} width={130} className="opacity-90 mt-3" />
          <p className="font-script text-[1.7rem] leading-none pt-0.5" style={{ color: qr.ink }}>
            Para {recipient}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-wine text-white font-semibold text-sm shadow-[0_10px_24px_-10px_rgba(140,17,40,0.8)] hover:bg-primary hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait disabled:hover:translate-y-0"
      >
        <span className="material-symbols-outlined text-[18px]">download</span>
        {downloading ? 'Generando…' : 'Descargar QR (PNG)'}
      </button>
    </div>
  );
};
