import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { THEME_PRESETS, type DedicationForm } from '../types';
import { AnimatedBackground } from './AnimatedBackground';
import { CornerFlourish, Garland, Gift, Motif, Ornament } from '../../../components/decor';
import { resolvePalette, withAlpha } from '../../../utils/themePalette';
import { decorFor, edgeCss, textureCss } from '../../../utils/themeDecor';
import { COVER_DUST, giftsFor, type GiftPaint } from '../../../utils/themeGifts';

import flor1_tema1 from '../../../assets/flores/tema 1/flor_1.png';
import flor2_tema1 from '../../../assets/flores/tema 1/flor_2.png';
import flor3_tema1 from '../../../assets/flores/tema 1/flor_3.png';

import flor1_tema2 from '../../../assets/flores/tema 2/flor_1.png';
import flor2_tema2 from '../../../assets/flores/tema 2/flor_2.png';
import flor3_tema2 from '../../../assets/flores/tema 2/flor_3.png';

import flor1_tema3 from '../../../assets/flores/tema 3/flor_1.png';
import flor2_tema3 from '../../../assets/flores/tema 3/flor_2.png';
import flor3_tema3 from '../../../assets/flores/tema 3/flor_3.png';

import flor1_tema4 from '../../../assets/flores/tema 4/flor_1.png';
import flor2_tema4 from '../../../assets/flores/tema 4/flor_2.png';
import flor3_tema4 from '../../../assets/flores/tema 4/flor_3.png';

import flor1_tema5 from '../../../assets/flores/tema 5/flor_1.png';
import flor2_tema5 from '../../../assets/flores/tema 5/flor_2.png';
import flor3_tema5 from '../../../assets/flores/tema 5/flor_3.png';

import flor1_tema6 from '../../../assets/flores/tema 6/flor_1.png';
import flor2_tema6 from '../../../assets/flores/tema 6/flor_2.png';
import flor3_tema6 from '../../../assets/flores/tema 6/flor_3.png';

import flor1_tema7 from '../../../assets/flores/tema 7/flor_1.png';
import flor2_tema7 from '../../../assets/flores/tema 7/flor_2.png';
import flor3_tema7 from '../../../assets/flores/tema 7/flor_3.png';

import flor1_tema8 from '../../../assets/flores/tema 8/flor_1.png';
import flor2_tema8 from '../../../assets/flores/tema 8/flor_2.png';
import flor3_tema8 from '../../../assets/flores/tema 8/flor_3.png';



interface CustomCSSProperties extends React.CSSProperties {
  '--tx'?: string;
  '--ty'?: string;
  '--rot'?: string;
  '--scale'?: number;
}

interface Particle {
  id: number;
  content: string;
  isImage: boolean;
  tx: string;
  ty: string;
  rot: string;
  delay: string;
  scale: number;
  zIndex: number;
}

interface PhonePreviewProps {
  data: DedicationForm;
  isFullView?: boolean;
}

const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const THEME_FLOWERS: Record<string, string[]> = {
  // Búsqueda por ID de Tema
  classic: [flor1_tema1, flor2_tema1, flor3_tema1],
  pastelPink: [flor1_tema2, flor2_tema2, flor3_tema2],
  sunset: [flor1_tema3, flor2_tema3, flor3_tema3],
  starry: [flor1_tema4, flor2_tema4, flor3_tema4],
  lavender: [flor1_tema5, flor2_tema5, flor3_tema5],
  emerald: [flor1_tema6, flor2_tema6, flor3_tema6],
  midnight: [flor1_tema7, flor2_tema7, flor3_tema7],
  vintage: [flor1_tema8, flor2_tema8, flor3_tema8],

  // Búsqueda por Tipo de Animación (fallback)
  hearts: [flor1_tema1, flor2_tema1, flor3_tema1],
  petals: [flor1_tema2, flor2_tema2, flor3_tema2],
  sunsetGlow: [flor1_tema3, flor2_tema3, flor3_tema3],
  stars: [flor1_tema4, flor2_tema4, flor3_tema4],
  sparkles: [flor1_tema5, flor2_tema5, flor3_tema5],
  leaves: [flor1_tema6, flor2_tema6, flor3_tema6],
  fireflies: [flor1_tema7, flor2_tema7, flor3_tema7],
  butterflies: [flor1_tema8, flor2_tema8, flor3_tema8],
};

const getFlowers = (themeId: string, animationType: string) => {
  return THEME_FLOWERS[themeId] || THEME_FLOWERS[animationType] || THEME_FLOWERS.classic;
};

/** Medidas de diseño de la carta. Todo dentro se maqueta contra ellas. */
const DESIGN_W = 320;
const DESIGN_H = 640;

/** Aire que se deja bajo el teléfono para que no toque el borde. */
const BOTTOM_GAP = 20;

/**
 * En móvil se reserva más: ahí el teléfono se apoya sobre un pedestal que
 * sobresale por abajo, y con 20px quedaba pegado al borde de la pantalla.
 */
const BOTTOM_GAP_MOBILE = 56;

const MIN_SCALE = 0.62;
const MAX_SCALE = 1.18;

/**
 * En móvil la previa no debe llenar la pantalla: con la pestaña Previa activa
 * el teléfono era casi tan alto como el viewport y no quedaba aire para el
 * pedestal ni para entender que es una maqueta.
 */
const MAX_SCALE_MOBILE = 0.8;
const MOBILE_BREAKPOINT = 768;

/**
 * Ajusta el teléfono al hueco que realmente queda debajo del rótulo. Devuelve
 * la escala y el ref que hay que poner en el envoltorio.
 */
const usePhoneScale = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const narrow = window.innerWidth < MOBILE_BREAKPOINT;
    const gap = narrow ? BOTTOM_GAP_MOBILE : BOTTOM_GAP;
    const ceiling = narrow ? MAX_SCALE_MOBILE : MAX_SCALE;

    const top = el.getBoundingClientRect().top;
    const byHeight = (window.innerHeight - top - gap) / DESIGN_H;
    const byWidth = (el.parentElement?.clientWidth ?? window.innerWidth) / DESIGN_W;
    setScale(Math.max(MIN_SCALE, Math.min(ceiling, Math.min(byHeight, byWidth))));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // El observer dispara también al montar, así que cubre la medida inicial
    const observer = new ResizeObserver(measure);
    if (el.parentElement) observer.observe(el.parentElement);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  return { ref, scale };
};

const ROTATIONS = ['-rotate-6', 'rotate-[5deg]', '-rotate-[4deg]', 'rotate-6', '-rotate-3'];

export const PhonePreview: React.FC<PhonePreviewProps> = ({ data, isFullView = false }) => {
  const [viewState, setViewState] = useState<'envelope' | 'blooming' | 'card'>('envelope');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isClosingPhoto, setIsClosingPhoto] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { ref: shellRef, scale } = usePhoneScale();

  const theme = THEME_PRESETS[data.themeId] || THEME_PRESETS.classic;
  const cardTitle = data.title || 'Una Carta Especial';
  const recipientName = data.recipient || 'Tu Persona Especial';
  const senderName = data.sender || 'Alguien que te quiere';
  const videoId = getYouTubeId(data.songUrl);

  // La hoja de la carta necesita valores reales, no clases de Tailwind
  const palette = resolvePalette(theme);
  const decor = decorFor(data.themeId);
  const texture = textureCss(decor.texture, palette.text);
  const edge = edgeCss(decor.edge, decor.metal);

  /** Los dos objetos que acompañan a este tema, teñidos con su paleta. */
  const [giftLeft, giftRight] = giftsFor(data.themeId);
  const paint: GiftPaint = {
    accent: palette.accent,
    metal: decor.metal,
    ink: palette.text,
    paper: palette.cardBg,
    motif: decor.motif,
  };
  /** Sombra de apoyo de los objetos, en la tinta del tema. */
  const restShadow = `drop-shadow(0 9px 11px ${withAlpha(palette.text, 0.3)})`;

  const monogram = recipientName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const flowerParticles = useMemo<Particle[]>(() => {
    const assets = getFlowers(data.themeId, theme.animationType);
    const totalParticles = 32; 
    
    return Array.from({ length: totalParticles }).map((_, i) => {
      const angle = (i * 137.5) * (Math.PI / 180); 
      const radiusX = Math.sqrt(i) * 36;
      const radiusY = Math.sqrt(i) * 78; 

      const asset = assets[i % assets.length];
      const isImage = asset.includes('.png') || asset.includes('data:image') || asset.includes('http');
      const pseudoRandom = (Math.sin(i * 999) + 1) / 2;

      return {
        id: i,
        content: asset,
        isImage,
        tx: `${Math.cos(angle) * radiusX}px`,
        ty: `${Math.sin(angle) * radiusY}px`,
        rot: `${(i * 40) % 360}deg`,
        delay: `${(i % 6) * 0.03}s`, 
        scale: 1.2 + pseudoRandom * 0.5, 
        zIndex: 50 + i
      };
    });
  }, [data.themeId, theme.animationType]);

  const handleOpenCard = () => {
    setViewState('blooming');
    timeoutRef.current = setTimeout(() => {
      setViewState('card');
    }, 2800);
  };

  const handleCloseCard = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setViewState('envelope');
    setSelectedPhotoIndex(null);
    setIsClosingPhoto(false);
  };

  const openPhoto = (idx: number) => {
    setIsClosingPhoto(false);
    setSelectedPhotoIndex(idx);
  };

  const closePhotoModal = () => {
    setIsClosingPhoto(true);
    setTimeout(() => {
      setSelectedPhotoIndex(null);
      setIsClosingPhoto(false);
    }, 120);
  };

  /**
   * URLs pintables de las fotos.
   *
   * `data.photos` guarda además el `tempId` del servidor, que aquí no sirve de
   * nada: la clave temporal apunta a un contenedor privado. Lo único que se
   * puede pintar es `previewUrl` —el `blob:` local en el editor, la ruta pública
   * de la API en el visor—, así que la vista trabaja siempre con esa lista.
   */
  const photoUrls = useMemo(
    () => (data.photos ?? []).map((photo) => photo.previewUrl),
    [data.photos],
  );

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex !== null && photoUrls.length) {
      setSelectedPhotoIndex((selectedPhotoIndex + 1) % photoUrls.length);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex !== null && photoUrls.length) {
      setSelectedPhotoIndex((selectedPhotoIndex - 1 + photoUrls.length) % photoUrls.length);
    }
  };

  const renderCardBody = () => {
    const photos = photoUrls.slice(0, 5);
    const messageText = data.message || 'Escribe tu mensaje desde el editor...';
    
    const rawParagraphs = messageText.split('\n');
    
    let totalWords = 0;
    const paragraphsWithWords = rawParagraphs.map(p => {
      const words = p.split(/\s+/).filter(Boolean);
      totalWords += words.length;
      return words;
    });

    const WORDS_PER_FLOAT = 15;
    const maxInlineCount = Math.floor(totalWords / WORDS_PER_FLOAT);
    
    let finalInlineCount = 0;
    if (totalWords >= 6) {
      finalInlineCount = Math.max(1, Math.min(photos.length, maxInlineCount));
    }

    const inlinePhotos = photos.slice(0, finalInlineCount);
    const bottomPhotos = photos.slice(finalInlineCount);

    const insertionIndices: number[] = [];
    if (finalInlineCount > 0) {
      const step = Math.floor(totalWords / finalInlineCount);
      for (let i = 0; i < finalInlineCount; i++) {
        insertionIndices.push(Math.max(0, i * step));
      }
    }

    let globalWordIdx = 0;
    let photoCounter = 0;
    const renderedContent: React.ReactNode[] = [];

    renderedContent.push(
      <p key="salutation" className={`font-serif text-[14px] md:text-[15px] italic font-semibold mb-3 transition-colors duration-500 ${theme.accentColor}`}>
        Querida/o {recipientName},
      </p>
    );

    paragraphsWithWords.forEach((words, pIdx) => {
      if (words.length === 0) {
        renderedContent.push(<br key={`br-${pIdx}`} />);
        return;
      }

      const elements: React.ReactNode[] = [];
      let currentTextBuffer: string[] = [];

      const flushText = () => {
        if (currentTextBuffer.length > 0) {
          elements.push(<span key={`text-${globalWordIdx}-${currentTextBuffer.length}`}>{currentTextBuffer.join(' ')} </span>);
          currentTextBuffer = [];
        }
      };

      for (let i = 0; i < words.length; i++) {
        while (photoCounter < inlinePhotos.length && globalWordIdx === insertionIndices[photoCounter]) {
          flushText();
          
          const photo = inlinePhotos[photoCounter];
          const isLeft = photoCounter % 2 === 0;
          const rotClass = ROTATIONS[photoCounter % ROTATIONS.length];
          const currentGlobalPhotoIdx = photoCounter;

          elements.push(
            <div
              key={`inline-photo-${currentGlobalPhotoIdx}`}
              onClick={(e) => { e.stopPropagation(); openPhoto(currentGlobalPhotoIdx); }}
              role="button"
              className={`cursor-pointer transform ${rotClass} hover:scale-110 hover:z-30 active:scale-95 transition-all duration-300 bg-white p-1.5 pb-4 rounded-xs shadow-md border border-gray-200/80 w-20 md:w-22 mb-1.5 mt-0.5 relative z-20 ${
                isLeft ? 'float-left mr-3.5' : 'float-right ml-3.5'
              }`}
            >
              <img
                src={photo}
                alt={`Foto incrustada ${currentGlobalPhotoIdx + 1}`}
                className="w-full aspect-square object-cover bg-gray-100 pointer-events-none"
              />
            </div>
          );
          photoCounter++;
        }

        currentTextBuffer.push(words[i]);
        globalWordIdx++;
      }
      flushText();

      renderedContent.push(
        <div key={`p-${pIdx}`} className={`font-serif text-[13px] md:text-[14px] leading-[1.8] whitespace-pre-wrap wrap-break-word mb-2 transition-colors duration-500 ${theme.textColor} opacity-95`}>
          {elements}
        </div>
      );
    });

    return (
      /* Transición añadida al contenedor principal */
      <div className={`w-full h-full relative overflow-hidden transition-all duration-500 ease-in-out ${theme.bgClass}`}>
        <style>{`
          .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
          .hide-scrollbar::-webkit-scrollbar { display: none; width: 0; height: 0; }
          @keyframes superpositionIn {
            0% { transform: scale(0.7) translateY(12px); opacity: 0; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
          }
          @keyframes superpositionOut {
            0% { transform: scale(1) translateY(0); opacity: 1; }
            100% { transform: scale(0.75) translateY(8px); opacity: 0; }
          }
          .animate-superposition-in { animation: superpositionIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .animate-superposition-out { animation: superpositionOut 120ms cubic-bezier(0.4, 0, 1, 1) forwards; }
        `}</style>

        {/* Fondo Animado */}
        <div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-500">
          <AnimatedBackground type={theme.animationType} />
        </div>
        
        {/* Portada / Sobre */}
        <div 
          onClick={handleOpenCard}
          className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-5 text-center cursor-pointer select-none transition-all duration-700 ease-in-out ${
            viewState === 'envelope' ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-110 hidden'
          }`}
        >
          {/* Filigranas en las esquinas de la pantalla: el sobre quedaba solo
              en medio de un plano vacío y el inicio se sentía frío. */}
          {/* Marco interior: encierra la composición como una invitación */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-2.5 rounded-[26px]"
            style={{
              border: `1px solid ${withAlpha(decor.metal, 0.45)}`,
              boxShadow: `inset 0 0 0 3px ${withAlpha(decor.metal, 0.1)}`,
            }}
          />
          <CornerFlourish
            corner="tl"
            color={decor.metal}
            size={54}
            placement="top-5 left-5"
            className="opacity-40"
          />
          <CornerFlourish
            corner="tr"
            color={decor.metal}
            size={54}
            placement="top-5 right-5"
            className="opacity-40"
          />
          <CornerFlourish
            corner="bl"
            color={decor.metal}
            size={54}
            placement="bottom-5 left-5"
            className="opacity-40"
          />
          <CornerFlourish
            corner="br"
            color={decor.metal}
            size={54}
            placement="bottom-5 right-5"
            className="opacity-40"
          />

          {/* Motivos del tema regados por el resto de la pantalla */}
          {COVER_DUST.map((speck, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="pointer-events-none absolute"
              style={{
                left: `${speck.x}%`,
                top: `${speck.y}%`,
                transform: `translate(-50%, -50%) rotate(${speck.rot}deg)`,
                opacity: speck.alpha,
              }}
            >
              <Motif
                motif={decor.motif}
                size={speck.size}
                color={speck.tint === 'accent' ? palette.accent : decor.metal}
              />
            </span>
          ))}

          <div className="relative z-10 flex flex-col items-center group">
            {/* Guirnalda colgada sobre el sobre: llena el hueco de arriba, que
                era el que dejaba el inicio con cara de plano vacío. */}
            <Garland paint={paint} width={238} className="mb-1 opacity-95" />

            {/*
              El sobre apoyado sobre los objetos del tema. Van detrás y el
              sobre se levanta sobre ellos al pasar el cursor, así se lee como
              un regalo puesto en una mesa y no como una tarjeta flotando.
            */}
            <div className="relative z-10 w-[250px]">
              {/* Cuerpo del sobre, con el papel del tema */}
              <div
                className="relative w-full rounded-2xl pt-[92px] px-5 pb-6 shadow-[0_22px_44px_-18px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:-translate-y-1"
                style={{ backgroundColor: palette.cardBg, border: `1px solid ${palette.border}` }}
              >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  backgroundImage: texture.backgroundImage,
                  backgroundSize: texture.backgroundSize,
                  opacity: texture.opacity,
                }}
              />
              {edge && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-2 rounded-xl"
                  style={{ border: edge.border, boxShadow: edge.boxShadow }}
                />
              )}

              {/*
                Solapa y lacre dentro del MISMO sistema de coordenadas: el SVG
                se estira exacto al contenedor, así el vértice cae siempre en
                (125,56) y el lacre se ancla a ese punto. Antes la solapa se
                medía contra la caja de padding de la tarjeta y el lacre contra
                el envoltorio, que son cajas distintas — de ahí el desvío.
              */}
              <div className="pointer-events-none absolute top-0 left-0 w-full h-[60px] z-10">
                <svg
                  viewBox="0 0 250 60"
                  preserveAspectRatio="none"
                  className="block w-full h-full"
                  aria-hidden="true"
                >
                  <path
                    d="M0 0 H250 V8 L125 56 L0 8 Z"
                    fill={withAlpha(palette.accent, 0.1)}
                    stroke={withAlpha(decor.metal, 0.55)}
                    strokeWidth="1"
                  />
                </svg>

                {/* El ancla traslada; el lacre solo escala al pasar el cursor */}
                <span className="absolute left-1/2 top-[56px] -translate-x-1/2 -translate-y-1/2">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full shadow-[0_6px_14px_-4px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: palette.accent,
                      border: `2px solid ${withAlpha(decor.metal, 0.75)}`,
                    }}
                  >
                    <Motif motif={decor.motif} size={22} color={palette.cardBg} />
                  </span>
                </span>
              </div>

              <CornerFlourish
                corner="bl"
                color={decor.metal}
                size={38}
                placement="bottom-3 left-3"
                className="opacity-55"
              />
              <CornerFlourish
                corner="br"
                color={decor.metal}
                size={38}
                placement="bottom-3 right-3"
                className="opacity-55"
              />

              <div className="relative text-center">
                <h2
                  className="font-serif text-lg font-bold leading-tight transition-colors duration-500"
                  style={{ color: palette.text }}
                >
                  {cardTitle}
                </h2>

                <Ornament
                  color={decor.metal}
                  motif={decor.motif}
                  width={124}
                  className="mx-auto my-2 opacity-95"
                />

                <p
                  className="font-serif text-[10px] uppercase tracking-[0.2em] opacity-65"
                  style={{ color: palette.text }}
                >
                  De parte de
                </p>
                <p
                  className="font-script leading-none pb-1 transition-colors duration-500"
                  style={{ color: palette.accent, fontSize: '1.9rem' }}
                >
                  {senderName}
                </p>
                </div>
              </div>
            </div>

            {/* Los objetos, apoyados bajo el sobre, que les monta un poco
                encima. Detrás del sobre quedaban tapados casi enteros. */}
            <div
              aria-hidden="true"
              className="relative z-0 -mt-8 flex w-[280px] items-end justify-between"
            >
              <span
                className="pointer-events-none absolute bottom-1.5 left-1/2 h-6 w-56 -translate-x-1/2 rounded-[50%] blur-md"
                style={{ backgroundColor: withAlpha(palette.text, 0.2) }}
              />
              <Gift
                gift={giftLeft}
                paint={paint}
                size={76}
                className="relative rotate-[-7deg]"
                style={{ filter: restShadow }}
              />
              <Gift
                gift={giftRight}
                paint={paint}
                size={66}
                className="relative rotate-[8deg]"
                style={{ filter: restShadow }}
              />
            </div>

            <p
              className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full animate-pulse"
              style={{
                color: palette.text,
                backgroundColor: withAlpha(palette.cardBg, 0.75),
                opacity: 0.9,
              }}
            >
              Toca para abrir
            </p>
          </div>
        </div>

        {/* Explosión de flores */}
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none overflow-hidden">
          {viewState !== 'envelope' && flowerParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute flex items-center justify-center w-32 h-32 md:w-36 md:h-36 gpu-particle"
              style={{
                zIndex: particle.zIndex,
                '--tx': particle.tx,
                '--ty': particle.ty,
                '--rot': particle.rot,
                '--scale': particle.scale,
                animation: viewState === 'blooming' || viewState === 'card' 
                  ? `flowerBloomCinematic 2.8s cubic-bezier(0.22, 1, 0.36, 1) forwards ${particle.delay}` 
                  : 'none'
              } as CustomCSSProperties}
            >
              {particle.isImage ? (
                <img src={particle.content} alt="flor" className="w-full h-full object-contain pointer-events-none drop-shadow-sm" />
              ) : (
                <span style={{ fontSize: '3.5rem' }}>{particle.content}</span>
              )}
            </div>
          ))}
        </div>

        {/* Vista Carta de Texto */}
        <div className={`absolute inset-0 z-10 overflow-y-auto overflow-x-hidden hide-scrollbar custom-scrollbar transition-all duration-1000 ease-in-out ${
          viewState === 'card' ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-95'
        }`}>
          {/* Ambiente del tema por delante de la hoja: si solo va detrás, el
              papel lo tapa casi entero y la animación no se ve. */}
          <div className="absolute inset-0 z-20 pointer-events-none opacity-45">
            <AnimatedBackground type={theme.animationType} />
          </div>

          <div className="relative z-10 w-full min-h-full p-4 pt-10 pb-8 flex flex-col items-center text-center">
            
            <button 
              onClick={handleCloseCard} 
              className="absolute top-4 right-4 z-30 bg-black/20 hover:bg-black/40 text-white text-[11px] px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-md transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">lock</span> Cerrar
            </button>

            {/*
              Objetos asomando por detrás de la hoja. Los márgenes laterales
              quedaban en blanco durante todo el desplazamiento; puestos en
              porcentaje se reparten a lo largo de la carta, sea corta o larga.
            */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -left-5 top-[20%] z-0 -rotate-[9deg]"
              style={{ filter: restShadow }}
            >
              <Gift gift={giftLeft} paint={paint} size={94} />
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-5 top-[56%] z-0 rotate-[8deg]"
              style={{ filter: restShadow }}
            >
              <Gift gift={giftRight} paint={paint} size={86} />
            </span>

            {/* LA HOJA: el texto ya no flota sobre el fondo, va sobre papel */}
            <div className="w-full max-w-[248px] my-2 mx-auto relative z-10">
              <div
                className="relative rounded-3xl px-4 pt-7 pb-8 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)] transition-colors duration-500"
                style={{ backgroundColor: palette.cardBg, border: `1px solid ${palette.border}` }}
              >
                {/* Grano de papel */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-3xl"
                  style={{
                    backgroundImage: texture.backgroundImage,
                    backgroundSize: texture.backgroundSize,
                    opacity: texture.opacity,
                  }}
                />

                {/* Filo interior: doble filete, punteado o ninguno según el tema */}
                {edge && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-2 rounded-2xl"
                    style={{ border: edge.border, boxShadow: edge.boxShadow }}
                  />
                )}

                {/* Monograma de ella, marca de agua */}
                {monogram && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-36 text-center font-serif font-bold leading-none select-none"
                    style={{ fontSize: '9rem', color: palette.accent, opacity: 0.05 }}
                  >
                    {monogram}
                  </span>
                )}

                <CornerFlourish corner="tl" color={decor.metal} size={40} placement="top-3 left-3" className="opacity-60" />
                <CornerFlourish corner="br" color={decor.metal} size={40} placement="bottom-3 right-3" className="opacity-60" />

                <div className="relative">
                  {/* Membrete: bloque tintado que separa cabecera de cuerpo */}
                  <div
                    className="relative text-center -mx-4 -mt-7 px-4 pt-6 pb-3 mb-3 rounded-t-3xl"
                    style={{
                      backgroundImage: `linear-gradient(to bottom, ${withAlpha(
                        palette.accent,
                        0.1,
                      )}, ${withAlpha(palette.accent, 0)})`,
                      borderBottom: `1px solid ${withAlpha(decor.metal, 0.35)}`,
                    }}
                  >
                    <span
                      className="inline-block font-serif text-[10px] font-semibold uppercase tracking-[0.18em] opacity-75 transition-colors duration-500"
                      style={{ color: palette.accent }}
                    >
                      {cardTitle}
                    </span>
                    <h3
                      className="font-serif text-lg leading-tight transition-colors duration-500 pt-0.5"
                      style={{ color: palette.text }}
                    >
                      Para
                    </h3>
                    <p
                      className="font-script leading-none pb-1 transition-colors duration-500"
                      style={{ color: palette.accent, fontSize: '2.2rem' }}
                    >
                      {recipientName}
                    </p>
                    <Ornament color={decor.metal} motif={decor.motif} width={140} className="mx-auto opacity-95" />
                  </div>

                  <div className="text-left pt-1">
              {renderedContent}

              <div className="clear-both" />

              {/* Fotos restantes */}
              {bottomPhotos.length > 0 && (
                <div className="pt-6 pb-2 flex flex-wrap items-center justify-center gap-3 md:gap-4 w-full">
                  {bottomPhotos.map((photo, bIdx) => {
                    const globalIdx = finalInlineCount + bIdx;
                    const rotClass = ROTATIONS[globalIdx % ROTATIONS.length];
                    return (
                      <div
                        key={`bottom-photo-${globalIdx}`}
                        onClick={(e) => { e.stopPropagation(); openPhoto(globalIdx); }}
                        role="button"
                        className={`cursor-pointer transform ${rotClass} hover:scale-110 hover:z-30 active:scale-95 transition-all duration-300 bg-white p-1.5 pb-5 rounded-xs shadow-md border border-gray-200/80 w-22 md:w-24 relative z-20`}
                      >
                        <img
                          src={photo}
                          alt={`Foto galería ${globalIdx + 1}`}
                          className="w-full aspect-square object-cover bg-gray-100 pointer-events-none"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 flex items-end justify-between gap-3">
                {/* Lacre de cierre */}
                <span
                  aria-hidden="true"
                  className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full shadow-inner"
                  style={{
                    backgroundColor: withAlpha(palette.accent, 0.18),
                    border: `1px solid ${withAlpha(palette.accent, 0.35)}`,
                  }}
                >
                  <Motif motif={decor.motif} size={20} color={palette.accent} />
                </span>

                <span className="text-right min-w-0">
                  <span
                    className="block font-serif text-[10px] uppercase tracking-[0.16em] opacity-65"
                    style={{ color: palette.text }}
                  >
                    De parte de
                  </span>
                  <span
                    className="block font-script leading-none pb-1 transition-colors duration-500"
                    style={{ color: palette.accent, fontSize: '1.65rem' }}
                  >
                    {senderName}
                  </span>
                </span>
              </div>
                  </div>
                </div>
              </div>
            </div>

            {/*
              Cierre de la carta: los mismos objetos, apoyados bajo la hoja.
              Antes la lectura terminaba en seco en la firma y quedaba un
              tramo largo de fondo vacío hasta el reproductor.
            */}
            <div
              aria-hidden="true"
              className="relative z-10 mt-6 flex w-full max-w-[248px] items-end justify-center gap-1"
            >
              <span
                className="pointer-events-none absolute bottom-1 left-1/2 h-6 w-44 -translate-x-1/2 rounded-[50%] blur-md"
                style={{ backgroundColor: withAlpha(palette.text, 0.18) }}
              />
              <Gift
                gift={giftLeft}
                paint={paint}
                size={64}
                className="relative -rotate-6"
                style={{ filter: restShadow }}
              />
              <Motif motif={decor.motif} size={15} color={decor.metal} className="relative mb-5 opacity-70" />
              <Gift
                gift={giftRight}
                paint={paint}
                size={56}
                className="relative rotate-[7deg]"
                style={{ filter: restShadow }}
              />
            </div>
            <Ornament
              color={decor.metal}
              motif={decor.motif}
              width={140}
              className="relative z-10 mt-3 opacity-70"
            />

            {/*
              Reproductor de Música. Va en el flujo, justo bajo las flores, y
              no anclado al borde: anclado dejaba un vacío largo entre el
              cierre de la carta y la barra siempre que el mensaje era corto.
              Toma los colores del tema, no el blanco y gris de antes.
            */}
            {videoId && (
              <div
                className="relative z-20 mt-5 w-[90%] max-w-70 backdrop-blur-md p-2 px-3.5 rounded-full flex items-center justify-between gap-2.5 shrink-0"
                style={{
                  backgroundColor: withAlpha(palette.cardBg, 0.95),
                  border: `1px solid ${withAlpha(decor.metal, 0.5)}`,
                  boxShadow: `0 12px 28px -14px ${withAlpha(palette.text, 0.6)}`,
                }}
              >
                {isPlaying && (
                  <iframe
                    className="hidden"
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
                    allow="autoplay"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-full flex items-center justify-center shadow-xs active:scale-95 transition-transform cursor-pointer"
                  style={{
                    backgroundColor: palette.accent,
                    color: palette.cardBg,
                    border: `1px solid ${withAlpha(decor.metal, 0.55)}`,
                  }}
                >
                  <span className="material-symbols-outlined text-sm">{isPlaying ? 'pause' : 'play_arrow'}</span>
                </button>
                <div className="flex-1 text-left overflow-hidden">
                  <p
                    className="text-[10px] font-semibold truncate"
                    style={{ color: palette.text }}
                  >
                    Música de la Dedicatoria
                  </p>
                  <p
                    className="text-[8px] truncate opacity-65"
                    style={{ color: palette.text }}
                  >
                    {isPlaying ? 'Reproduciendo audio...' : 'Pausado'}
                  </p>
                </div>
                <span
                  className={`material-symbols-outlined text-sm ${isPlaying ? 'animate-pulse' : 'opacity-45'}`}
                  style={{ color: palette.accent }}
                >
                  equalizer
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Visor Lightbox */}
        {selectedPhotoIndex !== null && photoUrls.length > 0 && (
          <div 
            className={`absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 transition-opacity duration-150 ${
              isClosingPhoto ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={closePhotoModal}
          >
            <button 
              onClick={closePhotoModal} 
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined block text-base">close</span>
            </button>

            <div 
              className={`relative bg-white p-3 pb-8 rounded-xs shadow-2xl max-w-[85%] max-h-[75vh] flex flex-col items-center ${
                isClosingPhoto ? 'animate-superposition-out' : 'animate-superposition-in'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={photoUrls[selectedPhotoIndex]} 
                alt={`Ampliada ${selectedPhotoIndex + 1}`} 
                className="max-w-full max-h-[55vh] object-contain rounded-xs bg-black/5" 
              />
              <p className="font-serif text-xs text-slate-500 mt-3 font-medium">
                {selectedPhotoIndex + 1} de {photoUrls.length}
              </p>

              {photoUrls.length > 1 && (
                <>
                  <button 
                    onClick={prevPhoto}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined block text-sm">chevron_left</span>
                  </button>
                  <button 
                    onClick={nextPhoto}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined block text-sm">chevron_right</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <style>{`
          .gpu-particle {
            will-change: transform, opacity;
            backface-visibility: hidden;
            transform-style: preserve-3d;
          }
          @keyframes flowerBloomCinematic {
            0% { transform: translate3d(0, 0, 0) scale(0) rotate(calc(var(--rot) - 20deg)); opacity: 0; }
            25% { transform: translate3d(var(--tx), var(--ty), 0) scale(var(--scale)) rotate(var(--rot)); opacity: 1; }
            65% { transform: translate3d(var(--tx), var(--ty), 0) scale(var(--scale)) rotate(var(--rot)); opacity: 1; }
            100% { transform: translate3d(calc(var(--tx) * 1.05), calc(var(--ty) * 1.05), 0) scale(calc(var(--scale) * 1.05)) rotate(calc(var(--rot) + 10deg)); opacity: 0; }
          }
        `}</style>
      </div>
    );
  };

  if (isFullView) {
    return (
      <div className="w-full min-h-screen bg-neutral-900 flex justify-center items-center p-0 md:p-6">
        <div className="w-full max-w-md md:max-w-lg min-h-screen md:min-h-[85vh] md:rounded-4xl shadow-2xl overflow-hidden flex flex-col bg-white relative">
          {renderCardBody()}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={shellRef}
      className="phone-shell mx-auto"
      style={{ '--phone-scale': scale.toFixed(3) } as React.CSSProperties}
    >
      <div className="phone-shell__frame relative rounded-[40px] bg-linear-to-b from-gray-700 via-gray-900 to-black p-2 shadow-[0_28px_60px_-18px_rgba(0,0,0,0.6)] ring-1 ring-white/20 flex flex-col">
        {/* Notch */}
        <div className="absolute top-2 inset-x-0 h-6 flex justify-center z-30 pointer-events-none">
          <div className="w-24 h-6 bg-black rounded-b-2xl"></div>
        </div>
        <div className="relative w-full h-full rounded-4xl bg-white overflow-hidden flex flex-col">
          {renderCardBody()}
        </div>
      </div>
    </div>
  );
};