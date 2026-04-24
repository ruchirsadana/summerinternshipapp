export const colors = {
  navy: '#1B2A4A',
  navyDark: '#0F1A30',
  red: '#C8102E',
  white: '#FFFFFF',
  bg: '#F6F7FB',
  cardBg: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F1F3F6',
  gold: '#D4AF37',
  cream: '#FDFBF7',
  silver: '#9CA3AF',
  bronze: '#B98455',
  platinum: '#6B7A99',
  npsRed: '#E53935',
  npsYellow: '#F5A623',
  npsGreen: '#2E8B57',
  success: '#059669',
  warning: '#D97706',
  chart: ['#1B2A4A', '#C8102E', '#D4AF37', '#6B7280', '#2E8B57', '#F5A623'],
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export const font = {
  family: undefined as string | undefined, // system default for reliability; Inter fallback
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.8 },
};

export const shadow = {
  card: {
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
};

export const npsColor = (score: number) => {
  if (score <= 6) return colors.npsRed;
  if (score <= 8) return colors.npsYellow;
  return colors.npsGreen;
};

export const tierColor = (tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze') =>
  tier === 'Platinum' ? colors.platinum : tier === 'Gold' ? colors.gold : tier === 'Silver' ? colors.silver : colors.bronze;
