import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, shadow } from '../../lib/theme';
import { ScreenWrap, SectionTitle } from '../../lib/ui';

const LINKS: { label: string; path: string; icon: string; color: string; desc: string }[] = [
  { label: 'All Responses', path: '/responses', icon: 'list', color: colors.navy, desc: 'Scrollable list + filters' },
  { label: 'Performance', path: '/performance', icon: 'trending-up', color: colors.gold, desc: 'Bills · Units · ATV · UPT' },
  { label: 'Dead Hour Tracker', path: '/dead-hours', icon: 'time', color: '#4F46E5', desc: 'Hourly conversion heatmap' },
  { label: 'Competitive Tracker', path: '/competitive', icon: 'git-compare', color: colors.navy, desc: 'Benchmark vs rivals' },
  { label: 'AI Insights Feed', path: '/insights', icon: 'sparkles', color: colors.red, desc: 'Auto-generated cards' },
  { label: 'Brand Health', path: '/brand-health', icon: 'pulse', color: colors.navy, desc: 'Weekly scorecard' },
  { label: 'Occasion Mapper', path: '/occasion-mapper', icon: 'gift', color: colors.red, desc: 'Reason → category → spend' },
  { label: 'Field Notes', path: '/field-notes', icon: 'book', color: '#0F766E', desc: 'Captain\'s log' },
  { label: 'Presentation Mode', path: '/presentation', icon: 'easel', color: '#4F46E5', desc: 'Clean read-only snapshot' },
  { label: 'B2B Pipeline', path: '/pipeline', icon: 'briefcase', color: colors.gold, desc: 'Corporate gifting leads' },
  { label: 'Project Timeline', path: '/timeline', icon: 'calendar', color: colors.red, desc: 'Week-by-week milestones' },
  { label: 'Export & Reports', path: '/export', icon: 'share-social', color: '#059669', desc: 'CSV · WhatsApp · Email' },
  { label: 'Settings', path: '/settings', icon: 'settings', color: colors.textSecondary, desc: 'Name · store · target' },
];

export default function More() {
  const router = useRouter();
  return (
    <ScreenWrap>
      <SectionTitle title="Workspace" subtitle="All screens in one tap" />
      {LINKS.map(l => (
        <TouchableOpacity
          key={l.path}
          testID={`menu-${l.label.toLowerCase().replace(/\s+/g, '-')}`}
          activeOpacity={0.8}
          onPress={() => router.push(l.path as any)}
          style={styles.row}
        >
          <View style={[styles.icon, { backgroundColor: l.color }]}>
            <Ionicons name={l.icon as any} size={20} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[font.h3, { color: colors.navy }]}>{l.label}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>{l.desc}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      ))}
    </ScreenWrap>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.white,
    padding: 14, borderRadius: radius.lg, ...shadow.card,
  },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
