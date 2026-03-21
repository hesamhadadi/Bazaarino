export const DEFAULT_BRAND_PRIMARY = '#f97316';
export const BRAND_COLOR_EVENT = 'bazaarino:brand-color-change';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hexToRgb(hex: string) {
  const safeHex = hex.replace('#', '');
  const r = parseInt(safeHex.slice(0, 2), 16);
  const g = parseInt(safeHex.slice(2, 4), 16);
  const b = parseInt(safeHex.slice(4, 6), 16);
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function rgbToHsl(r: number, g: number, b: number) {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;
  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) return { h: 0, s: 0, l };

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case nr:
      h = (ng - nb) / d + (ng < nb ? 6 : 0);
      break;
    case ng:
      h = (nb - nr) / d + 2;
      break;
    default:
      h = (nr - ng) / d + 4;
  }
  h /= 6;
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray };
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

function adjustLightness(hex: string, delta: number) {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  const adjusted = hslToRgb(hsl.h, hsl.s, clamp(hsl.l + delta, 0, 1));
  return rgbToHex(adjusted.r, adjusted.g, adjusted.b);
}

export function normalizeBrandPrimary(value: unknown) {
  const color = String(value || '').trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return DEFAULT_BRAND_PRIMARY;
  return color.toLowerCase();
}

export function buildBrandPalette(primary: string) {
  const base = normalizeBrandPrimary(primary);
  const brand600 = adjustLightness(base, -0.08);
  const brand700 = adjustLightness(base, -0.16);
  const brand800 = adjustLightness(base, -0.24);
  const brand900 = adjustLightness(base, -0.32);
  const brand400 = adjustLightness(base, 0.09);
  const brand300 = adjustLightness(base, 0.18);
  const brand200 = adjustLightness(base, 0.27);
  const brand100 = adjustLightness(base, 0.36);
  const brand50 = adjustLightness(base, 0.43);

  const toRgbVar = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    return `${r} ${g} ${b}`;
  };

  return {
    50: toRgbVar(brand50),
    100: toRgbVar(brand100),
    200: toRgbVar(brand200),
    300: toRgbVar(brand300),
    400: toRgbVar(brand400),
    500: toRgbVar(base),
    600: toRgbVar(brand600),
    700: toRgbVar(brand700),
    800: toRgbVar(brand800),
    900: toRgbVar(brand900),
    primary: base,
    dark: brand700,
  };
}

export function readBrandPrimaryFromDocument() {
  if (typeof document === 'undefined') return DEFAULT_BRAND_PRIMARY;
  return normalizeBrandPrimary(getComputedStyle(document.documentElement).getPropertyValue('--brand-primary'));
}

export function applyBrandPaletteToDocument(primary: string) {
  if (typeof document === 'undefined') return normalizeBrandPrimary(primary);
  const palette = buildBrandPalette(primary);
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', palette.primary);
  root.style.setProperty('--brand-dark', palette.dark);
  root.style.setProperty('--brand-50-rgb', palette[50]);
  root.style.setProperty('--brand-100-rgb', palette[100]);
  root.style.setProperty('--brand-200-rgb', palette[200]);
  root.style.setProperty('--brand-300-rgb', palette[300]);
  root.style.setProperty('--brand-400-rgb', palette[400]);
  root.style.setProperty('--brand-500-rgb', palette[500]);
  root.style.setProperty('--brand-600-rgb', palette[600]);
  root.style.setProperty('--brand-700-rgb', palette[700]);
  root.style.setProperty('--brand-800-rgb', palette[800]);
  root.style.setProperty('--brand-900-rgb', palette[900]);
  window.dispatchEvent(new CustomEvent(BRAND_COLOR_EVENT, { detail: { brandPrimary: palette.primary } }));
  return palette.primary;
}
