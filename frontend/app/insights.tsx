import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, font, radius, shadow } from '../lib/theme';
import { Card, ScreenWrap, PrimaryButton, SectionTitle, EmptyState } from '../lib/ui';
import { store } from '../lib/storage';
import { computeNPS, avgRatings, countBy, conversionPerHour } from '../lib/analytics';
import type { InsightCard } from '../lib/types';

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Insights() {
  const [cards, setCards] = useState<InsightCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { store.getInsights().then(setCards); }, []));

  const generate = async () => {
    setLoading(true); setError(null);
    try {
      const surveys = await store.getSurveys();
      const perf = await store.getPerformance();
      const deadHours = await store.getDeadHours();
      const competitors = await store.getCompetitors();
      const notes = await store.getFieldNotes();

      const nps = computeNPS(surveys);
      const rat = avgRatings(surveys);
      const visitReasons = countBy(surveys.map(s => s.visitReason).filter(Boolean) as string[]);
      const spends = countBy(surveys.map(s => s.spendBracket).filter(Boolean) as string[]);
      const hourly = conversionPerHour(deadHours);

      const payload = {
        total_surveys: surveys.length,
        nps,
        avg_ratings: rat,
        top_visit_reasons: visitReasons.slice(0, 5),
        spend_distribution: spends,
        hourly_conversion: hourly.filter(h => h.footfall > 0),
        recent_performance: perf.slice(0, 7),
        competitor_avg_scores: competitors.slice(0, 5),
        field_notes_count: notes.length,
        latest_observations: notes.slice(0, 3).map(n => n.observation),
      };

      const res = await fetch(`${BACKEND}/api/ai/insights`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const list: InsightCard[] = data.insights.map((i: any) => ({
        id: i.id || `${Date.now()}-${Math.random()}`, title: i.title, body: i.body,
        tone: i.tone, metric: i.metric, generatedAt: data.generated_at,
      }));
      setCards(list); await store.setInsights(list);
    } catch (e: any) {
      setError(e.message || 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const toneColor = (t: InsightCard['tone']) => ({
    positive: colors.npsGreen, negative: colors.red, opportunity: colors.gold, neutral: colors.navy,
  }[t] || colors.navy);

  return (
    <ScreenWrap>
      <Card>
        <SectionTitle title="AI Insights Feed" subtitle="Powered by Claude · refreshes your data" />
        <PrimaryButton label={cards.length ? 'Refresh Insights' : 'Generate Insights'} icon="sparkles" variant="accent" loading={loading} onPress={generate} testID="gen-insights" />
        {error && <Text style={{ color: colors.red, fontSize: 13, marginTop: 8 }}>{error}</Text>}
      </Card>

      {cards.length === 0 && !loading && (
        <Card><EmptyState icon="sparkles-outline" title="No insights yet" body="Tap Generate to analyse your data." /></Card>
      )}

      {cards.map(c => (
        <View key={c.id} style={[styles.insightCard, { borderLeftColor: toneColor(c.tone) }]} testID={`insight-${c.id}`}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: toneColor(c.tone) }} />
            <Text style={{ fontSize: 11, fontWeight: '800', color: toneColor(c.tone), letterSpacing: 0.8 }}>
              {c.tone.toUpperCase()}
            </Text>
            {!!c.metric && <Text style={{ fontSize: 11, color: colors.textSecondary, marginLeft: 'auto' }}>{c.metric}</Text>}
          </View>
          <Text style={[font.h3, { color: colors.navy }]}>{c.title}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>{c.body}</Text>
        </View>
      ))}
    </ScreenWrap>
  );
}

const styles = StyleSheet.create({
  insightCard: {
    backgroundColor: colors.white, padding: 16, borderRadius: radius.lg, borderLeftWidth: 4,
    ...shadow.card,
  },
});
