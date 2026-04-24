import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Mode = 'light' | 'dark';

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
  navy: '#E2E8F5', navyDark: '#F4F6FB', red: '#F87171', white: '#0B1220',
  bg: '#0B1220', cardBg: '#1A2236',
  textPrimary: '#F3F4F6', textSecondary: '#9CA3AF', textMuted: '#6B7280',
  border: '#2A3348', borderLight: '#222B3E',
  gold: '#F5C94D', cream: '#1E2739', silver: '#9CA3AF', bronze: '#E8A979', platinum: '#B6C1DA',
  npsRed: '#F87171', npsYellow: '#FBBF24', npsGreen: '#34D399',
  success: '#34D399', warning: '#F59E0B',
  chart: ['#E2E8F5', '#F87171', '#F5C94D', '#9CA3AF', '#34D399', '#FBBF24'],
};

const KEY = 'th.themeMode';

type Ctx = { mode: Mode; colors: typeof LIGHT; toggle: () => void };
const ThemeCtx = createContext<Ctx>({ mode: 'light', colors: LIGHT, toggle: () => {} });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<Mode>('light');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v === 'dark' || v === 'light') setMode(v);
    });
  }, []);

  const toggle = () => {
    const next: Mode = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    AsyncStorage.setItem(KEY, next);
  };

  const colors = mode === 'dark' ? DARK : LIGHT;
  return <ThemeCtx.Provider value={{ mode, colors, toggle }}>{children}</ThemeCtx.Provider>;
};

export const useTheme = () => useContext(ThemeCtx);
