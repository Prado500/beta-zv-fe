import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { THEME_PRESETS } from '../../../editor/types';
import { buildCenterIcon, buildQrPalette } from '../../../../utils/qrTheme';
import { decorFor, edgeCss, textureCss } from '../../../../utils/themeDecor';
import { PUBLIC_BASE_URL } from '../../../../config/site';
import { CornerFlourish, Motif, Ornament } from '../../../../components/decor';
import { Carousel } from '../ui/Carousel';

/**
 * Dedicatorias de muestra, una por estilo. Son ejemplo para la landing: el
 * visitante escribe la suya en el editor. Cada línea sigue el ánimo del tema
 * — la noche estrellada mira al cielo, el jardín habla de crecer— para que se
 * entienda que el estilo no es solo un color.
 */
const SHOWCASE: { themeId: string; dedication: string }[] = [
  { themeId: 'classic', dedication: 'A ti, siempre a ti' },
  { themeId: 'pastelPink', dedication: 'Dulce, como tú' },
  { themeId: 'starry', dedication: 'Bajo el mismo cielo' },
  { themeId: 'sunset', dedication: 'Hasta el último sol' },
  { themeId: 'lavender', dedication: 'Mi sueño favorito' },
  { themeId: 'emerald', dedication: 'Lo nuestro sigue creciendo' },
  { themeId: 'vintage', dedication: 'De las que se guardan' },
  { themeId: 'midnight', dedication: 'Mi lugar a medianoche' },
];

/**
 * La etiqueta tal como se entrega: el QR real del tema, con su papel, su filo
 * y su motivo. Los códigos son de verdad —apuntan al sitio— así que se pueden
 * escanear desde la propia página. No son imágenes de relleno.
 */
const QrCard: React.FC<{ themeId: string; dedication: string }> = ({ themeId, dedication }) => {
  const theme = THEME_PRESETS[themeId];
  const decor = decorFor(themeId);
  // La trama se tiñe con la tinta de la etiqueta, no con la del tema: en los
  // temas oscuros el fondo del QR es blanco y el texto del tema sería invisible.
  const { qr, icon, texture, edge } = useMemo(() => {
    const palette = buildQrPalette(themeId);
    return {
      qr: palette,
      icon: buildCenterIcon(themeId, palette.fg, palette.bg),
      texture: textureCss(decor.texture, palette.ink),
      edge: edgeCss(decor.edge, decor.metal),
    };
  }, [themeId, decor.texture, decor.edge, decor.metal]);

  return (
    <figure
      className="relative h-full rounded-3xl px-5 pt-6 pb-5 shadow-[0_20px_44px_-22px_rgba(94,10,27,0.55)] flex flex-col items-center overflow-hidden"
      style={{ backgroundColor: qr.bg, border: `1px solid ${qr.frame}` }}
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

      {/* Filo interior: doble filete, punteado o ninguno, según el tema */}
      {edge && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-2 rounded-[18px]"
          style={{ border: edge.border, boxShadow: edge.boxShadow }}
        />
      )}

      <CornerFlourish
        corner="tl"
        color={decor.metal}
        size={38}
        placement="top-2.5 left-2.5"
        className="opacity-55"
      />
      <CornerFlourish
        corner="br"
        color={decor.metal}
        size={38}
        placement="bottom-2.5 right-2.5"
        className="opacity-55"
      />

      <p
        className="relative flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] pb-3 opacity-75"
        style={{ color: qr.ink }}
      >
        <Motif motif={decor.motif} size={11} color={decor.metal} />
        Escanea para abrirla
      </p>

      <div
        className="relative rounded-md p-1"
        style={{ boxShadow: `0 0 0 1px ${qr.frame}`, backgroundColor: qr.bg }}
      >
        <QRCodeSVG
          value={PUBLIC_BASE_URL}
          size={140}
          level="H"
          marginSize={2}
          fgColor={qr.fg}
          bgColor={qr.bg}
          imageSettings={{ src: icon, height: 28, width: 28, excavate: true }}
        />
      </div>

      <figcaption className="relative flex flex-col items-center mt-auto pt-3 text-center">
        <Ornament color={decor.metal} motif={decor.motif} width={92} className="opacity-85" />

        <span
          className="font-script leading-tight pt-1 px-1"
          style={{ color: qr.fg, fontSize: '1.35rem' }}
        >
          {dedication}
        </span>

        <span
          className="text-[9px] font-bold uppercase tracking-[0.16em] pt-1.5 opacity-60"
          style={{ color: qr.ink }}
        >
          {theme.name}
        </span>
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
      {SHOWCASE.map(({ themeId, dedication }) => (
        <QrCard key={themeId} themeId={themeId} dedication={dedication} />
      ))}
    </Carousel>
  </div>
);
