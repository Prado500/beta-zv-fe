import { useEffect, useState, type ChangeEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { THEME_PRESETS, type DedicationForm } from '../types';
import { PhonePreview } from '../components/PhonePreview';
import { Ornament, CornerFlourish, HeartConfetti, Rose } from '../../../components/decor';
import { QueuedModal } from '../components/QueuedModal';
import { SuccessModal } from '../components/SuccessModal';
import { EmailConfirmModal } from '../components/EmailConfirmModal';
import { useLetterEditor } from '../hooks/useLetterEditor';
import { MAX_PHOTOS, type LetterInput } from '../schemas/letterSchema';
import { FieldError } from '../../../components/ui/FieldError';
import { fieldClass, fieldTone, HINT, LABEL } from '../../../components/ui/formStyles';

/**
 * Mesa de trabajo de la carta. Solo pinta.
 *
 * Toda la lógica —validación, subida anticipada de fotos, doble confirmación del
 * correo y envío— vive en `useLetterEditor`. Aquí no hay ni un `fetch` ni un
 * `if` sobre códigos de estado: esta pantalla no sabe que existe una API.
 */

/** Compra que habilita esta carta; llega en el estado de la ruta desde el pago. */
interface EditorState {
  purchaseId?: string;
}

export default function EditorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const purchaseId = (location.state as EditorState | null)?.purchaseId ?? null;

  const [step, setStep] = useState<number>(1);
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');

  const {
    form,
    photos,
    confirmingEmail,
    submitting,
    error,
    outcome,
    canSubmit,
    requestSubmit,
    confirmSubmit,
    cancelConfirm,
    revealStepErrors,
    dismissOutcome,
  } = useLetterEditor(purchaseId);

  const {
    register,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = form;

  // La previsualización se alimenta de lo que hay escrito ahora mismo, sin
  // esperar a que el campo sea válido: se está viendo escribir, no publicar.
  const values = watch();

  // Sin compra pagada no hay carta que crear: el backend respondería 404/409 y el
  // usuario perdería lo escrito. Se devuelve a la landing antes de empezar.
  useEffect(() => {
    if (!purchaseId) navigate('/', { replace: true });
  }, [purchaseId, navigate]);

  const tone = (field: keyof LetterInput) =>
    fieldTone(Boolean(errors[field]), Boolean(dirtyFields[field]));

  const goTo = (next: number) => {
    revealStepErrors(step);
    setStep(next);
  };

  const onPickFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Permite volver a elegir el mismo archivo tras quitarlo.
    event.target.value = '';
    void photos.addFiles(files);
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
                    onClick={() => goTo(s.num)}
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

            <form
              onSubmit={requestSubmit}
              noValidate
              className="relative bg-white rounded-4xl shadow-[0_24px_50px_-24px_rgba(94,10,27,0.35)] border border-wine/12 p-6 md:p-8 flex flex-col gap-5 overflow-hidden"
            >
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
                    <label className={LABEL} htmlFor="letter-title">Título de la carta</label>
                    <input
                      id="letter-title"
                      {...register('title')}
                      maxLength={120}
                      placeholder="Ej. Feliz Aniversario, Mi Amor"
                      aria-invalid={Boolean(errors.title)}
                      aria-describedby={errors.title ? 'letter-title-error' : undefined}
                      className={fieldClass(tone('title'), 'font-medium')}
                    />
                    <FieldError id="letter-title-error" message={errors.title?.message} />
                  </div>

                  <div>
                    <label className={LABEL} htmlFor="letter-recipient">Para quién es</label>
                    <input
                      id="letter-recipient"
                      {...register('recipient')}
                      maxLength={80}
                      placeholder="Ej. Ana María"
                      aria-invalid={Boolean(errors.recipient)}
                      aria-describedby={errors.recipient ? 'letter-recipient-error' : undefined}
                      className={fieldClass(tone('recipient'))}
                    />
                    <FieldError id="letter-recipient-error" message={errors.recipient?.message} />
                  </div>

                  <div>
                    {/*
                      El correo es el de quien compra, no el de su pareja, salvo que
                      él quiera. Decirlo en el propio label evita el error más caro
                      del producto: mandarle la sorpresa a quien iba a recibirla.
                    */}
                    <label className={LABEL} htmlFor="letter-email">
                      Tu correo (o el correo donde quieres recibir el regalo para dárselo a tu pareja)
                    </label>
                    <input
                      id="letter-email"
                      type="email"
                      {...register('recipientEmail')}
                      autoComplete="email"
                      placeholder="tucorreo@ejemplo.com"
                      aria-invalid={Boolean(errors.recipientEmail)}
                      aria-describedby={errors.recipientEmail ? 'letter-email-error' : undefined}
                      className={fieldClass(tone('recipientEmail'))}
                    />
                    <FieldError id="letter-email-error" message={errors.recipientEmail?.message} />
                    <p className={HINT}>
                      <span className="material-symbols-outlined text-[15px]">mail</span>
                      A esta dirección llegan el enlace de la carta, el código QR y el archivo
                      descargable. Ponla bien: es lo que vas a entregar.
                    </p>
                  </div>

                  <div>
                    <label className={LABEL} htmlFor="letter-sender">De parte de</label>
                    <input
                      id="letter-sender"
                      {...register('sender')}
                      maxLength={80}
                      placeholder="Ej. Sebastián"
                      aria-invalid={Boolean(errors.sender)}
                      aria-describedby={errors.sender ? 'letter-sender-error' : undefined}
                      className={fieldClass(tone('sender'))}
                    />
                    <FieldError id="letter-sender-error" message={errors.sender?.message} />
                  </div>

                  <div>
                    <label className={LABEL} htmlFor="letter-message">Tu Mensaje</label>
                    <textarea
                      id="letter-message"
                      {...register('message')}
                      rows={4}
                      maxLength={4000}
                      placeholder="Escribe desde el corazón..."
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={errors.message ? 'letter-message-error' : undefined}
                      className={fieldClass(tone('message'), 'resize-none')}
                    />
                    <FieldError id="letter-message-error" message={errors.message?.message} />
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
                      <label className="block text-[11px] font-bold text-wine/75 uppercase tracking-wider">Fotos (máximo {MAX_PHOTOS})</label>
                      <span className="text-[11px] font-semibold text-wine/70 bg-blush/70 px-2.5 py-0.5 rounded-full ring-1 ring-wine/10">
                        {photos.compressing
                          ? 'Optimizando…'
                          : photos.uploading > 0
                            ? `Subiendo a la nube… ${photos.ready}/${photos.photos.length}`
                            : `${photos.photos.length}/${MAX_PHOTOS}`}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                      {photos.photos.map((photo, i) => (
                        <div
                          key={photo.previewUrl}
                          className="group relative aspect-square rounded-xl overflow-hidden bg-white p-1 ring-1 ring-wine/15 shadow-[0_6px_14px_-8px_rgba(94,10,27,0.5)]"
                          style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (1.5 + (i % 3))}deg)` }}
                        >
                          {/* Siempre la copia local: el contenedor del servidor es privado. */}
                          <img
                            src={photo.previewUrl}
                            alt={photo.fileName}
                            className={`w-full h-full object-cover rounded-lg transition-opacity ${
                              photo.status === 'uploading' ? 'opacity-45' : 'opacity-100'
                            }`}
                          />
                          {photo.status === 'uploading' && (
                            <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-wine">
                              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                              <span className="text-[9px] font-bold leading-none text-center px-1">Subiendo a la nube…</span>
                            </span>
                          )}
                          {photo.status === 'error' && (
                            <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-white/80 text-error">
                              <span className="material-symbols-outlined text-[18px]">error</span>
                              <span className="text-[9px] font-bold leading-none text-center px-1">No subió; quítala</span>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => photos.removePhoto(i)}
                            aria-label={`Quitar ${photo.fileName}`}
                            className="absolute top-1.5 right-1.5 bg-wine-deep/80 hover:bg-wine text-white rounded-full p-0.5 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          >
                            <span className="material-symbols-outlined text-xs block">close</span>
                          </button>
                        </div>
                      ))}
                      {photos.photos.length < MAX_PHOTOS && (
                        <label className="aspect-square rounded-xl border-[1.5px] border-dashed border-wine/35 bg-paper/50 flex flex-col items-center justify-center cursor-pointer hover:border-wine hover:bg-blush/50 transition-colors">
                          <span className="material-symbols-outlined text-wine text-xl">add_a_photo</span>
                          <span className="text-[10px] font-semibold text-wine/70 mt-1">Subir</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={onPickFiles}
                            aria-label="Subir fotos"
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    {photos.error && (
                      <p className="text-xs text-error font-medium" role="alert">
                        {photos.error}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={LABEL} htmlFor="letter-song">Enlace de Canción (YouTube)</label>
                    <input
                      id="letter-song"
                      {...register('songUrl')}
                      placeholder="https://www.youtube.com/watch?v=..."
                      aria-invalid={Boolean(errors.songUrl)}
                      aria-describedby={errors.songUrl ? 'letter-song-error' : undefined}
                      className={fieldClass(tone('songUrl'))}
                    />
                    <FieldError id="letter-song-error" message={errors.songUrl?.message} />
                    <p className={HINT}>
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
                        onClick={() => setValue('themeId', t.id, { shouldValidate: true, shouldDirty: true })}
                        className={`relative p-2.5 rounded-2xl border-2 text-left transition-all flex flex-col gap-2 cursor-pointer ${
                          values.themeId === t.id
                            ? 'border-wine bg-blush/40 shadow-[0_10px_22px_-12px_rgba(140,17,40,0.6)]'
                            : 'border-wine/15 bg-white hover:border-wine/45'
                        }`}
                      >
                        {values.themeId === t.id && (
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
                  type="button"
                  disabled={step === 1}
                  onClick={() => goTo(step - 1)}
                  className="px-5 py-2 rounded-full text-wine disabled:opacity-25 font-semibold text-sm flex items-center gap-1 hover:bg-blush/60 transition-colors cursor-pointer disabled:cursor-default disabled:hover:bg-transparent"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span> Atrás
                </button>
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => goTo(step + 1)}
                    className="px-7 py-3 rounded-full bg-wine text-white font-semibold text-sm shadow-[0_10px_24px_-10px_rgba(140,17,40,0.8)] flex items-center gap-1.5 hover:bg-primary hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    Siguiente <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="relative group cursor-pointer disabled:cursor-wait"
                  >
                    <span className="absolute -inset-1 rounded-full bg-linear-to-r from-wine to-[#D4AF37] blur opacity-30 group-hover:opacity-55 transition-opacity"></span>
                    <span className="relative px-7 py-3 rounded-full bg-wine text-white font-semibold text-sm shadow-lg flex items-center gap-1.5 hover:bg-primary transition-colors">
                      {submitting
                        ? 'Enviando…'
                        : photos.uploading > 0
                          ? 'Esperando las fotos…'
                          : 'Guardar y compartir'}
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

              {photos.uploading > 0 && (
                <p className="text-xs text-wine/70 text-center -mt-1">
                  Quedan {photos.uploading} foto(s) subiendo. En cuanto terminen podrás enviar la
                  carta.
                </p>
              )}

              {/* Mientras la confirmación está abierta el error se ve ahí, no aquí. */}
              {error && !confirmingEmail && (
                <p className="text-sm text-error font-medium text-center -mt-1" role="alert">
                  {error}
                </p>
              )}
            </form>
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

              <PhonePreview data={values as DedicationForm} />
            </div>
          </section>
        </div>
      </main>

      {/* Se monta al abrirse: así el correo editable nace con el valor correcto. */}
      {confirmingEmail !== null && (
        <EmailConfirmModal
          email={confirmingEmail}
          submitting={submitting}
          error={error}
          onConfirm={(confirmed) => void confirmSubmit(confirmed)}
          onCancel={cancelConfirm}
        />
      )}

      {/*
        Dos desenlaces posibles y excluyentes. Cuál se ve lo decidió el código de
        estado que devolvió el backend, no una suposición sobre su configuración:
        202 = encolada (el enlace llega por correo), 201/200 = ya está escrita.
      */}
      <QueuedModal
        open={outcome?.mode === 'queued'}
        message={outcome?.mode === 'queued' ? outcome.message : ''}
        recipientEmail={values.recipientEmail}
        onClose={() => {
          dismissOutcome();
          navigate('/', { replace: true });
        }}
      />

      <SuccessModal
        open={outcome?.mode === 'ready'}
        publicUrl={outcome?.mode === 'ready' ? outcome.publicUrl : ''}
        qrUrl={outcome?.mode === 'ready' ? outcome.qrUrl : null}
        recipientEmail={values.recipientEmail}
        letter={values as DedicationForm}
        onClose={() => {
          dismissOutcome();
          navigate('/', { replace: true });
        }}
      />
    </div>
  );
}
