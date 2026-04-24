import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Mode = 'light' | 'dark';
const KEY = 'th.themeMode';

const LIGHT = {
  navy: '#1B2A4A', navyDark: '#0F1A30', red: '#C8102E', white: '#FFFFFF',
  bg: '#F6F7FB', cardBg: '#FFFFFF',
  textPrimary: '#111827', textSecondary: '#6B7280', textMuted: '#9CA3AF',
  border: '#E5E7EB', borderLight: '#F1F3F6',
  gold: '#D4AF37', cream: '#FDFBF7', silver: '#9CA3AF', bronze: '#B98455', platinum: '#6B7A99',
  npsRed: '#E53935', npsYellow: '#F5A623', npsGreen: '#2E8B57',
  success: '#059669', warning: '#D97706',
  chart: ['#1B2A4A', '#C8102E', '#D4AF37', '#6B7280', '#2E8B57', '#F5A623'],
};

const DARK = {
  navy: '#F5F7FB', navyDark: '#FFFFFF', red: '#F87171', white: '#0B1220',
  bg: '#0B1220', cardBg: '#1A2236',
  textPrimary: '#F8FAFC', textSecondary: '#D1D5DB', textMuted: '#9CA3AF',
  border: '#2A3348', borderLight: '#222B3E',
  gold: '#F5C94D', cream: '#1E2739', silver: '#C0C8DA', bronze: '#E8A979', platinum: '#B6C1DA',
  npsRed: '#F87171', npsYellow: '#FBBF24', npsGreen: '#34D399',
  success: '#34D399', warning: '#F59E0B',
  chart: ['#F5F7FB', '#F87171', '#F5C94D', '#D1D5DB', '#34D399', '#FBBF24'],
};

type Ctx = { mode: Mode; colors: typeof LIGHT; toggle: () => void };
const ThemeCtx = createContext<Ctx>({ mode: 'light', colors: LIGHT, toggle: () => {} });

// React Native Web emits atomic utility CSS classes like `.r-backgroundColor-<hash>{...}`
// where the hash is deterministic per property+value. We scan the generated stylesheet and
// build targeted overrides so we flip every hardcoded light color to its dark equivalent,
// regardless of whether a screen uses StyleSheet.create (class-based) or inline style props.

// Mappings: rgba(r,g,b,a) string -> dark replacement. Cover common forms.
type ColorMap = Record<string, string>;

const BG_MAP: ColorMap = {
  'rgba(255,255,255,1.00)': DARK.cardBg,     // colors.white / cardBg
  'rgb(255,255,255)': DARK.cardBg,
  '#ffffff': DARK.cardBg,
  '#fff': DARK.cardBg,
  'rgba(246,247,251,1.00)': DARK.bg,         // colors.bg
  'rgb(246,247,251)': DARK.bg,
  '#f6f7fb': DARK.bg,
  'rgba(241,243,246,1.00)': DARK.borderLight, // borderLight
  'rgb(241,243,246)': DARK.borderLight,
  '#f1f3f6': DARK.borderLight,
  'rgba(249,250,251,1.00)': DARK.borderLight, // #F9FAFB
  'rgb(249,250,251)': DARK.borderLight,
  '#f9fafb': DARK.borderLight,
  'rgba(245,247,252,1.00)': DARK.borderLight, // #F5F7FC (radio active bg)
  'rgb(245,247,252)': DARK.borderLight,
  '#f5f7fc': DARK.borderLight,
  'rgba(253,251,247,1.00)': DARK.cardBg,      // cream #FDFBF7
  'rgb(253,251,247)': DARK.cardBg,
  '#fdfbf7': DARK.cardBg,
  'rgba(232,238,248,1.00)': DARK.borderLight, // Performance scorecard highlights
  'rgba(255,249,230,1.00)': DARK.borderLight,
  'rgba(232,245,233,1.00)': DARK.borderLight,
  'rgba(254,226,226,1.00)': DARK.borderLight, // pale red bg
  'rgba(243,244,246,1.00)': DARK.borderLight, // #F3F4F6
};

const TEXT_MAP: ColorMap = {
  'rgba(17,24,39,1.00)': DARK.textPrimary,   // #111827
  'rgb(17,24,39)': DARK.textPrimary,
  '#111827': DARK.textPrimary,
  'rgba(107,114,128,1.00)': DARK.textSecondary, // #6B7280
  'rgb(107,114,128)': DARK.textSecondary,
  '#6b7280': DARK.textSecondary,
  'rgba(27,42,74,1.00)': DARK.navy,          // #1B2A4A
  'rgb(27,42,74)': DARK.navy,
  '#1b2a4a': DARK.navy,
  'rgba(15,26,48,1.00)': DARK.navy,          // #0F1A30
  'rgb(15,26,48)': DARK.navy,
  '#0f1a30': DARK.navy,
  'rgba(170,181,206,1.00)': DARK.textSecondary, // #AAB5CE hero subtitle
  'rgb(170,181,206)': DARK.textSecondary,
  '#aab5ce': DARK.textSecondary,
  'rgba(156,163,175,1.00)': DARK.textMuted,
  'rgb(156,163,175)': DARK.textMuted,
  '#9ca3af': DARK.textMuted,
};

const BORDER_MAP: ColorMap = {
  'rgba(229,231,235,1.00)': DARK.border,     // #E5E7EB
  'rgb(229,231,235)': DARK.border,
  '#e5e7eb': DARK.border,
  'rgba(241,243,246,1.00)': DARK.border,
  'rgb(241,243,246)': DARK.border,
  '#f1f3f6': DARK.border,
};

const STYLE_ID = 'th-dark-style';

/** Normalise a CSS color value to a compact form for map lookup. */
function normColor(v: string): string {
  return v.trim().toLowerCase().replace(/\s+/g, '');
}

/**
 * Parse the react-native-stylesheet <style> tag, find all class rules setting
 * background-color / color / border*-color / etc., and emit matching overrides
 * for dark mode using the class selector with !important.
 */
function buildClassOverrides(): string {
  const sheet = document.getElementById('react-native-stylesheet');
  if (!sheet) return '';
  const css = sheet.textContent || '';
  const rules: string[] = [];

  // Match rules like `.r-someProp-hash{prop:value;}`
  const re = /\.([a-zA-Z0-9_-]+)\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    const cls = m[1];
    const body = m[2];
    // background-color
    const bg = /background-color:([^;]+);?/i.exec(body);
    if (bg) {
      const v = normColor(bg[1]);
      if (BG_MAP[v]) rules.push(`.${cls}{background-color:${BG_MAP[v]} !important;}`);
    }
    // color (text)
    const col = /(?:^|[^-])color:([^;]+);?/i.exec(body);
    if (col) {
      const v = normColor(col[1]);
      if (TEXT_MAP[v]) rules.push(`.${cls}{color:${TEXT_MAP[v]} !important;}`);
    }
    // border (any side) color
    const bd = /border(?:-(?:top|right|bottom|left))?-color:([^;]+);?/i.exec(body);
    if (bd) {
      const v = normColor(bd[1]);
      if (BORDER_MAP[v]) rules.push(`.${cls}{border-color:${BORDER_MAP[v]} !important;}`);
    }
  }
  return rules.join('\n');
}

function buildDarkCss(): string {
  const overrides = buildClassOverrides();
  return `
html, body, #root, #__next { background-color: ${DARK.bg} !important; color: ${DARK.textPrimary} !important; }
body { color-scheme: dark; }

/* Inline-style fallbacks (dynamic styles) */
[style*="background-color: rgb(255, 255, 255)"],
[style*="background-color:rgb(255,255,255)"],
[style*="background-color:#FFFFFF"],
[style*="background-color: #FFFFFF"],
[style*="background-color:#fff"],
[style*="background-color: #fff"] { background-color: ${DARK.cardBg} !important; }

[style*="background-color: rgb(246, 247, 251)"],
[style*="background-color:rgb(246,247,251)"] { background-color: ${DARK.bg} !important; }

[style*="background-color: rgb(241, 243, 246)"],
[style*="background-color: rgb(249, 250, 251)"],
[style*="background-color: rgb(245, 247, 252)"] { background-color: ${DARK.borderLight} !important; }

[style*="color: rgb(17, 24, 39)"] { color: ${DARK.textPrimary} !important; }
[style*="color: rgb(107, 114, 128)"] { color: ${DARK.textSecondary} !important; }
[style*="color: rgb(156, 163, 175)"] { color: ${DARK.textMuted} !important; }
[style*="color: rgb(27, 42, 74)"]  { color: ${DARK.navy} !important; }
[style*="color: rgb(15, 26, 48)"]  { color: ${DARK.navy} !important; }
[style*="color: rgb(170, 181, 206)"] { color: ${DARK.textSecondary} !important; }

[style*="border-color: rgb(229, 231, 235)"],
[style*="border-color: rgb(241, 243, 246)"] { border-color: ${DARK.border} !important; }
[style*="border-top-color: rgb(229, 231, 235)"] { border-top-color: ${DARK.border} !important; }
[style*="border-bottom-color: rgb(229, 231, 235)"] { border-bottom-color: ${DARK.border} !important; }

input, textarea, select { color: ${DARK.textPrimary} !important; background-color: ${DARK.cardBg} !important; }
input::placeholder, textarea::placeholder { color: ${DARK.textMuted} !important; }

/* Class-name based overrides (RN Web StyleSheet.create atomic classes) */
${overrides}
`;
}

function applyWebTheme(mode: Mode) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.innerHTML = mode === 'dark' ? buildDarkCss() : '';
  document.documentElement.setAttribute('data-theme', mode);
  document.body.style.backgroundColor = mode === 'dark' ? DARK.bg : LIGHT.bg;

  // (Re)create a MutationObserver that watches RN Web's dynamic stylesheet so that
  // classes added after route navigation also get their dark overrides.
  const w = window as any;
  if (w.__thDarkObs) { w.__thDarkObs.disconnect(); w.__thDarkObs = null; }
  if (mode === 'dark') {
    const sheet = document.getElementById('react-native-stylesheet');
    if (sheet) {
      let scheduled = false;
      const rebuild = () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          if (el) el.innerHTML = buildDarkCss();
        });
      };
      const obs = new MutationObserver(rebuild);
      obs.observe(sheet, { childList: true, characterData: true, subtree: true });
      w.__thDarkObs = obs;
    }
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<Mode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v === 'dark' || v === 'light') setMode(v);
      setReady(true);
    });
  }, []);

  useEffect(() => { applyWebTheme(mode); }, [mode]);

  const toggle = () => {
    const next: Mode = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    AsyncStorage.setItem(KEY, next);
  };

  const colors = mode === 'dark' ? DARK : LIGHT;
  // Avoid a light-mode flash on web while reading AsyncStorage
  if (!ready && Platform.OS === 'web') return <>{children}</>;
  return <ThemeCtx.Provider value={{ mode, colors, toggle }}>{children}</ThemeCtx.Provider>;
};

export const useTheme = () => useContext(ThemeCtx);
