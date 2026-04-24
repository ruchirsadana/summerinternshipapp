import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius } from '../lib/theme';
import { Card, ScreenWrap, SectionTitle, ProgressBar } from '../lib/ui';
import { store } from '../lib/storage';
import type { Milestone, Settings } from '../lib/types';

export default function Timeline() {
  const [items, setItems] = useState<Milestone[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const load = useCallback(async () => {
    setItems(await store.getMilestones());
    setSettings(await store.getSettings());
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (m: Milestone) => {
    const next = items.map(i => i.id === m.id ? { ...i, done: !i.done } : i);
    setItems(next); await store.setMilestones(next);
  };

  const start = settings ? new Date(settings.startDate) : new Date();
  const now = new Date();
  const days = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const weeksDone = Math.min(12, days / 7);
  const pct = weeksDone / 12;

  return (
    <ScreenWrap>
      <Card>
        <SectionTitle title="12-Week Internship" subtitle={`Started ${settings?.startDate || '—'}`} />
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 6 }}>Week {Math.ceil(weeksDone) || 1} of 12 · {Math.round(pct * 100)}% elapsed</Text>
        <View style={{ marginTop: 10 }}><ProgressBar progress={pct} color={colors.red} /></View>
      </Card>

      {items.map(m => (
        <TouchableOpacity key={m.id} testID={`ms-${m.id}`} activeOpacity={0.85} onPress={() => toggle(m)} style={styles.row}>
          <View style={[styles.weekBadge, m.done && { backgroundColor: colors.npsGreen }]}>
            <Text style={{ color: colors.white, fontWeight: '800', fontSize: 11 }}>W{m.week}</Text>
          </View>
          <Text style={[font.h3, { color: m.done ? colors.textMuted : colors.navy, flex: 1, textDecorationLine: m.done ? 'line-through' : 'none' }]}>
            {m.title}
          </Text>
          <Ionicons name={m.done ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={m.done ? colors.npsGreen : colors.border} />
        </TouchableOpacity>
      ))}
    </ScreenWrap>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white,
    padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderLight,
  },
  weekBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
});
