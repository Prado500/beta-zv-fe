import { useState } from 'react';
import { ScarcityBar } from '../components/layout/ScarcityBar';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { HeartConfetti } from '../../../components/decor';
import { Hero } from '../components/sections/Hero';
import { Origin } from '../components/sections/Origin';
import { LivePreview } from '../components/sections/LivePreview';
import { SocialProof } from '../components/sections/SocialProof';
import { Features } from '../components/sections/Features';
import { Pricing } from '../components/sections/Pricing';
import { PurchaseModal } from '../components/checkout/PurchaseModal';

export default function LandingPage() {
  const [buying, setBuying] = useState(false);

  return (
    <div className="relative paper-sheet paper-vignette text-on-background font-body-md antialiased selection:bg-primary-container/30 selection:text-primary">
      {/* Corazones regados sobre toda la hoja, detrás del contenido */}
      <HeartConfetti count={18} tone="rose" opacity={0.09} fixed className="z-0" />

      {/* Ambas barras fijadas juntas en la parte superior */}
      <div className="sticky top-0 z-50">
        <ScarcityBar />
        <Header />
      </div>

      <main className="relative z-10">
        <Hero />
        <Origin />
        <LivePreview />
        <SocialProof />
        <Features />
        <Pricing onBuy={() => setBuying(true)} />
      </main>

      <Footer />

      <PurchaseModal open={buying} onClose={() => setBuying(false)} />
    </div>
  );
}
