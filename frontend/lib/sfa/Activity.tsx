import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';
import { Card, ScreenWrap, PrimaryButton, Input, EmptyState, SectionTitle } from '../ui';
import { showAlert } from '../alert';
import { store } from '../storage';
import { SFA_ACTIVITY_TYPES, type SfaActivity, type SfaActivityType } from '../types';
import { PillRow } from './Sheet';
import { newId, relTime } from './helpers';

export const ACTIVITY_ICON: Record<SfaActivityType, React.ComponentProps<typeof Ionicons>['name']> = {
  Call: 'call-outline', WhatsApp: 'logo-whatsapp', Visit: 'walk-outline', 'Walk-in': 'storefront-outline', Email: 'mail-outline',
};

export default function SfaActivityLog({ activities }: { activities: SfaActivity[] }) {
  const [type, setType] = useState<SfaActivityType>('Call');
  const [contact, setContact] = useState('');
  const [note, setNote] = useState('');

  const log = async () => {
    if (!contact.trim() && !note.trim()) { showAlert('Missing', 'Add who you spoke to or a quick note.'); return; }
    await store.addSfaActivity({
      id: newId('act'), createdAt: new Date().toISOString(), type, contactName: contact.trim(), note: note.trim(),
    });
    setContact(''); setNote('');
  };

  const counts = SFA_ACTIVITY_TYPES.map(t => ({ t, n: activities.filter(a => a.type === t).length }));

  return (
    <ScreenWrap>
      <Card>
        <PillRow options={SFA_ACTIVITY_TYPES} value={type} onChange={setType} testIDPrefix="act-type" />
        <Input placeholder="Contact name" value={contact} onChangeText={setContact} testID="act-contact" />
        <Input placeholder="What happened? e.g. Liked navy polo, coming Sat" value={note} onChangeText={setNote} multiline testID="act-note" />
        <PrimaryButton label={`Log ${type}`} icon="add" onPress={log} testID="log-activity-btn" />
      </Card>

      <View style={styles.counts}>
        {counts.map(c => (
          <View key={c.t} style={styles.countCell}>
            <Text style={styles.countN}>{c.n}</Text>
            <Text style={styles.countL}>{c.t}</Text>
          </View>
        ))}
      </View>

      <SectionTitle title={`Timeline · ${activities.length}`} />
      {activities.length === 0 && <EmptyState icon="pulse-outline" title="No activity logged" body="Every call, WhatsApp and visit you log builds your personal sales history." />}
      {activities.map(a => <ActivityRow key={a.id} activity={a} onDelete={() => store.deleteSfaActivity(a.id)} />)}
    </ScreenWrap>
  );
}

export const ActivityRow: React.FC<{ activity: SfaActivity; onDelete?: () => void }> = ({ activity: a, onDelete }) => (
  <View style={styles.row} testID={`activity-${a.id}`}>
    <View style={styles.icon}><Ionicons name={ACTIVITY_ICON[a.type]} size={18} color={colors.navy} /></View>
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>{a.type}{a.contactName ? ` · ${a.contactName}` : ''}</Text>
      {!!a.note && <Text style={styles.meta}>{a.note}</Text>}
      <Text style={styles.time}>{relTime(a.createdAt)}</Text>
    </View>
    {onDelete && (
      <TouchableOpacity onPress={onDelete} style={styles.del} testID={`activity-delete-${a.id}`} accessibilityLabel="Delete activity">
        <Ionicons name="close" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  counts: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  countCell: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  countN: { fontSize: 20, fontWeight: '500', color: colors.navy },
  countL: { fontSize: 12, color: colors.textSecondary },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'flex-start' },
  icon: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.mist, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '500', color: colors.navy },
  meta: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  time: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  del: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
