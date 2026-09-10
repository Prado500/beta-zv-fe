import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { THEME_PRESETS } from '../../../editor/types';
import { CENTER_ICON_RATIO, buildQrPalette, buildWingedCenterIcon } from '../../../../utils/qrTheme';
import { decorFor, edgeCss, textureCss } from '../../../../utils/themeDecor';
import { darkenUntilContrast, resolvePalette, withAlpha } from '../../../../utils/themePalette';
import { flowersFor } from '../../../../utils/themeFlowers';
import { CARD_FLOWERS, qrCardMetrics } from '../../../../utils/qrCard';
import { PUBLIC_BASE_URL } from '../../../../config/site';
import { CornerFlourish } from '../../../../components/decor';
import { Carousel } from '../ui/Carousel';

/**
 * Postales de muestra, una por estilo.
 *
 * Son la misma tarjeta que se lleva quien compra —mismo papel, mismo filo,
 * mismas flores del tema— pero sin la frase: aquí no hay dedicatoria que
 * resumir. Los nombres son de ejemplo y van fijos, no sorteados en cada
 * pintada: así la landing se ve igual cada vez que se abre.
 */
const SHOWCASE: { themeId: string; to: string; from: string }[] = [
  { themeId: 'classic', to: 'Valentina', from: 'Santiago' },
  { themeId: 'pastelPink', to: 'Mariana', from: 'Sebastián' },
  { themeId: 'starry', to: 'Camila', from: 'Nicolás' },
  { themeId: 'sunset', to: 'Isabella', from: 'Julián' },
  { themeId: 'lavender', to: 'Salomé', from: 'Andrés' },
  { themeId: 'emerald', to: 'Antonia', from: 'Tomás' },
  { themeId: 'vintage', to: 'Manuela', from: 'Emilio' },
  { themeId: 'midnight', to: 'Luciana', from: 'Samuel' },
];

/** Lado del código en la muestra. El resto de la postal escala con él. */
const QR_SIZE = 132;

/** Medidas de la postal sin la banda de la nota: son las mismas para las ocho. */
const METRICS = qrCardMetrics(QR_SIZE, false);

/** Ancho del emblema del centro; el alto sale de su proporción. */
const ICON_WIDTH = Math.round(QR_SIZE * 0.34);

const CORNERS = ['tl', 'tr', 'bl', 'br'] as const;

const CORNER_PLACEMENT: Record<(typeof CORNERS)[number], string> = {
  tl: 'top-2 left-2',
  tr: 'top-2 right-2',
  bl: 'bottom-2 left-2',
  br: 'bottom-2 right-2',
};

interface QrCardProps {
  themeId: string;
  to: string;
  from: string;
}

/**
 * La postal tal como se entrega. El código es de verdad —apunta al sitio— así
 * que se puede escanear desde la propia página; no es una imagen de relleno.
 */
const QrCard: React.FC<QrCardProps> = ({ themeId, to, from }) => {
  const theme = THEME_PRESETS[themeId];
  const decor = decorFor(themeId);
  const flowers = flowersFor(themeId);
  const m = METRICS;

  const { paper, qr, icon, texture, edge, metalInk } = useMemo(() => {
    const palette = resolvePalette(theme);
    const code = buildQrPalette(themeId);
    return {
      paper: palette,
      qr: code,
      icon: buildWingedCenterIcon(themeId, code.fg, code.bg, decor.metal),
      texture: textureCss(decor.texture, palette.text),
      edge: edgeCss(decor.edge, decor.metal),
      /* El metal puro da ~2:1 contra el papel claro; oscurecido hasta 3:1 se
         sigue leyendo como el dorado o la plata del tema, pero se lee. */
      metalInk: palette.isDark
        ? decor.metal
        : darkenUntilContrast(decor.metal, palette.cardBg, 3),
    };
  }, [theme, themeId, decor.metal, decor.texture, decor.edge]);

  const label = (fontSize: number): React.CSSProperties => ({
    fontSize,
    lineHeight: `${fontSize}px`,
    letterSpacing: '0.4em',
    color: withAlpha(paper.text, 0.6),
  });

  return (
    <figure className="flex h-full flex-col items-center">
      <div
        className="relative overflow-hidden shadow-[0_20px_44px_-22px_rgba(94,10,27,0.55)]"
        style={{
          width: m.width,
          height: m.height,
          maxWidth: '100%',
          borderRadius: m.radius,
          backgroundColor: paper.cardBg,
        }}
      >
        {/* Trama del papel del tema */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: texture.backgroundImage,
            backgroundSize: texture.backgroundSize,
            opacity: texture.opacity,
          }}
        />
        {/* Filo interior: doble filete, punteado o un hilo de metal, según el tema */}
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

        {/* Las flores del tema, apagadas, en las bandas donde no hay texto */}
        {flowers.length > 0 &&
          CARD_FLOWERS.map((f, i) => (
            <img
              key={i}
              src={flowers[f.pick % flowers.length]}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
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
          className="relative flex h-full flex-col items-center text-center"
          style={{ paddingTop: m.padTop, paddingInline: m.padX }}
        >
          <span className="font-serif font-semibold uppercase" style={label(m.nameLabel)}>
            Para
          </span>
          <span
            className="font-script"
            style={{ fontSize: m.nameSize, lineHeight: `${m.nameLine}px`, color: metalInk }}
          >
            {to}
          </span>

          <div
            style={{
              marginTop: m.gapAfterName,
              padding: m.tilePad,
              borderRadius: m.tileRadius,
              backgroundColor: qr.bg,
              boxShadow: `0 0 0 1px ${withAlpha(decor.metal, 0.4)}`,
              lineHeight: 0,
            }}
          >
            <QRCodeSVG
              value={PUBLIC_BASE_URL}
              size={m.qr}
              level="H"
              marginSize={4}
              fgColor={qr.fg}
              bgColor={qr.bg}
              imageSettings={{
                src: icon,
                width: ICON_WIDTH,
                height: Math.round(ICON_WIDTH * CENTER_ICON_RATIO),
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
            {from}
          </span>
        </div>
      </div>

      {/* El nombre del estilo va fuera: la postal es exactamente el producto */}
      <figcaption className="pt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-wine/65">
        {theme.name}
      </figcaption>
    </figure>
  );
};

export const QrShowcase: React.FC = () => (
  <div className="w-full">
    <div className="text-center mb-6">
      <p className="inline-flex items-center gap-1.5 bg-blush text-wine-deep text-[11px] font-bold px-3 py-1.5 rounded-full ring-1 ring-wine/15">
        <span className="material-symbols-outlined text-[15px]">qr_code_2</span>
        Códigos reales, escanéalos desde aquí
      </p>
    </div>

    <Carousel
      loop
      label="Códigos QR por estilo"
      itemClassName="w-[62%] sm:w-[40%] md:w-[31%] lg:w-[24%]"
      hint="Desliza para ver los estilos"
    >
      {SHOWCASE.map(({ themeId, to, from }) => (
        <QrCard key={themeId} themeId={themeId} to={to} from={from} />
      ))}
    </Carousel>
  </div>
);
