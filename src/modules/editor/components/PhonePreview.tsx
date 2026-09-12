import React, { useEffect, useMemo, useRef } from 'react';
import { THEME_PRESETS, type DedicationForm } from '../types';
import { AnimatedBackground } from './AnimatedBackground';
import { resolvePalette } from '../../../utils/themePalette';
import { decorFor, edgeCss, textureCss } from '../../../utils/themeDecor';
import { giftsFor, type GiftPaint } from '../../../utils/themeGifts';
import { flowersFor } from '../../../utils/themeFlowers';
import { firstPhrase } from '../../../utils/firstPhrase';
import { isDemoMode } from '../../../utils/demoMode';
import { getYouTubeId } from '../../../utils/youtube';
import { useYouTubePlayer } from '../../../components/media/useYouTubePlayer';
import { useInView } from '../../../hooks/useInView';
import { usePhoneScale } from '../hooks/usePhoneScale';
import { useCardChoreography } from '../hooks/useCardChoreography';
import { usePhotoLightbox } from '../hooks/usePhotoLightbox';
import { SongPlayer } from './SongPlayer';
import { CardStage } from './CardStage';
import { SongChip } from './SongChip';
import { PhotoLightbox } from './PhotoLightbox';
import { EnvelopeScene } from './scenes/EnvelopeScene';
import { BloomScene } from './scenes/BloomScene';
import { PhraseScene } from './scenes/PhraseScene';
import { MemoriesScene } from './scenes/MemoriesScene';
import { FlowerBurstScene } from './scenes/FlowerBurstScene';
import { LetterScene } from './scenes/letter/LetterScene';

/**
 * La carta tal como la va a recibir: la previa del editor y el visor público.
 *
 * Solo compone. La coreografía de escenas vive en `useCardChoreography`, la
 * escala del teléfono en `usePhoneScale`, el visor de fotos en
 * `usePhotoLightbox`, y cada momento de la carta es una escena propia.
 *
 * La canción va sobre la IFrame API oficial (`useYouTubePlayer`): el
 * reproductor se crea en cuanto hay enlace, todavía con el sobre cerrado, y
 * vive visible dentro de la hoja, bajo el membrete. Aquí se decide cuándo
 * arranca, cuándo se pausa y cuándo aparece el chip flotante.
 */

interface PhonePreviewProps {
  data: DedicationForm;
  isFullView?: boolean;
}

/** Cuántas fotos entran en la carta. */
const MAX_SCENE_PHOTOS = 5;

/**
 * Cuánto se espera, ya en la hoja, antes de arrancar la canción: lo justo para
 * que el fundido de entrada la haya hecho visible. YouTube pide que más de la
 * mitad del reproductor se vea antes de iniciar una reproducción automática.
 */
const SONG_START_DELAY_MS = 400;

export const PhonePreview: React.FC<PhonePreviewProps> = ({ data, isFullView = false }) => {
  const { ref: shellRef, scale } = usePhoneScale();

  const theme = THEME_PRESETS[data.themeId] || THEME_PRESETS.classic;
  const cardTitle = data.title || 'Una Carta Especial';
  const recipientName = data.recipient || 'Tu Persona Especial';
  const senderName = data.sender || 'Alguien que te quiere';
  const message = data.message || 'Escribe tu mensaje desde el editor...';
  const videoId = getYouTubeId(data.songUrl);

  const song = useYouTubePlayer(videoId);
  const { play: playSong, pause: pauseSong } = song;
  const songSectionRef = useRef<HTMLElement>(null);
  const cardScrollRef = useRef<HTMLDivElement>(null);

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

  const monogram = recipientName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const flowers = flowersFor(data.themeId);
  /** Primera frase del mensaje para la escena suspendida; vacía si no hay mensaje. */
  const phrase = firstPhrase(data.message || '');
  /** `?demo=1`: los pasos que piden la mano corren solos, para poder grabar. */
  const demo = isDemoMode();

  /**
   * URLs pintables de las fotos.
   *
   * `data.photos` guarda además el `tempId` del servidor, que aquí no sirve de
   * nada: la clave temporal apunta a un contenedor privado. Lo único que se
   * puede pintar es `previewUrl` —el `blob:` local en el editor, la ruta pública
   * de la API en el visor—, así que las escenas trabajan siempre con esa lista.
   */
  const photoUrls = useMemo(
    () => (data.photos ?? []).slice(0, MAX_SCENE_PHOTOS).map((photo) => photo.previewUrl),
    [data.photos],
  );

  const card = useCardChoreography({ hasPhrase: phrase.length > 0, hasPhotos: photoUrls.length > 0 });
  const lightbox = usePhotoLightbox(photoUrls.length);
  const reading = card.view === 'card';

  /*
   * Umbral 0 y no 0,5: el chip se esconde en cuanto el reproductor ASOMA, no
   * cuando ya se ve medio.
   *
   * Con el reproductor al final de la carta, entra en pantalla justo por
   * abajo, que es donde vive el chip: entre el 0% y el 50% visible los dos
   * coincidían y el mando quedaba encima del vídeo. YouTube prohíbe tapar el
   * reproductor, así que la regla es "si asoma, el chip se va".
   */
  const songInView = useInView(songSectionRef, {
    root: cardScrollRef,
    threshold: 0,
    enabled: reading && Boolean(videoId),
  });

  /**
   * El muro de interacción. Tocar el sobre es el gesto que el navegador exige
   * para reproducir con sonido; la orden de reproducir sale cuando la hoja ya
   * se ve, con el reproductor a la vista. Si aun así el navegador la rechaza
   * —iOS no traspasa el gesto a un iframe de otro origen—, el reproductor lo
   * dice y un toque sobre el vídeo basta.
   */
  useEffect(() => {
    if (!reading || !videoId) return;
    const timer = setTimeout(playSong, SONG_START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [reading, videoId, playSong]);

  const handleOpen = () => {
    if (card.view !== 'envelope') return;
    if ('vibrate' in navigator) navigator.vibrate?.(12);
    card.open();
  };

  const handleClose = () => {
    card.close();
    pauseSong();
    lightbox.reset();
  };

  const revealSong = () => {
    songSectionRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  };

  const envelopePhase =
    card.view === 'envelope' ? 'closed' : card.view === 'opening' ? 'opening' : 'blooming';

  const body = (
    <div className={`w-full h-full relative overflow-hidden transition-all duration-500 ease-in-out ${theme.bgClass}`}>
      {/*
        Ambiente del tema: corazones, pétalos, estrellas, luciérnagas… Va en dos
        capas: una detrás de todo, y otra por delante mientras se lee la carta
        —si sólo va detrás, el papel la tapa casi entera y no se ve—. La de
        delante no recibe toques.
      */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <AnimatedBackground type={theme.animationType} />
      </div>
      {reading && (
        <div className="absolute inset-0 z-20 pointer-events-none opacity-45">
          <AnimatedBackground type={theme.animationType} />
        </div>
      )}

      {/* Portada / Sobre: momento 1. Vive hasta que arranca la frase; al
          cerrar se vuelve a montar limpio y la coreografía se reinicia. */}
      {(card.view === 'envelope' || card.view === 'opening' || card.view === 'blooming') && (
        <EnvelopeScene
          phase={envelopePhase}
          palette={palette}
          decor={decor}
          paint={paint}
          gifts={[giftLeft, giftRight]}
          texture={texture}
          edge={edge}
          title={cardTitle}
          recipient={recipientName}
          sender={senderName}
          onOpen={handleOpen}
        />
      )}

      {/* Floración: momento 2. Se monta al abrir y se queda (ya invisible)
          mientras se lee la carta; al cerrar se desmonta y vuelve a crecer. */}
      {card.view !== 'envelope' && card.view !== 'opening' && (
        <BloomScene flowers={flowers} palette={palette} decor={decor} />
      )}

      {/* La frase suspendida: momento 3 */}
      {card.view === 'phrase' && <PhraseScene phrase={phrase} palette={palette} />}

      {/* Descubrir los recuerdos: momento 4 (sólo con fotos) */}
      {card.view === 'memories' && (
        <MemoriesScene photos={photoUrls} palette={palette} decor={decor} onDone={card.finishMemories} />
      )}

      {/* El estallido de flores que cubre la pantalla, antes de la carta */}
      {card.view === 'burst' && <FlowerBurstScene flowers={flowers} />}

      {/* La carta y su cierre: momento 5. Siempre montada: el reproductor
          tiene que existir antes del toque. */}
      <LetterScene
        active={reading}
        title={cardTitle}
        recipient={recipientName}
        sender={senderName}
        message={message}
        photos={photoUrls}
        monogram={monogram}
        themeId={data.themeId}
        palette={palette}
        decor={decor}
        paint={paint}
        gifts={[giftLeft, giftRight]}
        texture={texture}
        edge={edge}
        scrollRef={cardScrollRef}
        demo={demo}
        onClose={handleClose}
        onOpenPhoto={lightbox.open}
        song={
          videoId ? (
            <SongPlayer
              videoId={videoId}
              hostRef={song.hostRef}
              status={song.status}
              errorCode={song.errorCode}
              onToggle={song.toggle}
              palette={palette}
              decor={decor}
              sectionRef={songSectionRef}
            />
          ) : undefined
        }
      />

      {/*
        Mando de la canción cuando el reproductor ya quedó arriba, fuera de la
        vista. Vive fuera del área con scroll y solo aparece entonces: nunca
        se pone encima del vídeo.
      */}
      {videoId && (
        <SongChip
          visible={reading && !songInView && lightbox.index === null}
          status={song.status}
          onToggle={song.toggle}
          onReveal={revealSong}
          palette={palette}
          decor={decor}
        />
      )}

      {lightbox.index !== null && photoUrls.length > 0 && (
        <PhotoLightbox
          photos={photoUrls}
          index={lightbox.index}
          closing={lightbox.closing}
          onClose={lightbox.close}
          onPrev={lightbox.prev}
          onNext={lightbox.next}
        />
      )}
    </div>
  );

  if (isFullView) {
    /*
     * El contenedor necesita ALTURA, no min-height: dentro, la carta pide
     * `h-full`, y un porcentaje de altura no resuelve contra un padre que sólo
     * tiene min-height — se quedaba en 0 px, y como todas las escenas van en
     * position:absolute, no había nada que levantara la caja. `dvh` en vez de
     * `vh` para que la barra del navegador móvil no recorte la carta.
     */
    return (
      <CardStage palette={palette} recipient={recipientName}>
        {/*
          Medidas del teléfono, las mismas del HTML descargable: 360 px de
          ancho como tope, la pantalla entera en móvil y una tarjeta con
          esquinas y sombra de 640 px arriba. Antes era `max-w-lg` (512 px) y
          la carta salía casi cuadrada, con el contenido nadando a lo ancho.
        */}
        <div
          className="relative z-10 flex w-full max-w-[360px] flex-col overflow-hidden h-dvh sm:h-[820px] sm:max-h-[92dvh] sm:rounded-[28px] sm:shadow-[0_40px_80px_-24px_rgba(0,0,0,0.35),0_4px_14px_-6px_rgba(0,0,0,0.18)]"
          style={{ backgroundColor: palette.cardBg, border: `1px solid ${palette.border}` }}
        >
          {body}
        </div>
      </CardStage>
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
          {body}
        </div>
      </div>
    </div>
  );
};
