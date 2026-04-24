import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { colors, font, spacing } from '../../lib/theme';
import { Card, ScreenWrap, PrimaryButton, EmptyState, SectionTitle } from '../../lib/ui';
import { Gauge, DonutChart, BarChart } from '../../lib/charts';
import { store } from '../../lib/storage';
import { computeNPS, avgRatings, countBy } from '../../lib/analytics';
import type { Survey } from '../../lib/types';

export default function Analytics() {
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const load = useCallback(async () => setSurveys(await store.getSurveys()), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const nps = computeNPS(surveys);
  const ratings = avgRatings(surveys);
  const ages = countBy(surveys.map(s => s.ageGroup).filter(Boolean) as string[]);
  const spends = countBy(surveys.map(s => s.spendBracket).filter(Boolean) as string[]);
  const reasons = countBy(surveys.map(s => s.visitReason).filter(Boolean) as string[]);
  const channels = countBy(surveys.map(s => s.discoveryChannel).filter(Boolean) as string[]);
  const priors = surveys.reduce((acc, s) => {
    if (s.priorPurchase?.startsWith('Yes')) acc.repeat++;
    else if (s.priorPurchase) acc.new++;
    return acc;
  }, { repeat: 0, new: 0 });

  if (!surveys.length) {
    return (
      <ScreenWrap>
        <Card><EmptyState icon="bar-chart" title="No data yet" body="Submit surveys to see live analytics." /></Card>
        <PrimaryButton label="Start a Survey" variant="accent" onPress={() => router.push('/survey/new')} testID="analytics-start-btn" />
      </ScreenWrap>
    );
  }

  return (
    <ScreenWrap>
      <Card testID="analytics-total">
        <Text style={styles.caption}>TOTAL RESPONSES</Text>
        <Text style={[font.h1, { color: colors.navy }]}>{nps.total}</Text>
      </Card>

      <Card>
        <SectionTitle title="NPS Score" subtitle="Net Promoter Score · live" />
        <Gauge score={nps.score} size={220} />
      </Card>

      <Card>
        <SectionTitle title="Promoters · Passives · Detractors" />
        <DonutChart
          slices={[
            { label: 'Promoters', value: nps.promoters, color: colors.npsGreen },
            { label: 'Passives', value: nps.passives, color: colors.npsYellow },
            { label: 'Detractors', value: nps.detractors, color: colors.npsRed },
          ]}
          centerLabel="Total"
          centerValue={String(nps.total)}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 }}>
          <Legend color={colors.npsGreen} label={`Promoters ${nps.promoters}`} />
          <Legend color={colors.npsYellow} label={`Passives ${nps.passives}`} />
          <Legend color={colors.npsRed} label={`Detractors ${nps.detractors}`} />
        </View>
      </Card>

      <Card>
        <SectionTitle title="Average Ratings" subtitle="Out of 5" />
        <BarChart
          data={[
            { label: 'Quality', value: ratings.quality, color: colors.navy },
            { label: 'Style', value: ratings.style, color: colors.red },
            { label: 'Value', value: ratings.value, color: colors.gold },
            { label: 'Prestige', value: ratings.prestige, color: colors.navy },
            { label: 'Store', value: ratings.inStoreExperience, color: colors.red },
            { label: 'Staff', value: ratings.staff, color: colors.gold },
          ]}
          maxValue={5}
          valueSuffix="★"
          height={160}
        />
      </Card>

      <Card>
        <SectionTitle title="Age Group Distribution" />
        <DonutChart
          slices={ages.map((a, i) => ({ label: a.label, value: a.count, color: colors.chart[i % colors.chart.length] }))}
          centerLabel="Ages"
          centerValue={String(ages.reduce((s, x) => s + x.count, 0))}
        />
      </Card>

      <Card>
        <SectionTitle title="Spend Bracket Distribution" />
        <BarChart
          data={spends.map((s, i) => ({ label: s.label.replace('₹', '').slice(0, 10), value: s.count, color: colors.chart[i % colors.chart.length] }))}
          height={160}
        />
      </Card>

      <Card>
        <SectionTitle title="Top 3 Visit Reasons" />
        {reasons.slice(0, 3).map((r, i) => (
          <View key={i} style={styles.listRow}>
            <Text style={styles.rank}>#{i + 1}</Text>
            <Text style={styles.listLabel} numberOfLines={2}>{r.label}</Text>
            <Text style={styles.listCount}>{r.count}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <SectionTitle title="Discovery Channels" />
        {channels.slice(0, 5).map((r, i) => (
          <View key={i} style={styles.listRow}>
            <Text style={styles.listLabel} numberOfLines={1}>{r.label}</Text>
            <Text style={styles.listCount}>{r.count}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <SectionTitle title="Repeat vs New" />
        <DonutChart
          slices={[
            { label: 'Repeat', value: priors.repeat, color: colors.navy },
            { label: 'New', value: priors.new, color: colors.gold },
          ]}
          centerLabel="Split"
          centerValue={`${Math.round((priors.repeat / Math.max(1, priors.repeat + priors.new)) * 100)}%`}
        />
      </Card>

      <PrimaryButton label="View All Responses" icon="list" onPress={() => router.push('/responses')} testID="view-responses-btn" />
    </ScreenWrap>
  );
}

const Legend = ({ color, label }: { color: string; label: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
    <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '600' }}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  caption: { fontSize: 11, color: colors.textSecondary, fontWeight: '700', letterSpacing: 0.8 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  rank: { fontSize: 16, fontWeight: '800', color: colors.red, width: 26 },
  listLabel: { flex: 1, fontSize: 14, color: colors.textPrimary },
  listCount: { fontSize: 14, fontWeight: '700', color: colors.navy },
});
