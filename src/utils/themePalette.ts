import type { ThemePreset } from '../modules/editor/types';

export interface ThemePalette {
  bg: string;
  cardBg: string;
  text: string;
  accent: string;
  border: string;
  /** true cuando el fondo del tema es oscuro: quien consuma la paleta se adapta. */
  isDark: boolean;
}

const NAMED: Record<string, string> = {
  'bg-white': '#ffffff',
  'bg-black': '#000000',
  'text-white': '#ffffff',
  'text-black': '#000000',
};

/* ---------- Conversión de color ---------- */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export const hexToRgb = (hex: string): Rgb => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
};

export const rgbToHex = ({ r, g, b }: Rgb): string =>
  `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;

/** rgba() a partir de un hex, para tintes y sombras derivadas del tema. */
export const withAlpha = (hex: string, alpha: number): string => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/* ---------- Contraste (WCAG) ---------- */

const channelLuminance = (value: number): number => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export const relativeLuminance = (hex: string): number => {
  const { r, g, b } = hexToRgb(hex);
  return (
    0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b)
  );
};

/** Razón de contraste entre dos colores, de 1 a 21. */
export const contrastRatio = (a: string, b: string): number => {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

/**
 * Oscurece un color hasta alcanzar la razón de contraste pedida contra el
 * fondo, conservando su tono. Devuelve negro si ni así se llega.
 */
export const darkenUntilContrast = (hex: string, background: string, target: number): string => {
  if (contrastRatio(hex, background) >= target) return hex;

  const base = hexToRgb(hex);
  for (let step = 1; step <= 20; step++) {
    const factor = 1 - step / 20;
    const candidate = rgbToHex({ r: base.r * factor, g: base.g * factor, b: base.b * factor });
    if (contrastRatio(candidate, background) >= target) return candidate;
  }
  return '#000000';
};

/* ---------- Paleta del tema ---------- */

/**
 * THEME_PRESETS guarda clases de Tailwind porque el editor las aplica en vivo.
 * Quien necesite valores reales (el HTML exportado, el canvas del QR) los pide
 * aquí en lugar de volver a parsear las clases por su cuenta.
 */
const toHex = (twClass: string, fallback: string): string => {
  const arbitrary = twClass.match(/\[#([0-9a-fA-F]{3,8})\]/);
  if (arbitrary) return `#${arbitrary[1]}`;
  return NAMED[twClass] ?? fallback;
};

export const resolvePalette = (theme: ThemePreset): ThemePalette => {
  const bg = toHex(theme.bgClass, '#fef8fa');
  return {
    bg,
    cardBg: toHex(theme.cardBg, '#ffffff'),
    text: toHex(theme.textColor, '#1d1b1d'),
    accent: toHex(theme.accentColor, '#a20513'),
    border: toHex(theme.borderColor, '#e4beba'),
    isDark: relativeLuminance(bg) < 0.2,
  };
};
