import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, font, radius, shadow } from '../lib/theme';
import { ScreenWrap, SectionTitle, EmptyState, Card } from '../lib/ui';
import { Gauge } from '../lib/charts';
import { store } from '../lib/storage';
import { computeNPS, avgRatings, topWord } from '../lib/analytics';
import type { Survey, Settings, InsightCard, PerformanceEntry } from '../lib/types';

export default function Presentation() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [ins, setIns] = useState<InsightCard[]>([]);
  const [perf, setPerf] = useState<PerformanceEntry[]>([]);
  useFocusEffect(useCallback(() => {
    (async () => {
      setSurveys(await store.getSurveys());
      setSettings(await store.getSettings());
      setIns(await store.getInsights());
      setPerf(await store.getPerformance());
    })();
  }, []));

  const nps = computeNPS(surveys);
  const rat = avgRatings(surveys);
  const avg = +(((rat.quality + rat.style + rat.value + rat.prestige + rat.inStoreExperience + rat.staff) / 6) || 0).toFixed(2);
  const best = [...perf].sort((a, b) => b.atv - a.atv)[0];

  if (!surveys.length) return <ScreenWrap><Card><EmptyState icon="easel-outline" title="No data to present" /></Card></ScreenWrap>;

  return (
    <ScreenWrap>
      <View style={styles.hero}>
        <View style={styles.flag}>
          <View style={[styles.flagBar, { backgroundColor: colors.navy }]} />
          <View style={{ flexDirection: 'row' }}>
            <View style={[styles.flagSquare, { backgroundColor: colors.white }]} />
            <View style={[styles.flagSquare, { backgroundColor: colors.red }]} />
          </View>
          <View style={[styles.flagBar, { backgroundColor: colors.navy }]} />
        </View>
        <Text style={{ color: colors.white, fontSize: 24, fontWeight: '800', marginTop: 12 }}>{settings?.storeName || 'Tommy Hilfiger'}</Text>
        <Text style={{ color: colors.gold, fontSize: 13, fontWeight: '700', marginTop: 2 }}>Internship Snapshot · {settings?.internName || 'Field Intern'}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1 }}>
          <Text style={styles.caption}>SURVEYS</Text>
          <Text style={[font.h1, { color: colors.navy }]}>{surveys.length}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>of {settings?.target || 150}</Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={styles.caption}>BRAND SCORE</Text>
          <Text style={[font.h1, { color: colors.gold }]}>{avg}★</Text>
        </Card>
      </View>

      <Card><Gauge score={nps.score} /></Card>

      <Card>
        <SectionTitle title="Top Word Association" />
        <Text style={[font.h1, { color: colors.red, marginTop: 6 }]}>"{topWord(surveys)}"</Text>
      </Card>

      {best && (
        <Card>
          <SectionTitle title="Personal Best Day" />
          <Text style={[font.h2, { color: colors.gold }]}>{best.date} · ATV ₹{best.atv}</Text>
        </Card>
      )}

      {ins[0] && (
        <Card>
          <SectionTitle title="Insight of the Week" />
          <Text style={[font.h3, { color: colors.navy }]}>{ins[0].title}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 6 }}>{ins[0].body}</Text>
        </Card>
      )}
    </ScreenWrap>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.navy, borderRadius: radius.xl, padding: 24, alignItems: 'center', ...shadow.elevated },
  flag: { width: 80, height: 80, overflow: 'hidden', borderRadius: 8 },
  flagBar: { height: 14 },
  flagSquare: { width: 40, height: 52 },
  caption: { fontSize: 11, fontWeight: '800', color: colors.textSecondary, letterSpacing: 0.8 },
});
