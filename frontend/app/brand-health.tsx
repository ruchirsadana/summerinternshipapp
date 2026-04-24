import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, font } from '../lib/theme';
import { Card, ScreenWrap, SectionTitle, EmptyState } from '../lib/ui';
import { LineChart } from '../lib/charts';
import { store } from '../lib/storage';
import { computeNPS, avgRatings, topWord, unaidedRecallRate, repeatRate, surveysInLastNDays } from '../lib/analytics';
import type { Survey } from '../lib/types';

export default function BrandHealth() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  useFocusEffect(useCallback(() => { store.getSurveys().then(setSurveys); }, []));

  const thisWeek = surveysInLastNDays(surveys, 7);
  const lastWeek = surveysInLastNDays(surveys, 14).filter(s => !surveysInLastNDays(surveys, 7).includes(s));

  const cur = {
    nps: computeNPS(thisWeek).score,
    avg: avgRating(avgRatings(thisWeek)),
    word: topWord(thisWeek),
    recall: unaidedRecallRate(thisWeek),
    repeat: repeatRate(thisWeek),
  };
  const prev = {
    nps: computeNPS(lastWeek).score,
    avg: avgRating(avgRatings(lastWeek)),
    recall: unaidedRecallRate(lastWeek),
    repeat: repeatRate(lastWeek),
  };

  // trend: bucket by week
  const weekMap = new Map<string, Survey[]>();
  surveys.forEach(s => {
    const d = new Date(s.createdAt);
    const start = new Date(d); start.setDate(d.getDate() - d.getDay());
    const key = start.toISOString().slice(0, 10);
    const arr = weekMap.get(key) || [];
    arr.push(s); weekMap.set(key, arr);
  });
  const weekly = Array.from(weekMap.entries()).sort().map(([, ss]) => computeNPS(ss).score);

  if (!surveys.length) return <ScreenWrap><Card><EmptyState icon="pulse-outline" title="Need surveys first" body="Collect data to see the scorecard." /></Card></ScreenWrap>;

  return (
    <ScreenWrap>
      <Card>
        <SectionTitle title="This Week · vs Last Week" subtitle="Longitudinal brand health" />
        <Metric label="NPS" value={cur.nps} prev={prev.nps} suffix="" />
        <Metric label="Avg Perception" value={cur.avg} prev={prev.avg} suffix="★" />
        <Metric label="Unaided Recall (TH first)" value={cur.recall} prev={prev.recall} suffix="%" />
        <Metric label="Repeat Customer Rate" value={cur.repeat} prev={prev.repeat} suffix="%" />
        <View style={{ marginTop: 10 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.6 }}>TOP WORD ASSOCIATION</Text>
          <Text style={[font.h2, { color: colors.red, marginTop: 4 }]}>{cur.word || '—'}</Text>
        </View>
      </Card>
      {weekly.length > 1 && (
        <Card>
          <SectionTitle title="NPS Trend" subtitle="Week-on-week" />
          <LineChart points={weekly} stroke={colors.red} />
        </Card>
      )}
    </ScreenWrap>
  );
}

const avgRating = (r: any) => {
  const vals = Object.values(r) as number[];
  if (!vals.length) return 0;
  return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
};

const Metric = ({ label, value, prev, suffix }: { label: string; value: number; prev: number; suffix: string }) => {
  const delta = value - prev;
  const up = delta > 0, down = delta < 0;
  const color = up ? colors.npsGreen : down ? colors.red : colors.textSecondary;
  return (
    <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }}>{label.toUpperCase()}</Text>
        <Text style={[font.h2, { color: colors.navy, marginTop: 2 }]}>{value}{suffix}</Text>
      </View>
      <Text style={{ color, fontSize: 14, fontWeight: '800' }}>{up ? '▲' : down ? '▼' : '—'} {Math.abs(delta).toFixed(suffix === '★' ? 2 : 0)}{suffix}</Text>
    </View>
  );
};
