import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { store } from '../../lib/storage';
import { colors, font, spacing, radius, shadow } from '../../lib/theme';
import { useTheme } from '../../lib/themeContext';
import { Card, PrimaryButton, ProgressBar, Stat, webConstraint } from '../../lib/ui';
import { computeNPS, avgRatings, isToday } from '../../lib/analytics';
import type { Survey, Settings } from '../../lib/types';

const TH_LOGO_URL = 'https://customer-assets.emergentagent.com/job_consumer-pulse-app/artifacts/3l6pshs6_giftcard-th-new.webp';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
};

const weatherIcon = () => {
  const h = new Date().getHours();
  const m = new Date().getMonth(); // 0=Jan, 5=Jun, 8=Sep
  const monsoon = m >= 5 && m <= 8; // Jun-Sep = Mumbai monsoon
  if (monsoon) return 'rainy';
  if (h >= 18 || h < 6) return 'moon';
  if (h < 10 || h > 16) return 'partly-sunny';
  return 'sunny';
};

export default function Home() {
  const router = useRouter();
  const { mode, toggle } = useTheme();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setSurveys(await store.getSurveys());
    setSettings(await store.getSettings());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const nps = computeNPS(surveys);
  const ratings = avgRatings(surveys);
  const todayCount = surveys.filter(s => isToday(s.createdAt)).length;
  const target = settings?.target ?? 500;
  const progress = settings ? surveys.length / target : 0;
  const topAttr = (() => {
    const e = Object.entries(ratings) as [keyof typeof ratings, number][];
    const sorted = e.sort((a, b) => b[1] - a[1]);
    const names: Record<string, string> = {
      quality: 'Quality', style: 'Style', value: 'Value', prestige: 'Prestige',
      inStoreExperience: 'Store Exp.', staff: 'Staff',
    };
    return sorted[0]?.[1] ? `${names[sorted[0][0]]} · ${sorted[0][1]}★` : '—';
  })();
  const avgBrandRating = surveys.length
    ? +((ratings.quality + ratings.style + ratings.value + ratings.prestige + ratings.inStoreExperience + ratings.staff) / 6).toFixed(2)
    : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[{ padding: spacing.md, gap: spacing.md, paddingBottom: 60 }, webConstraint]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
    >
      {/* Top strip: Mumbai on left, theme toggle on right */}
      <View style={styles.topStrip}>
        <View style={styles.locationChip} testID="location-chip">
          <Ionicons name={weatherIcon() as any} size={16} color={colors.gold} />
          <Text style={styles.locationText}>Mumbai</Text>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={toggle}
          style={styles.iconBtn}
          testID="theme-toggle"
        >
          <Ionicons name={mode === 'dark' ? 'sunny' : 'moon'} size={18} color={colors.navy} />
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={styles.hero} testID="home-hero">
        <View style={styles.logoWrap}>
          <Image source={{ uri: TH_LOGO_URL }} style={styles.logoImg} resizeMode="cover" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroSub}>{greeting()}{settings?.internName ? `, ${settings.internName.split(' ')[0]}` : ''} 👋</Text>
          <Text style={styles.heroTitle}>{settings?.storeName || 'Tommy Hilfiger BKC'}</Text>
          <Text style={styles.heroStore}>Field Intelligence</Text>
        </View>
      </View>

      {/* Primary CTA */}
      <PrimaryButton
        label="Start New Survey"
        icon="add-circle"
        variant="accent"
        onPress={() => router.push('/survey/new')}
        testID="start-new-survey-btn"
      />

      {/* Target progress */}
      <Card testID="target-card">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }}>INTERNSHIP TARGET</Text>
            <Text style={[font.h2, { color: colors.navy, marginTop: 4 }]}>{surveys.length} / {settings ? target : '—'}</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.gold }}>{Math.round(progress * 100)}%</Text>
        </View>
        <ProgressBar progress={progress} color={colors.red} />
      </Card>

      {/* Stat row */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat testID="stat-today" label="Today" value={todayCount} accent={colors.navy} />
        <Stat testID="stat-nps" label="Overall NPS" value={nps.score} accent={nps.score >= 30 ? colors.npsGreen : nps.score < 0 ? colors.npsRed : colors.npsYellow} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat testID="stat-brand" label="Avg Brand Rating" value={`${avgBrandRating}★`} accent={colors.gold} />
        <Stat testID="stat-top-attr" label="Top Attribute" value={topAttr} />
      </View>

      {/* Quick access grid */}
      <Text style={[font.h3, { color: colors.navy, marginTop: 8 }]}>Quick Access</Text>
      <View style={styles.grid}>
        {QUICK_LINKS.map(link => (
          <TouchableOpacity
            key={link.path}
            testID={`quick-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
            activeOpacity={0.8}
            onPress={() => router.push(link.path as any)}
            style={styles.quickCard}
          >
            <View style={[styles.quickIcon, { backgroundColor: link.color }]}>
              <Ionicons name={link.icon as any} size={22} color={colors.white} />
            </View>
            <Text style={styles.quickLabel}>{link.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const QUICK_LINKS = [
  { label: 'Insights Feed', path: '/insights', icon: 'sparkles', color: colors.red },
  { label: 'Calculator', path: '/calculator', icon: 'calculator', color: colors.navy },
  { label: 'Brand Health', path: '/brand-health', icon: 'pulse', color: colors.navy },
  { label: 'Performance', path: '/performance', icon: 'trending-up', color: colors.gold },
  { label: 'Dead Hours', path: '/dead-hours', icon: 'time', color: '#4F46E5' },
  { label: 'Competitive', path: '/competitive', icon: 'git-compare', color: colors.navy },
  { label: 'Field Notes', path: '/field-notes', icon: 'book', color: '#0F766E' },
  { label: 'Occasion Map', path: '/occasion-mapper', icon: 'gift', color: colors.red },
  { label: 'Pipeline', path: '/pipeline', icon: 'briefcase', color: colors.navy },
  { label: 'Presentation', path: '/presentation', icon: 'easel', color: '#4F46E5' },
  { label: 'Export', path: '/export', icon: 'share-social', color: '#059669' },
  { label: 'Settings', path: '/settings', icon: 'settings', color: colors.textSecondary },
];

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.navy, borderRadius: radius.xl, padding: spacing.lg, gap: 14,
    flexDirection: 'row', alignItems: 'center', ...shadow.elevated,
  },
  logoWrap: {
    width: 68, height: 68, borderRadius: 10, overflow: 'hidden',
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
  },
  logoImg: { width: '150%', height: '150%' },
  topStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4,
    paddingBottom: 4, paddingTop: 6,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    ...shadow.card,
  },
  locationChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.navy, paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radius.pill,
  },
  locationText: { color: colors.white, fontWeight: '700', fontSize: 12, letterSpacing: 0.3 },
  heroSub: { color: '#AAB5CE', fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  heroTitle: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 2, letterSpacing: -0.3 },
  heroStore: { color: colors.gold, fontSize: 14, fontWeight: '800', marginTop: 4, letterSpacing: 0.3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    flexBasis: '30%' as any, flexGrow: 1, backgroundColor: colors.white, borderRadius: radius.lg,
    padding: 12, alignItems: 'center', gap: 6, ...shadow.card,
  },
  quickIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '700', color: colors.navy, textAlign: 'center' },
});
