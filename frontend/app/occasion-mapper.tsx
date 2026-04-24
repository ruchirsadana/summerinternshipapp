import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, font, radius } from '../lib/theme';
import { Card, ScreenWrap, SectionTitle, Chip, EmptyState } from '../lib/ui';
import { store } from '../lib/storage';
import type { Survey } from '../lib/types';

export default function OccasionMapper() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  useFocusEffect(useCallback(() => { store.getSurveys().then(setSurveys); }, []));

  // Group by visit reason
  const groups = new Map<string, Survey[]>();
  surveys.forEach(s => {
    if (!s.visitReason) return;
    const arr = groups.get(s.visitReason) || [];
    arr.push(s); groups.set(s.visitReason, arr);
  });

  if (!surveys.length) return <ScreenWrap><Card><EmptyState icon="gift-outline" title="No surveys yet" body="Occasions plot as surveys come in." /></Card></ScreenWrap>;

  return (
    <ScreenWrap>
      <Text style={[font.h3, { color: colors.navy }]}>Purchase Reason → Category → Spend</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Pattern emerging from {surveys.length} surveys</Text>

      {Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length).map(([reason, list]) => {
        const cats = new Map<string, number>();
        list.forEach(s => s.categories.forEach(c => cats.set(c, (cats.get(c) || 0) + 1)));
        const topCats = Array.from(cats.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
        const spends = new Map<string, number>();
        list.forEach(s => { if (s.spendBracket) spends.set(s.spendBracket, (spends.get(s.spendBracket) || 0) + 1); });
        const topSpend = Array.from(spends.entries()).sort((a, b) => b[1] - a[1])[0];
        return (
          <Card key={reason}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[font.h3, { color: colors.red, flex: 1 }]}>{reason}</Text>
              <Text style={{ color: colors.navy, fontWeight: '800' }}>{list.length}×</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {topCats.map(([c, n]) => <Chip key={c} label={`${c} (${n})`} tone="navy" small />)}
            </View>
            {topSpend && (
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8 }}>
                Typical spend: <Text style={{ color: colors.gold, fontWeight: '800' }}>{topSpend[0]}</Text>
              </Text>
            )}
          </Card>
        );
      })}
    </ScreenWrap>
  );
}
