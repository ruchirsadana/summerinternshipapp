// Monochrome "gallery" design system (see /app/DESIGN.md).
// Legacy key names (navy/red/gold…) are kept so every screen picks up the new palette.
export const colors = {
  navy: '#111111',      // Obsidian — primary text / fills
  navyDark: '#111111',
  red: '#111111',       // no accent colour in the UI
  white: '#FFFFFF',     // Paper White
  bg: '#FFFFFF',
  cardBg: '#FFFFFF',
  textPrimary: '#111111',
  textSecondary: '#707072', // Steel
  textMuted: '#9E9EA0',     // Faint Gray
  border: '#E5E5E5',        // Concrete Gray
  borderLight: '#F5F5F5',   // Soft Mist
  mist: '#F5F5F5',
  // Gold fill for every filled surface (cards, buttons, active pills, chat) + legible ink on it.
  // onFill shades are deliberately not in the dark-mode CSS maps so they stay dark on gold.
  fill: '#FFD700',
  onFill: '#0A0A0A',
  onFillMuted: '#4A4000',
  gold: '#3A3A3C',
  cream: '#FFFFFF',
  silver: '#9E9EA0',
  bronze: '#707072',
  platinum: '#111111',
  // Data-status colours (kept only for KPI health signals)
  npsRed: '#E53935',
  npsYellow: '#F5A623',
  npsGreen: '#2E8B57',
  success: '#2E8B57',
  warning: '#D97706',
  chart: ['#111111', '#707072', '#9E9EA0', '#3A3A3C', '#C7C7C9', '#5A5A5C'],
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 36,
  xxl: 48,
} as const;

// Cards & inputs are sharp-edged; only buttons / tags / search are pills.
export const radius = {
  sm: 0,
  md: 0,
  lg: 0,
  xl: 0,
  search: 24,
  pill: 30,
} as const;

export const font = {
  family: undefined as string | undefined,
  h1: { fontSize: 28, fontWeight: '500' as const, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '500' as const, letterSpacing: -0.3, lineHeight: 29 },
  h3: { fontSize: 16, fontWeight: '500' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  small: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.6 },
};

// No elevation — surfaces are separated by hairline borders only.
export const shadow = {
  card: { borderWidth: 1, borderColor: '#E5E5E5' },
  elevated: {},
};

export const npsColor = (score: number) => {
  if (score <= 6) return colors.npsRed;
  if (score <= 8) return colors.npsYellow;
  return colors.npsGreen;
};

export const tierColor = (tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze') =>
  tier === 'Platinum' ? colors.platinum : tier === 'Gold' ? colors.gold : tier === 'Silver' ? colors.silver : colors.bronze;
