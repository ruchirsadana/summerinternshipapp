import React, { useCallback, useState } from 'react';
import { View, Text, Platform, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Clipboard from 'expo-clipboard';
import { colors, font, radius } from '../lib/theme';
import { Card, ScreenWrap, PrimaryButton, SectionTitle } from '../lib/ui';
import { store } from '../lib/storage';
import { computeNPS, avgRatings, topWord, surveysInLastNDays } from '../lib/analytics';
import type { Survey } from '../lib/types';

const csvCell = (s: any) => `"${String(s ?? '').replace(/"/g, '""')}"`;
const toCsv = (header: string[], rows: any[][]) =>
  [header, ...rows].map(r => r.map(csvCell).join(',')).join('\n');

const SURVEY_HEADER = [
  'S.No', 'Survey ID', 'Date & Time', 'Respondent Name',
  'Age Group', 'Gender', 'Occupation', 'Shopping Frequency',
  'First Brand Recalled (Unaided)', 'Brands Aware Of', 'Discovery Channel', 'Discovery (Other)',
  'Word Association 1', 'Word Association 2', 'Word Association 3',
  'Rating - Quality', 'Rating - Style', 'Rating - Value for Money',
  'Rating - Prestige', 'Rating - In-Store Experience', 'Rating - Staff',
  'vs Hugo Boss', 'vs Calvin Klein', 'vs Ralph Lauren',
  'Visit Reason', 'Visit Reason (Other)', 'Categories Purchased',
  'Spend Bracket', 'Purchase Barrier',
  'Prior Purchase History', 'NPS Score (0-10)', 'NPS Segment', 'Feedback',
];

export default function Export() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const loadCounts = useCallback(async () => {
    const all = await store.getAll();
    setSurveys(all.surveys);
    setCounts({
      surveys: all.surveys.length,
      customers: all.customers.length,
      performance: all.performance.length,
      competitors: all.competitors.length,
      deadHours: all.deadHours.length,
      fieldNotes: all.fieldNotes.length,
      pipeline: all.pipeline.length,
    });
  }, []);
  useFocusEffect(useCallback(() => { loadCounts(); }, [loadCounts]));

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

  const buildCSVFor = async (kind: string): Promise<{ csv: string; filename: string }> => {
    const all = await store.getAll();
    switch (kind) {
      case 'surveys': {
        const rows = all.surveys.map((s, i) => [
          i + 1,
          s.id,
          new Date(s.createdAt).toLocaleString('en-IN'),
          s.respondentName || '',
          s.ageGroup, s.gender, s.occupation, s.shoppingFrequency,
          s.unaidedRecall, s.brandAwareness.join(' | '), s.discoveryChannel, s.discoveryOther,
          s.word1, s.word2, s.word3,
          s.ratings.quality, s.ratings.style, s.ratings.value, s.ratings.prestige, s.ratings.inStoreExperience, s.ratings.staff,
          s.comparisons.hugoBoss, s.comparisons.calvinKlein, s.comparisons.ralphLauren,
          s.visitReason, s.visitReasonOther, s.categories.join(' | '), s.spendBracket, s.purchaseBarrier,
          s.priorPurchase, s.nps, s.nps >= 9 ? 'Promoter' : s.nps >= 7 ? 'Passive' : 'Detractor', s.feedback,
        ]);
        return { csv: toCsv(SURVEY_HEADER, rows), filename: `TH_surveys_${Date.now()}.csv` };
      }
      case 'customers': {
        const rows = all.customers.map((c, i) => [i + 1, c.id, new Date(c.createdAt).toLocaleString('en-IN'), c.name, c.phone, c.ageGroup, c.categoryPrefs.join(' | '), c.spendBracket, c.birthdayMonth, c.visitDate, c.purchaseCount, c.totalSpend, c.notes]);
        return { csv: toCsv(['S.No','Customer ID','Created','Name','Phone','Age Group','Category Preferences','Spend Bracket','Birthday Month','Last Visit','# Visits','Lifetime Spend (₹)','Notes'], rows), filename: `TH_customers_${Date.now()}.csv` };
      }
      case 'performance': {
        const rows = all.performance.map((p, i) => [i + 1, p.id, p.date, p.bills, p.units, p.asp, p.atv, p.upt]);
        return { csv: toCsv(['S.No','Entry ID','Date','Bills','Units','ASP (₹)','ATV (₹)','UPT'], rows), filename: `TH_performance_${Date.now()}.csv` };
      }
      case 'competitors': {
        const rows = all.competitors.map((c, i) => [i + 1, c.id, new Date(c.createdAt).toLocaleString('en-IN'), c.storeName, c.visitDate, c.vmScore, c.staffScore, c.productRangeScore, c.footfall, c.pricePoint, c.observation]);
        return { csv: toCsv(['S.No','Visit ID','Logged','Store','Visit Date','VM Score','Staff Score','Product Range Score','Footfall','Price vs TH','Key Observation'], rows), filename: `TH_competitors_${Date.now()}.csv` };
      }
      case 'deadHours': {
        const rows = all.deadHours.map((d, i) => {
          const conv = d.footfall ? ((d.bills / d.footfall) * 100).toFixed(1) + '%' : '—';
          return [i + 1, d.id, d.date, `${d.hour}:00`, d.footfall, d.bills, conv, d.activation];
        });
        return { csv: toCsv(['S.No','Entry ID','Date','Hour','Footfall','Bills','Conversion %','Activation Tried'], rows), filename: `TH_deadhours_${Date.now()}.csv` };
      }
      case 'fieldNotes': {
        const rows = all.fieldNotes.map((n, i) => [i + 1, n.id, new Date(n.createdAt).toLocaleString('en-IN'), n.date, n.observation, n.idea, n.anomaly]);
        return { csv: toCsv(['S.No','Note ID','Logged','Date','Observation','Idea','Anomaly'], rows), filename: `TH_fieldnotes_${Date.now()}.csv` };
      }
      case 'pipeline': {
        const rows = all.pipeline.map((l, i) => [i + 1, l.id, new Date(l.createdAt).toLocaleString('en-IN'), l.company, l.contact, l.designation, l.requirement, l.estValue, l.status, l.notes]);
        return { csv: toCsv(['S.No','Lead ID','Logged','Company','Contact Person','Designation','Requirement','Estimated Value (₹)','Status','Notes'], rows), filename: `TH_pipeline_${Date.now()}.csv` };
      }
      case 'all': {
        const bundle: string[] = [];
        for (const k of ['surveys','customers','performance','competitors','deadHours','fieldNotes','pipeline'] as const) {
          const { csv } = await buildCSVFor(k);
          bundle.push(`===== ${k.toUpperCase()} =====\n${csv}\n`);
        }
        return { csv: bundle.join('\n'), filename: `TH_everything_${Date.now()}.csv` };
      }
      default:
        return { csv: '', filename: 'empty.csv' };
    }
  };

  const shareCSV = async (kind: string) => {
    const { csv, filename } = await buildCSVFor(kind);
    if (!csv) { Alert.alert('Nothing to export', 'No data in this dataset yet.'); return; }
    try {
      if (Platform.OS === 'web') {
        // Try native Web Share API first (works on mobile browsers, iPads)
        const nav: any = typeof navigator !== 'undefined' ? navigator : null;
        if (nav?.share && nav?.canShare) {
          try {
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const file = new File([blob], filename, { type: 'text/csv' });
            if (nav.canShare({ files: [file] })) {
              await nav.share({ files: [file], title: filename, text: 'TH Field Intelligence export' });
              return;
            }
          } catch { /* user cancelled or unsupported — fall through to download */ }
        }
        // Fallback: download + copy-to-clipboard offer
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
        Alert.alert('Downloaded', `${filename}\n\nOpen in Excel / Google Sheets, or drop into WhatsApp, Email, Drive, etc.`);
        return;
      }
      const dir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory;
      const path = `${dir}${filename}`;
      await FileSystem.writeAsStringAsync(path, csv);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: `Share ${filename}`, UTI: 'public.comma-separated-values-text' });
      } else {
        Alert.alert('Saved', `File saved to ${path}`);
      }
    } catch (e: any) {
      Alert.alert('Export failed', e.message || String(e));
    }
  };

  const copyCSV = async (kind: string) => {
    const { csv } = await buildCSVFor(kind);
    if (!csv) { Alert.alert('Nothing to export'); return; }
    await Clipboard.setStringAsync(csv);
    Alert.alert('Copied', `${kind} CSV copied to clipboard.`);
  };

  const shareReport = async () => {
    try {
      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(weeklyReport);
        Alert.alert('Copied', 'Report copied to clipboard.');
        return;
      }
      const dir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory;
      const path = `${dir}TH_weekly_report_${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(path, weeklyReport);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(path);
    } catch (e: any) { Alert.alert('Share failed', e.message); }
  };

  const DATASETS: { key: string; label: string; icon: any }[] = [
    { key: 'surveys', label: 'Consumer Surveys', icon: 'document-text' },
    { key: 'customers', label: 'Customer Database', icon: 'people' },
    { key: 'performance', label: 'My Performance', icon: 'trending-up' },
    { key: 'competitors', label: 'Competitor Visits', icon: 'git-compare' },
    { key: 'deadHours', label: 'Dead Hours', icon: 'time' },
    { key: 'fieldNotes', label: 'Field Notes', icon: 'book' },
    { key: 'pipeline', label: 'B2B Pipeline', icon: 'briefcase' },
  ];

  return (
    <ScreenWrap>
      <Card>
        <SectionTitle title="Summary" />
        <Text style={[font.h2, { color: colors.navy }]}>{surveys.length} Surveys</Text>
        <Text style={{ color: colors.textSecondary }}>NPS {nps.score} · Top word "{topW}" · {weekly.length} this week</Text>
      </Card>

      <Card>
        <SectionTitle title="Export Everything" subtitle="All 7 datasets in a single CSV bundle" />
        <View style={{ gap: 8 }}>
          <PrimaryButton label="Share All Data" icon="share" variant="accent" onPress={() => shareCSV('all')} testID="export-all-share" />
          <PrimaryButton label="Copy All (CSV)" icon="copy" variant="outline" onPress={() => copyCSV('all')} testID="export-all-copy" />
        </View>
      </Card>

      <Card>
        <SectionTitle title="Export Individual Dataset" subtitle="Tap any dataset below" />
        {DATASETS.map(d => (
          <View key={d.key} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[font.h3, { color: colors.navy }]}>{d.label}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{counts[d.key] ?? 0} record{(counts[d.key] ?? 0) === 1 ? '' : 's'}</Text>
            </View>
            <PrimaryButton label="Share" icon="share-social" onPress={() => shareCSV(d.key)} testID={`export-${d.key}-share`} style={{ paddingHorizontal: 14, minHeight: 42 }} />
          </View>
        ))}
      </Card>

      <Card>
        <SectionTitle title="Weekly Report" subtitle="Auto-summary" />
        <View style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 13, lineHeight: 20 }}>{weeklyReport}</Text>
        </View>
        <PrimaryButton label="Share Report" icon="share-social" onPress={shareReport} testID="share-report" style={{ marginTop: 10 }} />
      </Card>

      <Card>
        <SectionTitle title="Where is my data stored?" />
        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
          All your data is stored <Text style={{ fontWeight: '800', color: colors.navy }}>locally on this device</Text> using AsyncStorage — nothing is sent to any server except when you tap "Generate AI Insights". Uninstalling the app or clearing browser data will wipe everything.
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 6 }}>
          <Text style={{ fontWeight: '800' }}>Recommendation</Text>: Use "Share All Data" above weekly and save the CSV to email or Drive as a backup.
        </Text>
      </Card>
    </ScreenWrap>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
});
