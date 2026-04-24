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

// CSS overrides injected on web to flip every hardcoded light color to its dark equivalent.
// Targets React Native Web's inline-style attributes so it works on screens that still
// import the static `colors` constant (rather than the useTheme hook).
const DARK_CSS = `
html, body, #root, #__next { background-color: ${DARK.bg} !important; color: ${DARK.textPrimary} !important; }
body { color-scheme: dark; }

/* Backgrounds: light bg → dark bg */
[style*="background-color: rgb(246, 247, 251)"],
[style*="background-color:#F6F7FB"],
[style*="background-color: #F6F7FB"],
[style*="background-color:rgb(246,247,251)"] { background-color: ${DARK.bg} !important; }

/* Cards: white → dark card */
[style*="background-color: rgb(255, 255, 255)"],
[style*="background-color:#FFFFFF"],
[style*="background-color: #FFFFFF"],
[style*="background-color:#fff"],
[style*="background-color: #fff"],
[style*="background-color:rgb(255,255,255)"] { background-color: ${DARK.cardBg} !important; }

/* Light-gray surfaces: #F9FAFB / #F1F3F6 */
[style*="background-color: rgb(249, 250, 251)"],
[style*="background-color: rgb(241, 243, 246)"],
[style*="background-color: rgb(248, 238, 248)"] { background-color: ${DARK.borderLight} !important; }

/* Primary text: near-black → near-white */
[style*="color: rgb(17, 24, 39)"],
[style*="color:#111827"],
[style*="color: #111827"] { color: ${DARK.textPrimary} !important; }

/* Secondary text: medium gray → lighter gray */
[style*="color: rgb(107, 114, 128)"],
[style*="color:#6B7280"],
[style*="color: #6B7280"] { color: ${DARK.textSecondary} !important; }

/* Muted: very light gray → softer */
[style*="color: rgb(156, 163, 175)"],
[style*="color:#9CA3AF"],
[style*="color: #9CA3AF"] { color: ${DARK.textMuted} !important; }

/* Navy text (brand — headings, emphasis, card titles) → near-white */
[style*="color: rgb(27, 42, 74)"],
[style*="color:#1B2A4A"],
[style*="color: #1B2A4A"] { color: ${DARK.navy} !important; }

/* Dark text (used for strong emphasis and values) */
[style*="color: rgb(15, 23, 42)"],
[style*="color: rgb(15, 26, 48)"],
[style*="color:#0F1A30"],
[style*="color: #0F1A30"] { color: ${DARK.navy} !important; }

/* AAB5CE (hero subtitle color) → slightly muted but readable */
[style*="color: rgb(170, 181, 206)"] { color: ${DARK.textSecondary} !important; }

/* Light borders become subtle dark borders */
[style*="border-color: rgb(229, 231, 235)"],
[style*="border-color: rgb(241, 243, 246)"] { border-color: ${DARK.border} !important; }

/* Bottom tab bar & navigation bars */
[style*="border-top-color: rgb(229, 231, 235)"] { border-top-color: ${DARK.border} !important; }

/* Input placeholder/text color contrast */
input, textarea { color: ${DARK.textPrimary} !important; }

/* Inline highlight chips used in Performance scorecard */
[style*="background-color: rgb(232, 238, 248)"],
[style*="background-color: rgb(255, 249, 230)"],
[style*="background-color: rgb(232, 245, 233)"] { filter: hue-rotate(180deg) invert(0.85); }
`;

const STYLE_ID = 'th-dark-style';

function applyWebTheme(mode: Mode) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.innerHTML = mode === 'dark' ? DARK_CSS : '';
  document.documentElement.setAttribute('data-theme', mode);
  document.body.style.backgroundColor = mode === 'dark' ? DARK.bg : LIGHT.bg;
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
