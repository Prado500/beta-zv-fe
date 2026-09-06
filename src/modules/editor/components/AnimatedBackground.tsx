import React from 'react';

interface CustomCSSProperties extends React.CSSProperties {
  '--tx'?: string;
  '--ty'?: string;
}

interface AnimatedBackgroundProps {
  type: 'hearts' | 'petals' | 'stars' | 'sunsetGlow' | 'sparkles' | 'leaves' | 'butterflies' | 'fireflies' | string;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ type }) => {
  // 1. HEARTS (Romántico Clásico)
  if (type === 'hearts') {
    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
        <div className="absolute top-1/4 -left-10 w-48 h-48 bg-rose-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-10 w-56 h-56 bg-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="absolute inset-0 w-full h-full">
          {[
            { left: '10%', size: 'w-5 h-5', delay: '0s', duration: '9s', tx: '15px' },
            { left: '30%', size: 'w-3.5 h-3.5', delay: '2.5s', duration: '7s', tx: '-20px' },
            { left: '55%', size: 'w-6 h-6', delay: '1s', duration: '10s', tx: '25px' },
            { left: '75%', size: 'w-4 h-4', delay: '4s', duration: '8s', tx: '-15px' },
            { left: '88%', size: 'w-5 h-5', delay: '2s', duration: '11s', tx: '10px' },
          ].map((item, idx) => (
            <svg
              key={idx}
              className={`absolute text-rose-400/40 fill-current ${item.size}`}
              style={{
                left: item.left,
                animation: `floatUpRomantic ${item.duration} infinite ease-in-out ${item.delay}`,
                '--tx': item.tx,
              } as CustomCSSProperties}
              viewBox="0 0 24 24"
            >
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/>
            </svg>
          ))}
        </div>

        <style>{`
          @keyframes floatUpRomantic {
            0% { top: 110%; transform: translateX(0) scale(0.7) rotate(0deg); opacity: 0; }
            20% { opacity: 0.6; }
            80% { opacity: 0.6; }
            100% { top: -20%; transform: translateX(var(--tx)) scale(1.1) rotate(18deg); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  // 2. PETALS (Rosado Pastel)
  if (type === 'petals') {
    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
        <div className="absolute -top-10 right-10 w-44 h-44 bg-rose-200/30 rounded-full blur-2xl animate-pulse" />
        <div className="absolute inset-0 w-full h-full">
          {[
            { left: '15%', size: 'w-4 h-4', delay: '0s', duration: '8s', tx: '20px' },
            { left: '35%', size: 'w-3 h-3', delay: '3s', duration: '6s', tx: '-15px' },
            { left: '60%', size: 'w-4.5 h-4.5', delay: '1s', duration: '9s', tx: '30px' },
            { left: '80%', size: 'w-3.5 h-3.5', delay: '4s', duration: '7s', tx: '-25px' },
          ].map((item, idx) => (
            <svg
              key={idx}
              className={`absolute text-rose-300/50 fill-current ${item.size}`}
              style={{
                left: item.left,
                animation: `petalFall ${item.duration} infinite ease-in-out ${item.delay}`,
                '--tx': item.tx,
              } as CustomCSSProperties}
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.5 2 2 6.5 2 12c0 3.5 2 6.5 5 8 1.5-3 3.5-6 5-10 1.5 4 3.5 7 5 10 3-1.5 5-4.5 5-8 0-5.5-4.5-10-10-10z"/>
            </svg>
          ))}
        </div>
        <style>{`
          @keyframes petalFall {
            0% { top: -10%; transform: translateX(0) rotate(0deg); opacity: 0; }
            20% { opacity: 0.7; }
            80% { opacity: 0.7; }
            100% { top: 110%; transform: translateX(var(--tx)) rotate(180deg); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  // 3. STARS (Noche Estrellada)
  if (type === 'stars') {
    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-0 w-52 h-52 bg-amber-400/10 rounded-full blur-3xl" />

        <span className="absolute text-amber-200/90 text-xs left-[15%] top-[18%] animate-ping" style={{ animationDuration: '3s' }}>✦</span>
        <span className="absolute text-amber-100/70 text-base left-[75%] top-[25%] animate-pulse">✦</span>
        <span className="absolute text-amber-200/80 text-xs left-[22%] top-[62%] animate-pulse">✨</span>
        <span className="absolute text-amber-100/90 text-sm left-[82%] top-[78%] animate-ping" style={{ animationDuration: '4s' }}>✦</span>

        <div className="absolute inset-0 w-full h-full">
          {[
            { left: '20%', size: 'w-1 h-1', delay: '0s', duration: '6s' },
            { left: '45%', size: 'w-1.5 h-1.5', delay: '2s', duration: '8s' },
            { left: '68%', size: 'w-1 h-1', delay: '1s', duration: '7s' },
            { left: '85%', size: 'w-2 h-2', delay: '3s', duration: '9s' },
          ].map((stardust, i) => (
            <div
              key={i}
              className={`absolute bg-amber-200/60 rounded-full blur-[0.5px] ${stardust.size}`}
              style={{
                left: stardust.left,
                animation: `stardustRise ${stardust.duration} infinite linear ${stardust.delay}`,
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes stardustRise {
            0% { top: 110%; opacity: 0; }
            30% { opacity: 0.8; }
            80% { opacity: 0.8; }
            100% { top: -10%; opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  // 4. SPARKLES (Sueño de Lavanda)
  if (type === 'sparkles') {
    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
        <div className="absolute top-10 left-10 w-52 h-52 bg-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-indigo-300/20 rounded-full blur-3xl animate-pulse delay-700" />
        
        <div className="absolute inset-0 w-full h-full">
          {[
            { left: '12%', top: '25%', delay: '0s', duration: '3s', symbol: '❇' },
            { left: '48%', top: '15%', delay: '1s', duration: '4s', symbol: '✦' },
            { left: '78%', top: '40%', delay: '0.5s', duration: '3.5s', symbol: '✨' },
            { left: '25%', top: '70%', delay: '2s', duration: '4.5s', symbol: '✦' },
            { left: '70%', top: '82%', delay: '1.5s', duration: '3.2s', symbol: '❇' },
          ].map((sp, idx) => (
            <span
              key={idx}
              className="absolute text-violet-400/70 text-sm select-none"
              style={{
                left: sp.left,
                top: sp.top,
                animation: `sparkleGlow ${sp.duration} infinite ease-in-out ${sp.delay}`,
              }}
            >
              {sp.symbol}
            </span>
          ))}
        </div>
        <style>{`
          @keyframes sparkleGlow {
            0%, 100% { transform: scale(0.6) rotate(0deg); opacity: 0.2; }
            50% { transform: scale(1.3) rotate(45deg); opacity: 0.85; }
          }
        `}</style>
      </div>
    );
  }

  // 5. LEAVES (Jardín Esmeralda)
  if (type === 'leaves') {
    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
        <div className="absolute -top-12 left-1/4 w-56 h-56 bg-emerald-300/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 w-full h-full">
          {[
            { left: '15%', size: 'w-4 h-4', delay: '0s', duration: '9s', tx: '25px' },
            { left: '40%', size: 'w-3.5 h-3.5', delay: '3s', duration: '7s', tx: '-20px' },
            { left: '72%', size: 'w-5 h-5', delay: '1.5s', duration: '10s', tx: '15px' },
          ].map((item, idx) => (
            <svg
              key={idx}
              className={`absolute text-emerald-500/35 fill-current ${item.size}`}
              style={{
                left: item.left,
                animation: `leafDrift ${item.duration} infinite ease-in-out ${item.delay}`,
                '--tx': item.tx,
              } as CustomCSSProperties}
              viewBox="0 0 24 24"
            >
              <path d="M17 8C8 10 59 16.5 4 20c.5-3.5 2.5-10 13-12zm0 0c-4 4-8 8.5-13 12"/>
            </svg>
          ))}
        </div>
        <style>{`
          @keyframes leafDrift {
            0% { top: -10%; transform: translateX(0) rotate(0deg); opacity: 0; }
            25% { opacity: 0.6; }
            75% { opacity: 0.6; }
            100% { top: 110%; transform: translateX(var(--tx)) rotate(90deg); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  // 6. FIREFLIES (Medianoche Azul)
  if (type === 'fireflies') {
    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute inset-0 w-full h-full">
          {[
            { left: '20%', top: '60%', size: 'w-2 h-2', delay: '0s', duration: '6s', tx: '15px', ty: '-30px' },
            { left: '50%', top: '40%', size: 'w-1.5 h-1.5', delay: '2s', duration: '7s', tx: '-20px', ty: '-40px' },
            { left: '75%', top: '70%', size: 'w-2.5 h-2.5', delay: '1s', duration: '8s', tx: '25px', ty: '-20px' },
            { left: '30%', top: '25%', size: 'w-2 h-2', delay: '3s', duration: '6.5s', tx: '-10px', ty: '30px' },
          ].map((ff, idx) => (
            <div
              key={idx}
              className={`absolute rounded-full bg-sky-300 shadow-[0_0_8px_#38bdf8] ${ff.size}`}
              style={{
                left: ff.left,
                top: ff.top,
                animation: `fireflyFloat ${ff.duration} infinite ease-in-out ${ff.delay}`,
                '--tx': ff.tx,
                '--ty': ff.ty,
              } as CustomCSSProperties}
            />
          ))}
        </div>
        <style>{`
          @keyframes fireflyFloat {
            0%, 100% { transform: translate(0, 0); opacity: 0.2; }
            50% { transform: translate(var(--tx), var(--ty)); opacity: 0.9; }
          }
        `}</style>
      </div>
    );
  }

  // 7. BUTTERFLIES (Carta Vintage)
  if (type === 'butterflies') {
    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
        <div className="absolute top-1/4 left-10 w-48 h-48 bg-amber-200/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 w-full h-full">
          {[
            { left: '18%', size: 'w-5 h-5', delay: '0s', duration: '11s', tx: '35px' },
            { left: '65%', size: 'w-4 h-4', delay: '4s', duration: '9s', tx: '-25px' },
          ].map((item, idx) => (
            <svg
              key={idx}
              className={`absolute text-amber-700/30 fill-current ${item.size}`}
              style={{
                left: item.left,
                animation: `butterflyFly ${item.duration} infinite ease-in-out ${item.delay}`,
                '--tx': item.tx,
              } as CustomCSSProperties}
              viewBox="0 0 24 24"
            >
              <path d="M12 12c-2-3-6-4-8-1 0 3 2 6 5 6 2 0 3-2 3-5zm0 0c2-3 6-4 8-1 0 3-2 6-5 6-2 0-3-2-3-5zm0 0c-1 3-3 7-5 9 3 0 5-2 5-9zm0 0c1 3 3 7 5 9-3 0-5-2-5-9z"/>
            </svg>
          ))}
        </div>
        <style>{`
          @keyframes butterflyFly {
            0% { top: 110%; transform: translateX(0) scale(0.8) rotate(-10deg); opacity: 0; }
            30% { opacity: 0.5; }
            70% { opacity: 0.5; }
            100% { top: -15%; transform: translateX(var(--tx)) scale(1.1) rotate(15deg); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  // 8. SUNSET GLOW / WARM (Atardecer Cálido / Default)
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
      <div 
        className="absolute -top-20 -left-20 w-[140%] h-[80%] bg-linear-to-br from-amber-300/25 via-orange-300/15 to-transparent rounded-full blur-3xl"
        style={{ animation: 'ambientGlow 8s infinite ease-in-out alternate' }}
      />
      <div 
        className="absolute -bottom-20 -right-20 w-[140%] h-[80%] bg-linear-to-tl from-amber-400/20 via-rose-300/15 to-transparent rounded-full blur-3xl"
        style={{ animation: 'ambientGlow 10s infinite ease-in-out alternate-reverse' }}
      />

      {[
        { left: '15%', size: 'w-3 h-3', delay: '0s', duration: '8s' },
        { left: '50%', size: 'w-4 h-4', delay: '3s', duration: '10s' },
        { left: '80%', size: 'w-2.5 h-2.5', delay: '1.5s', duration: '7s' },
      ].map((orb, idx) => (
        <div
          key={idx}
          className={`absolute rounded-full bg-amber-300/40 blur-[1px] shadow-xs ${orb.size}`}
          style={{
            left: orb.left,
            animation: `bokehFloat ${orb.duration} infinite ease-in-out ${orb.delay}`,
          }}
        />
      ))}

      <style>{`
        @keyframes ambientGlow {
          0% { transform: scale(1) translate(0, 0); opacity: 0.4; }
          100% { transform: scale(1.15) translate(3%, 3%); opacity: 0.7; }
        }
        @keyframes bokehFloat {
          0% { top: 110%; transform: scale(0.8); opacity: 0; }
          30% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { top: -15%; transform: scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};