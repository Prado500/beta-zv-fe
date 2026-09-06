export interface DedicationForm {
  recipient: string;
  title: string;
  message: string;
  sender: string;
  songUrl: string;
  themeId: string;
  photos: string[];
}

export interface ThemePreset {
  id: string;
  name: string;
  bgClass: string;
  cardBg: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  animationType: 'hearts' | 'petals' | 'stars' | 'sunsetGlow' | 'sparkles' | 'leaves' | 'butterflies' | 'fireflies';
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
  classic: {
    id: 'classic',
    name: 'Romántico Clásico',
    bgClass: 'bg-[#fef8fa]',
    cardBg: 'bg-white',
    textColor: 'text-[#1d1b1d]',
    accentColor: 'text-[#a20513]',
    borderColor: 'border-[#e4beba]',
    animationType: 'hearts',
  },
  pastelPink: {
    id: 'pastelPink',
    name: 'Rosado Pastel',
    bgClass: 'bg-[#fff5f7]',
    cardBg: 'bg-[#ffe4e6]',
    textColor: 'text-[#881337]',
    accentColor: 'text-[#e11d48]',
    borderColor: 'border-[#fecdd3]',
    animationType: 'petals',
  },
  starry: {
    id: 'starry',
    name: 'Noche Estrellada',
    bgClass: 'bg-[#0f172a]',
    cardBg: 'bg-[#1e293b]',
    textColor: 'text-[#f8fafc]',
    accentColor: 'text-[#fbbf24]',
    borderColor: 'border-[#334155]',
    animationType: 'stars',
  },
  sunset: {
    id: 'sunset',
    name: 'Atardecer Cálido',
    bgClass: 'bg-[#fff7ed]',
    cardBg: 'bg-[#ffedd5]',
    textColor: 'text-[#431407]',
    accentColor: 'text-[#ea580c]',
    borderColor: 'border-[#fed7aa]',
    animationType: 'sunsetGlow',
  },
  // --- 4 NUEVOS TEMAS ---
  lavender: {
    id: 'lavender',
    name: 'Sueño de Lavanda',
    bgClass: 'bg-[#f5f3ff]',
    cardBg: 'bg-[#ede9fe]',
    textColor: 'text-[#4c1d95]',
    accentColor: 'text-[#7c3aed]',
    borderColor: 'border-[#ddd6fe]',
    animationType: 'sparkles',
  },
  emerald: {
    id: 'emerald',
    name: 'Jardín Esmeralda',
    bgClass: 'bg-[#f0fdf4]',
    cardBg: 'bg-[#dcfce7]',
    textColor: 'text-[#14532d]',
    accentColor: 'text-[#16a34a]',
    borderColor: 'border-[#bbf7d0]',
    animationType: 'leaves',
  },
  midnight: {
    id: 'midnight',
    name: 'Medianoche Azul',
    bgClass: 'bg-[#090d16]',
    cardBg: 'bg-[#111827]',
    textColor: 'text-[#f3f4f6]',
    accentColor: 'text-[#38bdf8]',
    borderColor: 'border-[#1f2937]',
    animationType: 'fireflies',
  },
  vintage: {
    id: 'vintage',
    name: 'Carta Vintage',
    bgClass: 'bg-[#faf5ef]',
    cardBg: 'bg-[#f5ebe0]',
    textColor: 'text-[#4a3b32]',
    accentColor: 'text-[#b45309]',
    borderColor: 'border-[#e6d5c3]',
    animationType: 'butterflies',
  },
};