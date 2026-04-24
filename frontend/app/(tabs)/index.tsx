import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { store } from '../../lib/storage';
import { colors, font, spacing, radius, shadow } from '../../lib/theme';
import { Card, PrimaryButton, ProgressBar, Stat } from '../../lib/ui';
import { computeNPS, avgRatings, isToday } from '../../lib/analytics';
import type { Survey, Settings } from '../../lib/types';

export default function Home() {
  const router = useRouter();
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
  const target = settings?.target || 150;
  const progress = surveys.length / target;
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
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 60 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
    >
      {/* Hero */}
      <View style={styles.hero} testID="home-hero">
        <View style={styles.flag}>
          <View style={[styles.flagBar, { backgroundColor: colors.navy }]} />
          <View style={{ flexDirection: 'row' }}>
            <View style={[styles.flagSquare, { backgroundColor: colors.white }]} />
            <View style={[styles.flagSquare, { backgroundColor: colors.red }]} />
          </View>
          <View style={[styles.flagBar, { backgroundColor: colors.navy }]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroSub}>Welcome{settings?.internName ? `, ${settings.internName}` : ''}</Text>
          <Text style={styles.heroTitle}>TH Field Intelligence</Text>
          <Text style={styles.heroStore}>{settings?.storeName || 'Tommy Hilfiger'}</Text>
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
            <Text style={[font.h2, { color: colors.navy, marginTop: 4 }]}>{surveys.length} / {target}</Text>
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
  { label: 'Brand Health', path: '/brand-health', icon: 'pulse', color: colors.navy },
  { label: 'Performance', path: '/performance', icon: 'trending-up', color: colors.gold },
  { label: 'Dead Hours', path: '/dead-hours', icon: 'time', color: '#4F46E5' },
  { label: 'Competitive', path: '/competitive', icon: 'git-compare', color: colors.navy },
  { label: 'Field Notes', path: '/field-notes', icon: 'book', color: '#0F766E' },
  { label: 'Occasion Map', path: '/occasion-mapper', icon: 'gift', color: colors.red },
  { label: 'Timeline', path: '/timeline', icon: 'calendar', color: colors.gold },
  { label: 'Pipeline', path: '/pipeline', icon: 'briefcase', color: colors.navy },
  { label: 'Presentation', path: '/presentation', icon: 'easel', color: '#4F46E5' },
  { label: 'Export', path: '/export', icon: 'share-social', color: '#059669' },
  { label: 'Settings', path: '/settings', icon: 'settings', color: colors.textSecondary },
];

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.navy, borderRadius: radius.xl, padding: spacing.lg, gap: 12,
    flexDirection: 'row', alignItems: 'center', ...shadow.elevated,
  },
  flag: { width: 64, height: 64, overflow: 'hidden', borderRadius: 8 },
  flagBar: { height: 10 },
  flagSquare: { width: 32, height: 44 },
  heroSub: { color: '#AAB5CE', fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  heroTitle: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 2, letterSpacing: -0.3 },
  heroStore: { color: colors.gold, fontSize: 13, fontWeight: '700', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    flexBasis: '30%' as any, flexGrow: 1, backgroundColor: colors.white, borderRadius: radius.lg,
    padding: 12, alignItems: 'center', gap: 6, ...shadow.card,
  },
  quickIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '700', color: colors.navy, textAlign: 'center' },
});
