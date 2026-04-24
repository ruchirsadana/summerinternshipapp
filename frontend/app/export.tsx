import React, { useCallback, useState } from 'react';
import { View, Text, Platform, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Clipboard from 'expo-clipboard';
import { colors, font } from '../lib/theme';
import { Card, ScreenWrap, PrimaryButton, SectionTitle } from '../lib/ui';
import { store } from '../lib/storage';
import { computeNPS, avgRatings, topWord, surveysInLastNDays } from '../lib/analytics';
import type { Survey } from '../lib/types';

const csvCell = (s: any) => `"${String(s ?? '').replace(/"/g, '""')}"`;

export default function Export() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  useFocusEffect(useCallback(() => { store.getSurveys().then(setSurveys); }, []));

  const nps = computeNPS(surveys);
  const weekly = surveysInLastNDays(surveys, 7);
  const topW = topWord(surveys);

  const weeklyReport = (() => {
    if (!weekly.length) return 'No surveys in the last 7 days.';
    const wnps = computeNPS(weekly);
    const rat = avgRatings(weekly);
    const ratEntries = Object.entries(rat) as [string, number][];
    const lowest = ratEntries.sort((a, b) => a[1] - b[1])[0];
    return [
      `Weekly Report · ${new Date().toLocaleDateString()}`,
      `• ${weekly.length} surveys collected this week`,
      `• NPS: ${wnps.score} (${wnps.promoters} promoters / ${wnps.detractors} detractors)`,
      `• Top word association: "${topWord(weekly)}"`,
      `• Lowest-rated attribute: ${lowest[0]} at ${lowest[1]}★`,
      `• Overall program NPS: ${nps.score} across ${surveys.length} surveys`,
    ].join('\n');
  })();

  const exportCSV = async (shareMode: 'native' | 'whatsapp' | 'email' | 'copy') => {
    const header = [
      'id','createdAt','ageGroup','gender','occupation','shoppingFrequency',
      'unaidedRecall','brandAwareness','discoveryChannel','discoveryOther',
      'word1','word2','word3',
      'rating_quality','rating_style','rating_value','rating_prestige','rating_inStoreExperience','rating_staff',
      'cmp_hugoBoss','cmp_calvinKlein','cmp_ralphLauren',
      'visitReason','visitReasonOther','categories','spendBracket','purchaseBarrier',
      'priorPurchase','nps','feedback',
    ];
    const rows = surveys.map(s => [
      s.id, s.createdAt, s.ageGroup, s.gender, s.occupation, s.shoppingFrequency,
      s.unaidedRecall, s.brandAwareness.join('|'), s.discoveryChannel, s.discoveryOther,
      s.word1, s.word2, s.word3,
      s.ratings.quality, s.ratings.style, s.ratings.value, s.ratings.prestige, s.ratings.inStoreExperience, s.ratings.staff,
      s.comparisons.hugoBoss, s.comparisons.calvinKlein, s.comparisons.ralphLauren,
      s.visitReason, s.visitReasonOther, s.categories.join('|'), s.spendBracket, s.purchaseBarrier,
      s.priorPurchase, s.nps, s.feedback,
    ]);
    const csv = [header, ...rows].map(r => r.map(csvCell).join(',')).join('\n');

    if (shareMode === 'copy') {
      await Clipboard.setStringAsync(csv);
      Alert.alert('Copied', 'CSV copied to clipboard.');
      return;
    }
    try {
      if (Platform.OS === 'web') {
        // Web fallback: trigger download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `TH_surveys_${Date.now()}.csv`; a.click();
        URL.revokeObjectURL(url);
        return;
      }
      const dir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory;
      const path = `${dir}TH_surveys_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(path, csv);
      const avail = await Sharing.isAvailableAsync();
      if (avail) {
        await Sharing.shareAsync(path, {
          mimeType: 'text/csv', dialogTitle: 'Share Surveys CSV',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Saved', `File saved to ${path}`);
      }
    } catch (e: any) {
      Alert.alert('Export failed', e.message || 'Unknown error');
    }
  };

  const shareReport = async () => {
    try {
      if (Platform.OS === 'web') { await Clipboard.setStringAsync(weeklyReport); Alert.alert('Copied', 'Report copied.'); return; }
      const dir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory;
      const path = `${dir}TH_weekly_report_${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(path, weeklyReport);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(path);
    } catch (e: any) {
      Alert.alert('Share failed', e.message);
    }
  };

  return (
    <ScreenWrap>
      <Card>
        <SectionTitle title="Summary" />
        <Text style={[font.h2, { color: colors.navy }]}>{surveys.length} Surveys</Text>
        <Text style={{ color: colors.textSecondary }}>NPS {nps.score} · Top word "{topW}" · {weekly.length} this week</Text>
      </Card>

      <Card>
        <SectionTitle title="Export Surveys (CSV)" subtitle="Share via any app" />
        <View style={{ gap: 10 }}>
          <PrimaryButton label="Share Sheet" icon="share" variant="accent" onPress={() => exportCSV('native')} testID="export-native" />
          <PrimaryButton label="Copy CSV" icon="copy" variant="outline" onPress={() => exportCSV('copy')} testID="export-copy" />
          {Platform.OS === 'web' && <PrimaryButton label="Download CSV" icon="download" onPress={() => exportCSV('native')} testID="export-download" />}
        </View>
      </Card>

      <Card>
        <SectionTitle title="Weekly Report" subtitle="Auto-summary" />
        <View style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 13, lineHeight: 20 }}>{weeklyReport}</Text>
        </View>
        <PrimaryButton label="Share Report" icon="share-social" onPress={shareReport} testID="share-report" style={{ marginTop: 10 }} />
      </Card>
    </ScreenWrap>
  );
}
