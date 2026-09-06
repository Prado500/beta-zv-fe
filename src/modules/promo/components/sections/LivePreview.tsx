import React, { useState } from 'react';
import { AnimatedBackground } from '../../../editor/components/AnimatedBackground';
import { Ornament, CornerFlourish, HeartConfetti, PhotoFrame, Rose } from '../../../../components/decor';
import { EmotionGrid } from './EmotionGrid';

export const LivePreview: React.FC = () => {
  const [liveName, setLiveName] = useState('');
  const [liveMessage, setLiveMessage] = useState('');
  const [theme, setTheme] = useState<'tema1' | 'tema2'>('tema1');
  /**
   * En móvil el formulario y el teléfono se apilaban: había que escribir,
   * bajar a ver el efecto y volver a subir. El mismo conmutador del editor
   * muestra uno u otro. En escritorio se ven los dos a la vez, como antes.
   */
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');

  return (
    <section className="py-14 md:py-section-gap relative overflow-hidden" id="preview">
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#b90538 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
      />
      
      <HeartConfetti count={7} tone="rose" opacity={0.14} className="z-0" />

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter relative z-10">
        
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-on-background mb-3 tracking-tight">
            Tú tienes el{' '}
            <span className="font-script font-normal text-wine text-[1.35em] leading-none">control total</span>
          </h2>
          <Ornament tone="gold" className="mx-auto mb-8" />
          <PhotoFrame tilt={1.5} tape="left" className="max-w-2xl mx-auto mb-10">
            <div className="aspect-video">
              <iframe src="https://www.youtube.com/embed/TU_VIDEO_ID_3" className="w-full h-full border-0" title="Demostración"></iframe>
            </div>
          </PhotoFrame>
        </div>

        <div className="relative bg-white p-5 md:p-12 rounded-4xl shadow-xl ambient-shadow ring-1 ring-wine/10 overflow-hidden">
          <CornerFlourish corner="tl" tone="gold" size={72} className="opacity-70" />
          <CornerFlourish corner="br" tone="gold" size={72} className="opacity-70" />

          {/* Conmutador de móvil */}
          <div className="md:hidden relative flex p-1 bg-paper/70 rounded-full mb-5 max-w-xs mx-auto border border-wine/15 shadow-xs">
            <button
              type="button"
              onClick={() => setMobileTab('edit')}
              aria-pressed={mobileTab === 'edit'}
              className={`flex-1 py-2 px-3 rounded-full font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileTab === 'edit' ? 'bg-wine text-white shadow-sm' : 'text-wine/70'
              }`}
            >
              <span className="material-symbols-outlined text-sm">edit</span> Editar
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('preview')}
              aria-pressed={mobileTab === 'preview'}
              className={`flex-1 py-2 px-3 rounded-full font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileTab === 'preview' ? 'bg-wine text-white shadow-sm' : 'text-wine/70'
              }`}
            >
              <span className="material-symbols-outlined text-sm">visibility</span> Previa
            </button>
          </div>

          <div className="relative grid md:grid-cols-2 gap-9 md:gap-12 items-center">

          {/* Formulario Estilo Editor */}
          <div className={`flex-col gap-6 ${mobileTab === 'edit' ? 'flex' : 'hidden md:flex'}`}>
            <h3 className="text-xl font-bold border-b border-wine/15 pb-2 mb-2 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-wine text-white text-sm font-bold">1</span>
              Personaliza tu detalle
            </h3>
            
            <div>
              <label className="block font-bold text-sm text-on-surface mb-2">Para (Nombre)</label>
              <input 
                type="text" 
                placeholder="Ej. Mi princesa, Valeria..." 
                value={liveName} 
                onChange={(e) => setLiveName(e.target.value)} 
                className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body-md" 
              />
            </div>
            
            <div>
              <label className="block font-bold text-sm text-on-surface mb-2">Tu Dedicatoria</label>
              <textarea 
                rows={3} 
                placeholder="Escribe lo que te dicte el corazón..." 
                value={liveMessage} 
                onChange={(e) => setLiveMessage(e.target.value)} 
                className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body-md resize-none" 
              />
            </div>

            <div>
              <label className="block font-bold text-sm text-on-surface mb-2">Canción de Fondo (YouTube)</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">music_note</span>
                <input 
                  type="text" 
                  readOnly 
                  placeholder="Ej. Perfect - Ed Sheeran" 
                  className="w-full pl-10 p-3.5 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface-variant outline-none cursor-not-allowed font-body-md" 
                />
              </div>
            </div>
            
            {/* Nuevas Cajas de Selección de Estilo */}
            <div className="mt-2">
              <label className="flex items-center gap-2 font-bold text-xs text-on-surface-variant uppercase tracking-wider mb-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-wine text-white text-sm font-bold normal-case">2</span>
                Elige un estilo visual
              </label>
              <div className="grid grid-cols-2 gap-3">
                
                {/* Caja Tema 1 */}
                <button
                  type="button"
                  onClick={() => setTheme('tema1')}
                  className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col gap-2.5 cursor-pointer ${
                    theme === 'tema1'
                      ? 'border-rose-300/80 bg-rose-50/40 shadow-xs'
                      : 'border-outline-variant/40 hover:border-rose-200 bg-surface'
                  }`}
                >
                  <div className="h-11 rounded-xl bg-linear-to-r from-rose-100/70 to-pink-100/70 border border-rose-200/50 flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-rose-500 text-lg">favorite</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface">Romántico Clásico</span>
                </button>

                {/* Caja Tema 2 */}
                <button
                  type="button"
                  onClick={() => setTheme('tema2')}
                  className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col gap-2.5 cursor-pointer ${
                    theme === 'tema2'
                      ? 'border-indigo-400/80 bg-indigo-950/5 shadow-xs'
                      : 'border-outline-variant/40 hover:border-indigo-300 bg-surface'
                  }`}
                >
                  <div className="h-11 rounded-xl bg-linear-to-r from-slate-900 to-indigo-900 border border-indigo-800/40 flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-rose-400 text-lg">favorite</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface">Rosado Pastel</span>
                </button>

              </div>
            </div>
          </div>

          {/* Celular Elegante con Transición Manteniéndose Intacta */}
          <div
            className={`relative justify-center ${
              mobileTab === 'preview' ? 'flex' : 'hidden md:flex'
            }`}
          >
            {/* Bandeja de papel donde se apoya la maqueta, solo en móvil.
                Recorta su contenido para que las rosas asomen sin desbordar. */}
            <div
              aria-hidden="true"
              className="md:hidden absolute inset-x-0 -top-2 -bottom-3 -z-10 overflow-hidden rounded-[36px] bg-paper/70 ring-1 ring-wine/10"
            >
              <span
                className="absolute inset-0"
                style={{
                  backgroundImage: 'radial-gradient(rgba(94,10,27,0.06) 0.5px, transparent 0.5px)',
                  backgroundSize: '12px 12px',
                }}
              />
              <Rose size={84} className="absolute -left-5 -bottom-4 opacity-25 -rotate-[18deg]" />
              <Rose size={70} className="absolute -right-4 -bottom-2 opacity-20 rotate-[22deg]" />
              <CornerFlourish corner="tl" tone="gold" size={40} placement="top-2.5 left-2.5" className="opacity-45" />
              <CornerFlourish corner="tr" tone="gold" size={40} placement="top-2.5 right-2.5" className="opacity-45" />
            </div>

            <div className="relative bg-linear-to-b from-gray-700 via-gray-900 to-black p-1.5 rounded-[2.5rem] shadow-2xl ring-1 ring-white/20 w-full max-w-[212px] sm:max-w-[290px] md:max-w-[320px]">
              
              <div className="absolute top-1.5 inset-x-0 h-6 flex justify-center z-20 pointer-events-none">
                <div className="w-24 h-6 bg-black rounded-b-2xl"></div>
              </div>
              
              {/* Pantalla con cambio de color y animación suave */}
              <div className={`w-full h-full aspect-9/19 rounded-[2.2rem] overflow-hidden relative flex flex-col pt-16 pb-6 px-6 transition-colors duration-500 ${theme === 'tema1' ? 'bg-[#faf7f5]' : 'bg-[#0f111a]'}`}>
                
                <div className="absolute inset-0 z-0">
                  <AnimatedBackground type={theme === 'tema1' ? 'hearts' : 'stars'} />
                </div>

                <div className="text-center flex-1 overflow-y-auto relative z-10 custom-scrollbar">
                  <h3 className={`text-2xl font-bold mb-6 transition-all duration-300 ${theme === 'tema1' ? 'text-[#4a3f35]' : 'text-white'}`}>
                    {liveName ? `Para ${liveName}` : 'Para mi Amor'}
                  </h3>
                  <p className={`text-base leading-relaxed italic transition-all duration-300 ${theme === 'tema1' ? 'text-[#5c4e43]' : 'text-gray-300'}`}>
                    {liveMessage || 'Escribe tu mensaje en el editor de la izquierda para ver cómo cobra vida...'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          </div>
        </div>

        {/* "Todo lo que necesitas para emocionar" vive aquí, junto al resultado */}
        <div className="mt-16 md:mt-24">
          <EmotionGrid />
        </div>
      </div>
    </section>
  );
};