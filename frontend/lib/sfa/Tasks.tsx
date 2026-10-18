import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';
import { Card, ScreenWrap, PrimaryButton, Input, EmptyState, SectionTitle } from '../ui';
import { showAlert } from '../alert';
import { store } from '../storage';
import type { SfaTask } from '../types';
import { PillRow } from './Sheet';
import { addDays, dueLabel, newId, sfaMetrics, DUE_PRESETS } from './helpers';

export default function SfaTasks({ tasks }: { tasks: SfaTask[] }) {
  const [title, setTitle] = useState('');
  const [contact, setContact] = useState('');
  const [due, setDue] = useState<string>('Today');
  const [high, setHigh] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const m = sfaMetrics([], tasks, []);

  const add = async () => {
    if (!title.trim()) { showAlert('Missing', 'What do you need to do?'); return; }
    const preset = DUE_PRESETS.find(p => p.label === due) || DUE_PRESETS[0];
    await store.addSfaTask({
      id: newId('task'), createdAt: new Date().toISOString(), title: title.trim(),
      due: addDays(preset.days), done: false, contactName: contact.trim(), priority: high ? 'High' : 'Normal',
    });
    setTitle(''); setContact(''); setHigh(false);
  };

  const sections: { title: string; items: SfaTask[] }[] = [
    { title: `Overdue · ${m.overdueTasks.length}`, items: m.overdueTasks },
    { title: `Today · ${m.todayTasks.length}`, items: m.todayTasks },
    { title: `Upcoming · ${m.upcomingTasks.length}`, items: m.upcomingTasks },
  ];

  return (
    <ScreenWrap>
      <Card>
        <Input placeholder="e.g. Call Rahul about wedding fit" value={title} onChangeText={setTitle} testID="task-title" onSubmitEditing={add} />
        <Input placeholder="Contact (optional)" value={contact} onChangeText={setContact} testID="task-contact" />
        <PillRow options={DUE_PRESETS.map(p => p.label)} value={due} onChange={setDue} testIDPrefix="task-due" />
        <TouchableOpacity onPress={() => setHigh(h => !h)} style={styles.priority} testID="task-priority">
          <Ionicons name={high ? 'flag' : 'flag-outline'} size={16} color={colors.navy} />
          <Text style={styles.meta}>{high ? 'High priority' : 'Normal priority'}</Text>
        </TouchableOpacity>
        <PrimaryButton label="Add Task" icon="add" onPress={add} testID="add-task-btn" />
      </Card>

      {tasks.length === 0 && <EmptyState icon="checkbox-outline" title="No tasks yet" body="Plan follow-ups, alteration pick-ups and VIP calls here." />}

      {sections.map(s => s.items.length > 0 && (
        <View key={s.title} style={{ gap: spacing.sm }}>
          <SectionTitle title={s.title} />
          {sortTasks(s.items).map(t => <TaskRow key={t.id} task={t} />)}
        </View>
      ))}

      {m.doneTasks.length > 0 && (
        <TouchableOpacity onPress={() => setShowDone(v => !v)} testID="toggle-done-tasks">
          <SectionTitle title={`Completed · ${m.doneTasks.length}`} right={<Ionicons name={showDone ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />} />
        </TouchableOpacity>
      )}
      {showDone && m.doneTasks.map(t => <TaskRow key={t.id} task={t} />)}
    </ScreenWrap>
  );
}

const sortTasks = (l: SfaTask[]) =>
  [...l].sort((a, b) => (a.priority === b.priority ? a.due.localeCompare(b.due) : a.priority === 'High' ? -1 : 1));

export const TaskRow: React.FC<{ task: SfaTask }> = ({ task: t }) => {
  const overdue = !t.done && t.due < addDays(0);
  return (
    <View style={styles.taskRow} testID={`task-${t.id}`}>
      <TouchableOpacity
        onPress={() => store.updateSfaTask(t.id, { done: !t.done })}
        style={[styles.check, t.done && styles.checkOn]}
        testID={`task-toggle-${t.id}`}
        accessibilityLabel={t.done ? 'Mark as not done' : 'Mark as done'}
      >
        {t.done && <Ionicons name="checkmark" size={16} color={colors.onFill} />}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, t.done && styles.doneText]}>{t.priority === 'High' ? '⚑ ' : ''}{t.title}</Text>
        <Text style={[styles.meta, overdue && { color: colors.npsRed }]}>
          {dueLabel(t.due)}{t.contactName ? ` · ${t.contactName}` : ''}
        </Text>
      </View>
      <TouchableOpacity onPress={() => store.deleteSfaTask(t.id)} style={styles.del} testID={`task-delete-${t.id}`} accessibilityLabel="Delete task">
        <Ionicons name="close" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  priority: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36 },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  check: { width: 26, height: 26, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.fill },
  title: { fontSize: 16, fontWeight: '500', color: colors.navy },
  doneText: { textDecorationLine: 'line-through', color: colors.textMuted },
  meta: { fontSize: 14, color: colors.textSecondary },
  del: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
