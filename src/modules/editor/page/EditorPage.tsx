import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { THEME_PRESETS, type DedicationForm } from '../types';
import { PhonePreview } from '../components/PhonePreview';
import { Ornament, CornerFlourish, HeartConfetti, Rose } from '../../../components/decor';
import { ShareModal } from '../components/ShareModal';
import { publishDedication } from '../services/publishDedication';
import { CardStorageFullError } from '../../../utils/cardStore';
import { compressImage } from '../../../utils/compressImage';

export default function EditorPage() {
  const [step, setStep] = useState<number>(1);
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const [share, setShare] = useState<{ url: string; data: DedicationForm } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  // El ref no se puede leer en el render; este flag es solo para la etiqueta
  const [hasPublished, setHasPublished] = useState(false);
  const [compressing, setCompressing] = useState(false);

  /**
   * Última publicación de esta sesión. Sirve para dos cosas: reabrir el panel
   * sin volver a guardar cuando nada cambió, y reutilizar el id cuando sí.
   */
  const lastPublish = useRef<{
    signature: string;
    id: string;
    url: string;
    data: DedicationForm;
  } | null>(null);

  const [form, setForm] = useState<DedicationForm>({
    title: '',
    recipient: '',
    sender: '',
    message: '',
    songUrl: '',
    themeId: 'classic',
    photos: [],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    // Permite volver a elegir el mismo archivo tras quitarlo
    e.target.value = '';

    if (form.photos.length + files.length > 5) {
      alert('Puedes subir un máximo de 5 fotos.');
      return;
    }

    setCompressing(true);
    try {
      // Se reducen antes de entrar: el original de un móvil pesa 3-5 MB y en la
      // carta nunca se muestra a más de media pantalla.
      const results = await Promise.all(files.map(compressImage));
      const urls = results.map(({ blob }) => URL.createObjectURL(blob));
      setForm((prev) => ({ ...prev, photos: [...prev.photos, ...urls] }));
    } finally {
      setCompressing(false);
    }
  };

  const handlePublish = async () => {
    const signature = JSON.stringify(form);
    const previous = lastPublish.current;

    // Si nada cambió desde la última vez, solo se reabre el panel: volver a
    // guardar re-codificaría todas las fotos para nada.
    if (previous && previous.signature === signature) {
      setPublishError(null);
      setShare({ url: previous.url, data: previous.data });
      return;
    }

    setPublishing(true);
    setPublishError(null);
    try {
      const published = await publishDedication(form, previous?.id);
      lastPublish.current = {
        signature,
        id: published.id,
        url: published.url,
        data: published.data,
      };
      setHasPublished(true);
      setShare({ url: published.url, data: published.data });
    } catch (error) {
      setPublishError(
        error instanceof CardStorageFullError
          ? `La carta pesa ${error.sizeKb} KB y no cabe en el almacenamiento del navegador (tope ~5 MB). Quita una foto o usa imágenes más livianas.`
          : 'No pudimos generar el enlace. Intenta otra vez.',
      );
    } finally {
      setPublishing(false);
    }
  };

  const removePhoto = (index: number) => {
    setForm((prev) => {
      const gone = prev.photos[index];
      if (gone?.startsWith('blob:')) URL.revokeObjectURL(gone);
      return { ...prev, photos: prev.photos.filter((_, i) => i !== index) };
    });
  };

  return (
    <div className="relative w-full min-h-screen paper-sheet paper-vignette text-on-background flex flex-col">
      {/* Corazones muy tenues: es una mesa de trabajo, no deben competir con el formulario */}
      <HeartConfetti count={18} tone="rose" opacity={0.05} fixed className="z-0" />

      <header className="w-full bg-paper/95 border-b border-wine/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span
              className="material-symbols-outlined text-[#D4AF37] text-[20px] transition-transform group-hover:scale-110"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
            <span className="font-script text-wine text-3xl leading-none pb-1">Eternal Dedications</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-wine/70 hidden sm:inline-flex items-center gap-1.5 bg-blush/60 px-3 py-1.5 rounded-full ring-1 ring-wine/10">
              Paso {step} de 3
            </span>
            <Link to="/" className="text-xs font-semibold text-wine hover:text-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">close</span> Salir
            </Link>
          </div>
        </div>
        <div className="h-px w-full rule-gold"></div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8">
        <div className="md:hidden flex p-1 bg-white/70 rounded-full mb-6 max-w-xs mx-auto border border-wine/15 shadow-xs">
          <button
            type="button"
            onClick={() => setMobileTab('edit')}
            className={`flex-1 py-2 px-3 rounded-full font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'edit' ? 'bg-wine text-white shadow-sm' : 'text-wine/70 hover:text-wine'
            }`}
          >
            <span className="material-symbols-outlined text-sm">edit</span> Editar
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-2 px-3 rounded-full font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'preview' ? 'bg-wine text-white shadow-sm' : 'text-wine/70 hover:text-wine'
            }`}
          >
            <span className="material-symbols-outlined text-sm">visibility</span> Previa
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <section className={`flex-col gap-6 ${mobileTab === 'edit' ? 'flex' : 'hidden md:flex'}`}>
            <div className="flex items-start justify-between relative px-2 py-2">
              {/* Hilo que une los pasos */}
              <div className="absolute left-6 right-6 top-[22px] h-px bg-linear-to-r from-wine/15 via-wine/35 to-wine/15 -z-10" />
              {[
                { num: 1, label: 'Mensaje' },
                { num: 2, label: 'Multimedia' },
                { num: 3, label: 'Estilo' },
              ].map((s) => {
                const done = step > s.num;
                const active = step === s.num;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => setStep(s.num)}
                    className="flex flex-col items-center gap-1.5 px-3 cursor-pointer group"
                  >
                    <span
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                        active
                          ? 'bg-wine text-white ring-4 ring-blush shadow-[0_8px_18px_-6px_rgba(140,17,40,0.6)]'
                          : done
                            ? 'bg-blush text-wine ring-1 ring-wine/25'
                            : 'bg-white text-wine/50 ring-1 ring-wine/15 group-hover:ring-wine/35'
                      }`}
                    >
                      {done ? (
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                      ) : (
                        s.num
                      )}
                    </span>
                    <span className={`text-xs font-semibold transition-colors ${active ? 'text-wine' : 'text-wine/55'}`}>
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative bg-white rounded-4xl shadow-[0_24px_50px_-24px_rgba(94,10,27,0.35)] border border-wine/12 p-6 md:p-8 flex flex-col gap-5 overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-wine-deep via-wine to-tertiary"></div>
              <CornerFlourish corner="tr" tone="gold" size={64} className="opacity-60" />
              <CornerFlourish corner="bl" tone="gold" size={64} className="opacity-60" />

              {step === 1 && (
                <>
                  <div className="text-center pb-1">
                    <h2 className="font-headline-md text-xl font-bold text-on-background">
                      Escribe tu{' '}
                      <span className="font-script font-normal text-wine text-[1.7em] leading-none">dedicatoria</span>
                    </h2>
                    <Ornament tone="gold" width={150} className="mx-auto mt-1" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-wine/75 uppercase tracking-wider mb-1.5">Título de la carta</label>
                    <input name="title" value={form.title} onChange={handleChange} placeholder="Ej. Feliz Aniversario, Mi Amor" className="w-full bg-paper/60 border border-wine/15 rounded-xl px-4 py-3 outline-none transition-all focus:border-wine focus:bg-white focus:ring-2 focus:ring-wine/15 font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-wine/75 uppercase tracking-wider mb-1.5">Para quién es</label>
                    <input name="recipient" value={form.recipient} onChange={handleChange} placeholder="Ej. Mi persona favorita" className="w-full bg-paper/60 border border-wine/15 rounded-xl px-4 py-3 outline-none transition-all focus:border-wine focus:bg-white focus:ring-2 focus:ring-wine/15" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-wine/75 uppercase tracking-wider mb-1.5">De parte de</label>
                    <input name="sender" value={form.sender} onChange={handleChange} placeholder="Ej. Sebastián" className="w-full bg-paper/60 border border-wine/15 rounded-xl px-4 py-3 outline-none transition-all focus:border-wine focus:bg-white focus:ring-2 focus:ring-wine/15" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-wine/75 uppercase tracking-wider mb-1.5">Tu Mensaje</label>
                    <textarea name="message" value={form.message} onChange={handleChange} rows={4} placeholder="Escribe desde el corazón..." className="w-full bg-paper/60 border border-wine/15 rounded-xl px-4 py-3 outline-none transition-all focus:border-wine focus:bg-white focus:ring-2 focus:ring-wine/15 resize-none" />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="text-center pb-1">
                    <h2 className="font-headline-md text-xl font-bold text-on-background">
                      Fotos y{' '}
                      <span className="font-script font-normal text-wine text-[1.7em] leading-none">música</span>
                    </h2>
                    <Ornament tone="gold" width={150} className="mx-auto mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[11px] font-bold text-wine/75 uppercase tracking-wider">Fotos (máximo 5)</label>
                      <span className="text-[11px] font-semibold text-wine/70 bg-blush/70 px-2.5 py-0.5 rounded-full ring-1 ring-wine/10">
                        {compressing ? 'Optimizando…' : `${form.photos.length}/5`}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                      {form.photos.map((photo, i) => (
                        <div
                          key={i}
                          className="group relative aspect-square rounded-xl overflow-hidden bg-white p-1 ring-1 ring-wine/15 shadow-[0_6px_14px_-8px_rgba(94,10,27,0.5)]"
                          style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (1.5 + (i % 3))}deg)` }}
                        >
                          <img src={photo} alt={`Subida ${i}`} className="w-full h-full object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            aria-label={`Quitar foto ${i + 1}`}
                            className="absolute top-1.5 right-1.5 bg-wine-deep/80 hover:bg-wine text-white rounded-full p-0.5 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          >
                            <span className="material-symbols-outlined text-xs block">close</span>
                          </button>
                        </div>
                      ))}
                      {form.photos.length < 5 && (
                        <label className="aspect-square rounded-xl border-[1.5px] border-dashed border-wine/35 bg-paper/50 flex flex-col items-center justify-center cursor-pointer hover:border-wine hover:bg-blush/50 transition-colors">
                          <span className="material-symbols-outlined text-wine text-xl">add_a_photo</span>
                          <span className="text-[10px] font-semibold text-wine/70 mt-1">Subir</span>
                          <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-wine/75 uppercase tracking-wider mb-1.5">Enlace de Canción (YouTube)</label>
                    <input name="songUrl" value={form.songUrl} onChange={handleChange} placeholder="https://www.youtube.com/watch?v=..." className="w-full bg-paper/60 border border-wine/15 rounded-xl px-4 py-3 outline-none transition-all focus:border-wine focus:bg-white focus:ring-2 focus:ring-wine/15" />
                    <p className="text-xs text-wine/60 mt-1.5 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px]">music_note</span>
                      Sonará automáticamente cuando el destinatario abra la carta.
                    </p>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="text-center pb-1">
                    <h2 className="font-headline-md text-xl font-bold text-on-background">
                      Selecciona un{' '}
                      <span className="font-script font-normal text-wine text-[1.7em] leading-none">tema</span>
                    </h2>
                    <Ornament tone="gold" width={150} className="mx-auto mt-1" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.values(THEME_PRESETS).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setForm({ ...form, themeId: t.id })}
                        className={`relative p-2.5 rounded-2xl border-2 text-left transition-all flex flex-col gap-2 cursor-pointer ${
                          form.themeId === t.id
                            ? 'border-wine bg-blush/40 shadow-[0_10px_22px_-12px_rgba(140,17,40,0.6)]'
                            : 'border-wine/15 bg-white hover:border-wine/45'
                        }`}
                      >
                        {form.themeId === t.id && (
                          <span className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-wine text-white flex items-center justify-center shadow-md">
                            <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                          </span>
                        )}
                        <div className={`h-14 rounded-xl ${t.bgClass} ring-1 ring-black/10 shadow-inner flex items-center justify-center`}>
                          <span className={`material-symbols-outlined text-lg ${t.accentColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                        </div>
                        <span className="text-xs font-bold text-on-surface leading-tight">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="flex justify-between items-center mt-4 pt-5 border-t border-wine/12">
                <button
                  disabled={step === 1}
                  onClick={() => setStep((s) => s - 1)}
                  className="px-5 py-2 rounded-full text-wine disabled:opacity-25 font-semibold text-sm flex items-center gap-1 hover:bg-blush/60 transition-colors cursor-pointer disabled:cursor-default disabled:hover:bg-transparent"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span> Atrás
                </button>
                {step < 3 ? (
                  <button
                    onClick={() => setStep((s) => s + 1)}
                    className="px-7 py-3 rounded-full bg-wine text-white font-semibold text-sm shadow-[0_10px_24px_-10px_rgba(140,17,40,0.8)] flex items-center gap-1.5 hover:bg-primary hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    Siguiente <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                ) : (
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="relative group cursor-pointer disabled:cursor-wait"
                  >
                    <span className="absolute -inset-1 rounded-full bg-linear-to-r from-wine to-[#D4AF37] blur opacity-30 group-hover:opacity-55 transition-opacity"></span>
                    <span className="relative px-7 py-3 rounded-full bg-wine text-white font-semibold text-sm shadow-lg flex items-center gap-1.5 hover:bg-primary transition-colors">
                      {publishing ? 'Generando…' : hasPublished ? 'Ver enlace y QR' : 'Guardar y compartir'}
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        auto_awesome
                      </span>
                    </span>
                  </button>
                )}
              </div>

              {publishError && (
                <p className="text-sm text-error text-center -mt-1" role="alert">
                  {publishError}
                </p>
              )}
            </div>
          </section>

          <section className={`flex-col items-center md:sticky md:top-24 ${mobileTab === 'preview' ? 'flex' : 'hidden md:flex'}`}>
            <div className="relative flex flex-col items-center w-full">
              {/*
                Pedestal de móvil: una bandeja de papel donde se apoya la
                maqueta. Recorta su contenido, así las rosas pueden asomar por
                los bordes sin provocar desplazamiento lateral.
              */}
              <div
                aria-hidden="true"
                className="md:hidden absolute inset-x-0 top-9 -bottom-4 -z-10 overflow-hidden rounded-[40px] bg-white/60 ring-1 ring-wine/10 shadow-[0_18px_44px_-26px_rgba(94,10,27,0.5)]"
              >
                <span
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'radial-gradient(rgba(94,10,27,0.06) 0.5px, transparent 0.5px)',
                    backgroundSize: '12px 12px',
                  }}
                />
                <Rose size={92} className="absolute -left-5 -bottom-3 opacity-25 -rotate-[18deg]" />
                <Rose size={76} className="absolute -right-4 -bottom-1 opacity-20 rotate-[22deg]" />
                <CornerFlourish corner="tl" tone="gold" size={44} placement="top-3 left-3" className="opacity-45" />
                <CornerFlourish corner="tr" tone="gold" size={44} placement="top-3 right-3" className="opacity-45" />
              </div>

              {/* Halo y rosas de escritorio, sin cambios */}
              <div
                className="hidden md:block absolute -inset-x-16 -inset-y-10 pointer-events-none -z-10"
                aria-hidden="true"
              >
                <div className="w-full h-full rounded-[48px] bg-linear-to-b from-blush/70 via-paper-deep/40 to-transparent blur-2xl"></div>
              </div>
              <Rose size={104} className="pointer-events-none absolute -left-16 bottom-4 opacity-30 -rotate-[18deg] hidden xl:block" />
              <Rose size={88} className="pointer-events-none absolute -right-14 bottom-0 opacity-25 rotate-[22deg] hidden xl:block" />

              <p className="font-script text-wine/80 text-2xl md:text-3xl leading-none">así la va a recibir</p>
              <Ornament tone="gold" width={132} className="md:hidden mt-1 mb-3 opacity-80" />
              <span className="hidden md:block h-3" />

              <PhonePreview data={form} />
            </div>
          </section>
        </div>
      </main>

      <ShareModal
        open={share !== null}
        onClose={() => setShare(null)}
        data={share?.data ?? form}
        cardUrl={share?.url ?? ''}
      />
    </div>
  );
}