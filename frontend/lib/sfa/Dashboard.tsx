import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../theme';
import { ScreenWrap, SectionTitle, Stat, EmptyState } from '../ui';
import { openChat } from '../chatFab';
import { SFA_STAGES } from '../types';
import type { SfaData } from './useSfaData';
import { dueLabel, inr, sfaMetrics } from './helpers';
import { TaskRow } from './Tasks';
import { ActivityRow } from './Activity';

export type SfaSegment = 'Dashboard' | 'Contacts' | 'Deals' | 'Tasks' | 'Activity';

export default function SfaDashboard({ deals, tasks, activities, onNavigate }: SfaData & { onNavigate: (s: SfaSegment) => void }) {
  const m = sfaMetrics(deals, tasks, activities);
  const stageRows = SFA_STAGES.map(s => {
    const l = m.byStage(s);
    return { stage: s, count: l.length, value: l.reduce((a, d) => a + d.value, 0) };
  });
  const maxVal = Math.max(1, ...stageRows.map(r => r.value));
  const agenda = [...m.overdueTasks, ...m.todayTasks];

  return (
    <ScreenWrap>
      {/* Editorial dark hero */}
      <View style={styles.hero} testID="sfa-hero">
        <Text style={styles.heroCaption}>OPEN PIPELINE</Text>
        <Text style={styles.heroValue} testID="sfa-pipeline-value">{inr(m.pipeline)}</Text>
        <Text style={styles.heroSub}>
          Weighted forecast {inr(m.weighted)} · {m.open.length} open deal{m.open.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity style={styles.heroBtn} onPress={() => openChat('Plan my day')} testID="sfa-plan-day-btn">
          <Text style={styles.heroBtnText}>Plan my day with Assistant</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statRow}>
        <Stat label="WIN RATE" value={`${m.winRate}%`} testID="sfa-stat-winrate" />
        <Stat label="WON THIS MONTH" value={inr(m.wonThisMonth)} testID="sfa-stat-won" />
      </View>
      <View style={styles.statRow}>
        <Stat label="TASKS TODAY" value={m.todayTasks.length} testID="sfa-stat-today" />
        <Stat label="OVERDUE" value={m.overdueTasks.length + m.dueFollowUps.length} accent={m.overdueTasks.length ? colors.npsRed : undefined} testID="sfa-stat-overdue" />
      </View>

      <View style={styles.quickRow}>
        {(['Deals', 'Tasks', 'Activity'] as SfaSegment[]).map(s => (
          <TouchableOpacity key={s} onPress={() => onNavigate(s)} style={styles.quickBtn} testID={`sfa-quick-${s}`}>
            <Text style={styles.quickText}>+ {s === 'Activity' ? 'Log' : s.slice(0, -1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionTitle title="Pipeline by stage" />
      <View style={{ gap: 12 }}>
        {stageRows.map(r => (
          <View key={r.stage} testID={`sfa-stage-${r.stage}`}>
            <View style={styles.stageHead}>
              <Text style={styles.stageName}>{r.stage} · {r.count}</Text>
              <Text style={styles.stageVal}>{inr(r.value)}</Text>
            </View>
            <View style={styles.track}><View style={[styles.fill, { width: `${(r.value / maxVal) * 100}%` }]} /></View>
          </View>
        ))}
      </View>

      <SectionTitle title="Today's agenda" right={<Link label="All tasks" onPress={() => onNavigate('Tasks')} />} />
      {agenda.length === 0 && m.dueFollowUps.length === 0 && (
        <EmptyState icon="sunny-outline" title="You're all clear" body="No tasks or follow-ups due. Add one or ask the assistant." />
      )}
      {agenda.map(t => <TaskRow key={t.id} task={t} />)}
      {m.dueFollowUps.map(d => (
        <TouchableOpacity key={d.id} style={styles.followRow} onPress={() => onNavigate('Deals')} testID={`sfa-followup-${d.id}`}>
          <View style={{ flex: 1 }}>
            <Text style={styles.stageName}>Follow up · {d.contactName || d.title}</Text>
            <Text style={styles.meta}>{d.title} · {d.stage} · {dueLabel(d.followUp)}</Text>
          </View>
          <Text style={styles.stageVal}>{inr(d.value)}</Text>
        </TouchableOpacity>
      ))}

      <SectionTitle title="Recent activity" right={<Link label="See all" onPress={() => onNavigate('Activity')} />} />
      {activities.length === 0 && <Text style={styles.meta}>Nothing logged yet.</Text>}
      {activities.slice(0, 3).map(a => <ActivityRow key={a.id} activity={a} />)}
    </ScreenWrap>
  );
}

const Link: React.FC<{ label: string; onPress: () => void }> = ({ label, onPress }) => (
  <TouchableOpacity onPress={onPress} hitSlop={10}><Text style={styles.link}>{label}</Text></TouchableOpacity>
);

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.fill, padding: spacing.lg, gap: 8 },
  heroCaption: { color: colors.onFillMuted, fontSize: 12, fontWeight: '500', letterSpacing: 1 },
  heroValue: { color: colors.onFill, fontSize: 44, fontWeight: '500', lineHeight: 48, letterSpacing: -1 },
  heroSub: { color: colors.onFillMuted, fontSize: 14 },
  heroBtn: {
    alignSelf: 'flex-start', backgroundColor: colors.onFill, borderRadius: radius.pill,
    paddingHorizontal: 20, minHeight: 44, justifyContent: 'center', marginTop: 8,
  },
  heroBtnText: { color: colors.fill, fontSize: 16, fontWeight: '500' },
  statRow: { flexDirection: 'row', gap: 12 },
  quickRow: { flexDirection: 'row', gap: 8 },
  quickBtn: { flex: 1, minHeight: 44, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  quickText: { fontSize: 14, fontWeight: '500', color: colors.navy },
  stageHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  stageName: { fontSize: 16, fontWeight: '500', color: colors.navy },
  stageVal: { fontSize: 14, color: colors.textSecondary },
  track: { height: 6, backgroundColor: colors.mist },
  fill: { height: 6, backgroundColor: colors.fill },
  followRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  meta: { fontSize: 14, color: colors.textSecondary },
  link: { fontSize: 14, fontWeight: '500', color: colors.navy, textDecorationLine: 'underline' },
});
