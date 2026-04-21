// Theme Strategy
// Each colour palette is a strategy with light + dark variants.
// Themes are applied at runtime by setting CSS custom properties.

import { Theme } from '@/types';

// Base themes — each has light mode colors and dark.
const baseThemes: Record<string, { name: string; emoji: string; light: Theme['colors']; dark: Theme['colors'] }> = {
  'lavender-dream': {
    name: 'Lavender Dream',
    emoji: '🫐',
    light: {
      primary: '#B696BD', primaryHover: '#A886B0',
      secondary: '#E6D7EB', accent: '#F0E8F4',
      background: '#FAF6FA', surface: 'rgba(247,243,249,0.85)',
      surfaceHover: 'rgba(235,225,240,0.6)', text: '#4A3B56',
      textMuted: '#867694', textOnPrimary: '#FFFFFF',
      border: 'rgba(182,150,189,0.25)', shadow: 'rgba(182,150,189,0.1)',
      glassBg: 'rgba(250,246,250,0.7)', glassborder: 'rgba(182,150,189,0.15)',
    },
    dark: {
      primary: '#B88BC0', primaryHover: '#D0A8D8',
      secondary: '#3A2A42', accent: '#4A3656',
      background: '#1A1620', surface: 'rgba(46,38,56,0.8)',
      surfaceHover: 'rgba(60,48,72,0.8)', text: '#EBE5EF',
      textMuted: '#B2A5BD', textOnPrimary: '#FFFFFF',
      border: 'rgba(184,139,192,0.2)', shadow: 'rgba(0,0,0,0.4)',
      glassBg: 'rgba(26,22,32,0.75)', glassborder: 'rgba(184,139,192,0.1)',
    },
  },
  'rose-garden': {
    name: 'Rose Garden',
    emoji: '🌸',
    light: {
      primary: '#D694B0', primaryHover: '#C6809E',
      secondary: '#F2DCE5', accent: '#F7EBF0',
      background: '#FCF7F9', surface: 'rgba(250,245,247,0.85)',
      surfaceHover: 'rgba(242,220,229,0.6)', text: '#59404B',
      textMuted: '#947D87', textOnPrimary: '#FFFFFF',
      border: 'rgba(214,148,176,0.25)', shadow: 'rgba(214,148,176,0.1)',
      glassBg: 'rgba(252,247,249,0.7)', glassborder: 'rgba(214,148,176,0.15)',
    },
    dark: {
      primary: '#D88AAF', primaryHover: '#E8A0BF',
      secondary: '#42242E', accent: '#562E3E',
      background: '#1F181B', surface: 'rgba(56,40,48,0.8)',
      surfaceHover: 'rgba(74,52,62,0.8)', text: '#EFE5E9',
      textMuted: '#BAA3AC', textOnPrimary: '#FFFFFF',
      border: 'rgba(216,138,175,0.2)', shadow: 'rgba(0,0,0,0.4)',
      glassBg: 'rgba(31,24,27,0.75)', glassborder: 'rgba(216,138,175,0.1)',
    },
  },
  'ocean-breeze': {
    name: 'Ocean Breeze',
    emoji: '🪼',
    light: {
      primary: '#8EB2D2', primaryHover: '#7CA0C0',
      secondary: '#D6E4F0', accent: '#E8F0F7',
      background: '#F5F8FA', surface: 'rgba(240,246,249,0.85)',
      surfaceHover: 'rgba(214,228,240,0.6)', text: '#3E4D5E',
      textMuted: '#788899', textOnPrimary: '#FFFFFF',
      border: 'rgba(142,178,210,0.25)', shadow: 'rgba(142,178,210,0.1)',
      glassBg: 'rgba(245,248,250,0.7)', glassborder: 'rgba(142,178,210,0.15)',
    },
    dark: {
      primary: '#8AB4D8', primaryHover: '#A0C4E8',
      secondary: '#1E2E3E', accent: '#283A4E',
      background: '#161A20', surface: 'rgba(34,44,56,0.8)',
      surfaceHover: 'rgba(46,58,74,0.8)', text: '#E3EAF2',
      textMuted: '#9BAABF', textOnPrimary: '#FFFFFF',
      border: 'rgba(138,180,216,0.2)', shadow: 'rgba(0,0,0,0.4)',
      glassBg: 'rgba(22,26,32,0.75)', glassborder: 'rgba(138,180,216,0.1)',
    },
  },
  'sage-meadow': {
    name: 'Sage Meadow',
    emoji: '🌿',
    light: {
      primary: '#92BEA4', primaryHover: '#7EAB90',
      secondary: '#D5EBE0', accent: '#EAF5EF',
      background: '#F7FCF9', surface: 'rgba(244,250,247,0.85)',
      surfaceHover: 'rgba(213,235,224,0.6)', text: '#3F544A',
      textMuted: '#758F83', textOnPrimary: '#FFFFFF',
      border: 'rgba(146,190,164,0.25)', shadow: 'rgba(146,190,164,0.1)',
      glassBg: 'rgba(247,252,249,0.7)', glassborder: 'rgba(146,190,164,0.15)',
    },
    dark: {
      primary: '#92C5A4', primaryHover: '#A8D5BA',
      secondary: '#1E3228', accent: '#283E32',
      background: '#171D1A', surface: 'rgba(34,48,42,0.8)',
      surfaceHover: 'rgba(48,64,56,0.8)', text: '#E5EDE9',
      textMuted: '#9FB2A9', textOnPrimary: '#FFFFFF',
      border: 'rgba(146,197,164,0.2)', shadow: 'rgba(0,0,0,0.4)',
      glassBg: 'rgba(23,29,26,0.75)', glassborder: 'rgba(146,197,164,0.1)',
    },
  },
  'honey-glow': {
    name: 'Honey Glow',
    emoji: '🍋',
    light: {
      primary: '#D1B460', primaryHover: '#C2A34C',
      secondary: '#F2E8C9', accent: '#F9F4E6',
      background: '#FCFBF7', surface: 'rgba(250,248,242,0.85)',
      surfaceHover: 'rgba(242,232,201,0.6)', text: '#54492E',
      textMuted: '#8F8260', textOnPrimary: '#FFFFFF',
      border: 'rgba(209,180,96,0.25)', shadow: 'rgba(209,180,96,0.1)',
      glassBg: 'rgba(252,251,247,0.7)', glassborder: 'rgba(209,180,96,0.15)',
    },
    dark: {
      primary: '#D4B444', primaryHover: '#E8C85A',
      secondary: '#322C14', accent: '#423A1E',
      background: '#1F1D17', surface: 'rgba(54,50,38,0.8)',
      surfaceHover: 'rgba(72,66,50,0.8)', text: '#EFECDE',
      textMuted: '#BAAD85', textOnPrimary: '#FFFFFF',
      border: 'rgba(212,180,68,0.2)', shadow: 'rgba(0,0,0,0.4)',
      glassBg: 'rgba(31,29,23,0.75)', glassborder: 'rgba(212,180,68,0.1)',
    },
  },
  'sunset-ember': {
    name: 'Sunset Ember',
    emoji: '🍂',
    light: {
      primary: '#D68266', primaryHover: '#C46D50',
      secondary: '#F5DACF', accent: '#FAEBE6',
      background: '#FDFAF9', surface: 'rgba(252,246,244,0.85)',
      surfaceHover: 'rgba(245,218,207,0.6)', text: '#593D32',
      textMuted: '#967466', textOnPrimary: '#FFFFFF',
      border: 'rgba(214,130,102,0.25)', shadow: 'rgba(214,130,102,0.1)',
      glassBg: 'rgba(253,250,249,0.7)', glassborder: 'rgba(214,130,102,0.15)',
    },
    dark: {
      primary: '#D46840', primaryHover: '#E87850',
      secondary: '#3A1E14', accent: '#4E281C',
      background: '#211815', surface: 'rgba(58,40,34,0.8)',
      surfaceHover: 'rgba(78,54,46,0.8)', text: '#F2E8E4',
      textMuted: '#C2A79E', textOnPrimary: '#FFFFFF',
      border: 'rgba(212,104,64,0.2)', shadow: 'rgba(0,0,0,0.4)',
      glassBg: 'rgba(33,24,21,0.75)', glassborder: 'rgba(212,104,64,0.1)',
    },
  },
  'cherry-blossom': {
    name: 'Cherry Blossom',
    emoji: '🍒',
    light: {
      primary: '#BE5E6A', primaryHover: '#AA4C58',
      secondary: '#EAC8CC', accent: '#F4E3E5',
      background: '#FCF8F9', surface: 'rgba(250,244,245,0.85)',
      surfaceHover: 'rgba(234,200,204,0.6)', text: '#54363A',
      textMuted: '#8F656A', textOnPrimary: '#FFFFFF',
      border: 'rgba(190,94,106,0.25)', shadow: 'rgba(190,94,106,0.1)',
      glassBg: 'rgba(252,248,249,0.7)', glassborder: 'rgba(190,94,106,0.15)',
    },
    dark: {
      primary: '#C03040', primaryHover: '#D04050',
      secondary: '#3A1418', accent: '#4E1C22',
      background: '#1F1415', surface: 'rgba(56,34,38,0.8)',
      surfaceHover: 'rgba(74,46,52,0.8)', text: '#EBE1E2',
      textMuted: '#B8989C', textOnPrimary: '#FFFFFF',
      border: 'rgba(192,48,64,0.2)', shadow: 'rgba(0,0,0,0.4)',
      glassBg: 'rgba(31,20,21,0.75)', glassborder: 'rgba(192,48,64,0.1)',
    },
  },
  'mocha-cream': {
    name: 'Mocha Cream',
    emoji: '☕',
    light: {
      primary: '#9E856F', primaryHover: '#8A735E',
      secondary: '#E0D4CA', accent: '#F0EBE6',
      background: '#FAFAF8', surface: 'rgba(247,245,242,0.85)',
      surfaceHover: 'rgba(224,212,202,0.6)', text: '#4D433A',
      textMuted: '#85786C', textOnPrimary: '#FFFFFF',
      border: 'rgba(158,133,111,0.25)', shadow: 'rgba(158,133,111,0.1)',
      glassBg: 'rgba(250,250,248,0.7)', glassborder: 'rgba(158,133,111,0.15)',
    },
    dark: {
      primary: '#907050', primaryHover: '#A08060',
      secondary: '#2E241A', accent: '#3E3024',
      background: '#1C1917', surface: 'rgba(48,42,38,0.8)',
      surfaceHover: 'rgba(64,54,48,0.8)', text: '#EBE9E6',
      textMuted: '#B2ABA5', textOnPrimary: '#FFFFFF',
      border: 'rgba(144,112,80,0.2)', shadow: 'rgba(0,0,0,0.4)',
      glassBg: 'rgba(28,25,23,0.75)', glassborder: 'rgba(144,112,80,0.1)',
    },
  },
};

// Build themes map
export const themes: Record<string, Theme> = {};
for (const [key, base] of Object.entries(baseThemes)) {
  themes[key] = {
    name: base.name,
    emoji: base.emoji,
    colors: base.light,
    isDark: false,
  };
}

export function getThemeColors(themeKey: string, isDark: boolean): Theme['colors'] {
  const base = baseThemes[themeKey];
  if (!base) return baseThemes['lavender-dream'].light;
  return isDark ? base.dark : base.light;
}

// Applies the selected theme strategy to the document root.
export function applyTheme(themeKey: string, isDark?: boolean): void {
  const base = baseThemes[themeKey];
  if (!base) return;

  const dark = isDark ?? getDarkMode();
  const c = dark ? base.dark : base.light;
  const root = document.documentElement;

  root.style.setProperty('--color-primary', c.primary);
  root.style.setProperty('--color-primary-hover', c.primaryHover);
  root.style.setProperty('--color-secondary', c.secondary);
  root.style.setProperty('--color-accent', c.accent);
  root.style.setProperty('--color-background', c.background);
  root.style.setProperty('--color-surface', c.surface);
  root.style.setProperty('--color-surface-hover', c.surfaceHover);
  root.style.setProperty('--color-text', c.text);
  root.style.setProperty('--color-text-muted', c.textMuted);
  root.style.setProperty('--color-text-on-primary', c.textOnPrimary);
  root.style.setProperty('--color-border', c.border);
  root.style.setProperty('--color-shadow', c.shadow);
  root.style.setProperty('--color-glass-bg', c.glassBg);
  root.style.setProperty('--color-glass-border', c.glassborder);

  localStorage.setItem('focus-rooms-theme', themeKey);
  localStorage.setItem('focus-rooms-dark', String(dark));
}

export function getStoredTheme(): string {
  if (typeof globalThis === 'undefined' || typeof globalThis.localStorage === 'undefined') return 'lavender-dream';
  return globalThis.localStorage.getItem('focus-rooms-theme') || 'lavender-dream';
}

export function getDarkMode(): boolean {
  if (typeof globalThis === 'undefined' || typeof globalThis.localStorage === 'undefined') return false;
  return globalThis.localStorage.getItem('focus-rooms-dark') === 'true';
}

export function toggleDarkMode(): boolean {
  const newDark = !getDarkMode();
  const theme = getStoredTheme();
  applyTheme(theme, newDark);
  return newDark;
}

export const themeKeys = Object.keys(baseThemes);
