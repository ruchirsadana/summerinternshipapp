import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { colors, font, npsColor } from '../../lib/theme';
import { Card, ScreenWrap, Chip, SectionTitle, EmptyState } from '../../lib/ui';
import { store } from '../../lib/storage';
import type { Survey } from '../../lib/types';

export default function ResponseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  useFocusEffect(useCallback(() => { store.getSurveys().then(list => setSurvey(list.find(s => s.id === id) || null)); }, [id]));

  if (!survey) return <ScreenWrap><Card><EmptyState icon="alert-circle-outline" title="Not found" /></Card></ScreenWrap>;

  return (
    <ScreenWrap>
      <Card>
        <Text style={{ fontSize: 11, letterSpacing: 0.8, color: colors.textSecondary, fontWeight: '700' }}>SURVEY ID</Text>
        <Text style={[font.h2, { color: colors.navy }]}>{survey.id}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{new Date(survey.createdAt).toLocaleString()}</Text>
      </Card>

      <Card>
        <SectionTitle title="A · Profile" />
        <Row label="Age" value={survey.ageGroup} />
        <Row label="Gender" value={survey.gender} />
        <Row label="Occupation" value={survey.occupation} />
        <Row label="Frequency" value={survey.shoppingFrequency} />
      </Card>

      <Card>
        <SectionTitle title="B · Brand Awareness" />
        <Row label="First brand (unaided)" value={survey.unaidedRecall || '—'} />
        <Row label="Aware of" value={survey.brandAwareness.join(', ') || '—'} />
        <Row label="Discovery" value={survey.discoveryChannel + (survey.discoveryOther ? ` (${survey.discoveryOther})` : '')} />
      </Card>

      <Card>
        <SectionTitle title="C · Perception" subtitle="Three words" />
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginVertical: 6 }}>
          {[survey.word1, survey.word2, survey.word3].filter(Boolean).map((w, i) => (
            <Chip key={i} label={w} tone={i === 0 ? 'red' : i === 1 ? 'navy' : 'gold'} />
          ))}
        </View>
        <Row label="Quality" value={`${survey.ratings.quality} ★`} />
        <Row label="Style" value={`${survey.ratings.style} ★`} />
        <Row label="Value" value={`${survey.ratings.value} ★`} />
        <Row label="Prestige" value={`${survey.ratings.prestige} ★`} />
        <Row label="In-Store" value={`${survey.ratings.inStoreExperience} ★`} />
        <Row label="Staff" value={`${survey.ratings.staff} ★`} />
        <Row label="vs Hugo Boss" value={survey.comparisons.hugoBoss || '—'} />
        <Row label="vs Calvin Klein" value={survey.comparisons.calvinKlein || '—'} />
        <Row label="vs Ralph Lauren" value={survey.comparisons.ralphLauren || '—'} />
      </Card>

      <Card>
        <SectionTitle title="D · Purchase Behaviour" />
        <Row label="Visit Reason" value={survey.visitReason + (survey.visitReasonOther ? ` (${survey.visitReasonOther})` : '')} />
        <Row label="Categories" value={survey.categories.join(', ') || '—'} />
        <Row label="Spend" value={survey.spendBracket} />
        <Row label="Barrier" value={survey.purchaseBarrier || '—'} />
      </Card>

      <Card>
        <SectionTitle title="E · Loyalty" />
        <Row label="Prior purchases" value={survey.priorPurchase} />
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <Text style={{ fontSize: 11, letterSpacing: 0.8, color: colors.textSecondary, fontWeight: '700' }}>NPS</Text>
          <Text style={{ fontSize: 42, fontWeight: '800', color: npsColor(survey.nps) }}>{survey.nps}</Text>
        </View>
        <Row label="Feedback" value={survey.feedback || '—'} />
      </Card>
    </ScreenWrap>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={{ flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: 12 }}>
    <Text style={{ color: colors.textSecondary, fontWeight: '600', width: 120, fontSize: 13 }}>{label}</Text>
    <Text style={{ color: colors.textPrimary, fontSize: 14, flex: 1 }}>{value || '—'}</Text>
  </View>
);
