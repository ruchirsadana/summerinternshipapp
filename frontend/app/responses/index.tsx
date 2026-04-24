import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing, shadow, npsColor } from '../../lib/theme';
import { Input, EmptyState, Chip } from '../../lib/ui';
import { store } from '../../lib/storage';
import type { Survey } from '../../lib/types';

const AGE_FILTERS = ['All', '18-24', '25-34', '35-44', '45+'];
const NPS_FILTERS: { label: string; min: number; max: number }[] = [
  { label: 'All', min: 0, max: 10 }, { label: 'Promoter', min: 9, max: 10 },
  { label: 'Passive', min: 7, max: 8 }, { label: 'Detractor', min: 0, max: 6 },
];

export default function ResponsesList() {
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [query, setQuery] = useState('');
  const [ageF, setAgeF] = useState('All');
  const [npsF, setNpsF] = useState(NPS_FILTERS[0]);

  useFocusEffect(useCallback(() => { store.getSurveys().then(setSurveys); }, []));

  const filtered = useMemo(() => surveys.filter(s => {
    if (ageF !== 'All' && s.ageGroup !== ageF) return false;
    if (s.nps < npsF.min || s.nps > npsF.max) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return s.id.toLowerCase().includes(q) || s.feedback?.toLowerCase().includes(q) || s.unaidedRecall?.toLowerCase().includes(q);
    }
    return true;
  }), [surveys, ageF, npsF, query]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 14, gap: 10 }}>
        <Input placeholder="Search ID, feedback..." value={query} onChangeText={setQuery} testID="resp-search" />
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {AGE_FILTERS.map(f => (
            <TouchableOpacity key={f} testID={`age-filter-${f}`} onPress={() => setAgeF(f)} style={[styles.pill, ageF === f && styles.pillActive]}>
              <Text style={[styles.pillText, ageF === f && { color: colors.white }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {NPS_FILTERS.map(f => (
            <TouchableOpacity key={f.label} testID={`nps-filter-${f.label}`} onPress={() => setNpsF(f)} style={[styles.pill, npsF.label === f.label && styles.pillActive]}>
              <Text style={[styles.pillText, npsF.label === f.label && { color: colors.white }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={[{ padding: 14, gap: 10, paddingBottom: 60 }, Platform.OS === 'web' ? { maxWidth: 640, width: '100%', alignSelf: 'center' as const } : {}]}
        ListEmptyComponent={<View style={{ padding: 32 }}><EmptyState icon="document-text-outline" title="No responses" body="Change filters or submit surveys." /></View>}
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`resp-row-${item.id}`}
            activeOpacity={0.8}
            onPress={() => router.push(`/responses/${item.id}` as any)}
            style={styles.row}
          >
            <View style={[styles.npsBadge, { backgroundColor: npsColor(item.nps) }]}>
              <Text style={{ color: colors.white, fontWeight: '800', fontSize: 18 }}>{item.nps}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[font.h3, { color: colors.navy }]}>{item.id}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                {new Date(item.createdAt).toLocaleDateString()} · {item.ageGroup || '—'} · {item.spendBracket || '—'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  pillActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  pillText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, padding: 14, borderRadius: radius.lg, ...shadow.card },
  npsBadge: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
