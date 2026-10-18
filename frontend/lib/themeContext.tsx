import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Mode = 'light' | 'dark';
const KEY = 'th.themeMode';

const LIGHT = {
  navy: '#111111', navyDark: '#111111', red: '#111111', white: '#FFFFFF',
  bg: '#FFFFFF', cardBg: '#FFFFFF',
  textPrimary: '#111111', textSecondary: '#707072', textMuted: '#9E9EA0',
  border: '#E5E5E5', borderLight: '#F5F5F5',
  gold: '#3A3A3C', cream: '#FFFFFF', silver: '#9E9EA0', bronze: '#707072', platinum: '#111111',
  npsRed: '#E53935', npsYellow: '#F5A623', npsGreen: '#2E8B57',
  success: '#2E8B57', warning: '#D97706',
  chart: ['#111111', '#707072', '#9E9EA0', '#3A3A3C', '#C7C7C9', '#5A5A5C'],
};

const DARK = {
  navy: '#F5F5F5', navyDark: '#FFFFFF', red: '#F5F5F5', white: '#111111',
  bg: '#000000', cardBg: '#FFD700',
  textPrimary: '#FFFFFF', textSecondary: '#B4B4B6', textMuted: '#9E9EA0',
  border: '#2C2C2E', borderLight: '#1C1C1E',
  gold: '#D4D4D6', cream: '#1C1C1E', silver: '#B4B4B6', bronze: '#9E9EA0', platinum: '#FFFFFF',
  npsRed: '#F87171', npsYellow: '#FBBF24', npsGreen: '#34D399',
  success: '#34D399', warning: '#F59E0B',
  chart: ['#F5F5F5', '#9E9EA0', '#707072', '#D4D4D6', '#3A3A3C', '#5A5A5C'],
};

// In dark mode every filled surface (cards, obsidian fills) turns gold; content on gold uses dark ink.
const DARK_FILL = '#FFD700';
const ON_GOLD = '#0A0A0A';
const ON_GOLD_MUTED = '#4A4000';
// Light ink colours (dark palette) that must flip back to dark when sitting on gold
const LIGHT_INK: [number, number, number, string][] = [
  [255, 255, 255, '#0A0A0A'], [245, 245, 245, '#0A0A0A'], [212, 212, 214, '#0A0A0A'],
  [180, 180, 182, '#4A4000'], [158, 158, 160, '#4A4000'], [58, 58, 60, '#0A0A0A'], [17, 17, 17, '#0A0A0A'],
];
const GOLD_INLINE = ['[style*="background-color: rgb(255, 215, 0)"]', '[style*="background-color: rgb(17, 17, 17)"]'];

type Ctx = { mode: Mode; colors: typeof LIGHT; toggle: () => void };
const ThemeCtx = createContext<Ctx>({ mode: 'light', colors: LIGHT, toggle: () => {} });

// React Native Web emits atomic utility CSS classes like `.r-backgroundColor-<hash>{...}`
// where the hash is deterministic per property+value. We scan the generated stylesheet and
// build targeted overrides so we flip every hardcoded light color to its dark equivalent,
// regardless of whether a screen uses StyleSheet.create (class-based) or inline style props.

// Mappings: rgba(r,g,b,a) string -> dark replacement. Cover common forms.
type ColorMap = Record<string, string>;

/** Build every textual form RN Web may emit for an rgb triple. */
const forms = (r: number, g: number, b: number, hex: string) =>
  [`rgba(${r},${g},${b},1.00)`, `rgba(${r},${g},${b},1)`, `rgb(${r},${g},${b})`, hex.toLowerCase()];
const mapOf = (pairs: [string[], string][]): ColorMap => {
  const out: ColorMap = {};
  for (const [keys, v] of pairs) for (const k of keys) out[k] = v;
  return out;
};

const BG_MAP: ColorMap = mapOf([
  [[...forms(255, 255, 255, '#ffffff'), '#fff'], DARK.bg],   // paper white page / cards
  [forms(245, 245, 245, '#f5f5f5'), DARK.borderLight],          // soft mist
  [forms(229, 229, 229, '#e5e5e5'), DARK.border],               // concrete gray (tracks)
  [forms(17, 17, 17, '#111111'), DARK_FILL],                    // obsidian fills
  [forms(58, 58, 60, '#3a3a3c'), '#48484A'],
]);

const TEXT_MAP: ColorMap = mapOf([
  [forms(17, 17, 17, '#111111'), DARK.textPrimary],
  [forms(58, 58, 60, '#3a3a3c'), DARK.gold],
  [forms(112, 112, 114, '#707072'), DARK.textSecondary],
]);

const BORDER_MAP: ColorMap = mapOf([
  [forms(229, 229, 229, '#e5e5e5'), DARK.border],
  [forms(245, 245, 245, '#f5f5f5'), DARK.border],
  [forms(17, 17, 17, '#111111'), '#F5F5F5'],
]);

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
  const goldSel: string[] = [...GOLD_INLINE];
  const textCls: [string, string][] = [];   // [class, ink to use on gold]
  const inkMap: ColorMap = {};
  for (const [r, g, b, ink] of LIGHT_INK) for (const k of [`rgba(${r},${g},${b},1.00)`, `rgba(${r},${g},${b},1)`, `rgb(${r},${g},${b})`]) inkMap[k] = ink;
  const surfaceCls: string[] = [];          // white / mist classes that sit on top of gold

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
      if (v.startsWith('rgba(255,215,0') || v === '#ffd700' || BG_MAP[v] === DARK_FILL) goldSel.push(`.${cls}`);
      if (BG_MAP[v] === DARK.bg || BG_MAP[v] === DARK.borderLight) surfaceCls.push(cls);
    }
    // color (text)
    const col = /(?:^|[^-])color:([^;]+);?/i.exec(body);
    if (col) {
      const v = normColor(col[1]);
      if (TEXT_MAP[v]) { rules.push(`.${cls}{color:${TEXT_MAP[v]} !important;}`); textCls.push([cls, TEXT_MAP[v] === DARK.textSecondary ? ON_GOLD_MUTED : ON_GOLD]); }
      else if (inkMap[v]) textCls.push([cls, inkMap[v]]);
    }
    // border (any side) color
    const bd = /border(?:-(?:top|right|bottom|left))?-color:([^;]+);?/i.exec(body);
    if (bd) {
      const v = normColor(bd[1]);
      if (BORDER_MAP[v]) rules.push(`.${cls}{border-color:${BORDER_MAP[v]} !important;}`);
    }
  }
  // Content placed on gold surfaces keeps dark ink + translucent inner surfaces
  for (const g of goldSel) {
    for (const [cls, ink] of textCls) rules.push(`${g} .${cls}{color:${ink} !important;}`);
    for (const cls of surfaceCls) rules.push(`${g} .${cls}{background-color:rgba(0,0,0,0.08) !important;}`);
  }
  return rules.join('\n');
}

/** Inline-style versions of the "content on gold" rules. */
function goldInlineCss(): string {
  return GOLD_INLINE.map(g => `
${g} [style*="color: rgb(17, 17, 17)"], ${g}[style*="color: rgb(17, 17, 17)"] { color: ${ON_GOLD} !important; }
${g} [style*="color: rgb(112, 112, 114)"] { color: ${ON_GOLD_MUTED} !important; }
${LIGHT_INK.map(([r, gg, b, ink]) => `${g} [style*="color: rgb(${r}, ${gg}, ${b})"]:not([style*="background-color: rgb(${r}, ${gg}, ${b})"]) { color: ${ink} !important; }`).join('\n')}
${g} [style*="background-color: rgb(255, 255, 255)"], ${g} [style*="background-color: rgb(245, 245, 245)"] { background-color: rgba(0,0,0,0.08) !important; }
${g} input, ${g} textarea { color: ${ON_GOLD} !important; background-color: rgba(255,255,255,0.35) !important; }
${g} input::placeholder, ${g} textarea::placeholder { color: ${ON_GOLD_MUTED} !important; }`).join('\n');
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
[style*="background-color: #fff"] { background-color: ${DARK.bg} !important; }

[style*="background-color: rgb(245, 245, 245)"] { background-color: ${DARK.borderLight} !important; }
[style*="background-color: rgb(229, 229, 229)"] { background-color: ${DARK.border} !important; }
[style*="background-color: rgb(17, 17, 17)"] { background-color: ${DARK_FILL} !important; }

[style*="color: rgb(17, 17, 17)"]:not([style*="background-color: rgb(17, 17, 17)"]) { color: ${DARK.textPrimary} !important; }
[style*="color: rgb(112, 112, 114)"] { color: ${DARK.textSecondary} !important; }
[style*="color: rgb(58, 58, 60)"] { color: ${DARK.gold} !important; }

[style*="border-color: rgb(229, 229, 229)"],
[style*="border-color: rgb(245, 245, 245)"] { border-color: ${DARK.border} !important; }
[style*="border-top-color: rgb(229, 229, 229)"] { border-top-color: ${DARK.border} !important; }
[style*="border-bottom-color: rgb(229, 229, 229)"] { border-bottom-color: ${DARK.border} !important; }

input, textarea, select { color: ${DARK.textPrimary} !important; background-color: ${DARK.borderLight} !important; }
${goldInlineCss()}
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
