/**
 * Theme presets and accent colors
 */

export const THEME_PRESETS: Record<string, { bg: string; meta: string; isDark: boolean }> = {
  light: { bg: '#ffffff', meta: '#ffffff', isDark: false },
  dark: { bg: '#0f172a', meta: '#0f172a', isDark: true },
  blue: { bg: '#1e3a5f', meta: '#1e3a5f', isDark: true },
  green: { bg: '#14532d', meta: '#14532d', isDark: true },
  purple: { bg: '#4c1d95', meta: '#4c1d95', isDark: true },
  orange: { bg: '#7c2d12', meta: '#7c2d12', isDark: true },
  rose: { bg: '#4c0519', meta: '#4c0519', isDark: true },
};

export const ACCENT_COLOR_HEX: Record<string, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#8b5cf6',
  orange: '#f97316',
  pink: '#ec4899',
  cyan: '#06b6d4',
  red: '#ef4444',
  yellow: '#eab308',
};

export const hexToRgba = (hex: string, alpha: number): string => {
  const clean = (hex || '').replace('#', '').trim();
  if (clean.length !== 6) return `rgba(59,130,246,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};
