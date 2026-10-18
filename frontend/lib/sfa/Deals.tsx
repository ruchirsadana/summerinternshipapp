import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';
import { Card, ScreenWrap, PrimaryButton, Input, EmptyState } from '../ui';
import { showAlert } from '../alert';
import { store } from '../storage';
import { SFA_STAGES, type SfaDeal, type SfaStage } from '../types';
import { Sheet, PillRow, FieldLabel } from './Sheet';
import { addDays, dueLabel, inr, isOpen, isOverdue, newId, DUE_PRESETS } from './helpers';

type Filter = 'Open' | SfaStage;
const FILTERS: Filter[] = ['Open', ...SFA_STAGES];

export default function SfaDeals({ deals }: { deals: SfaDeal[] }) {
  const [filter, setFilter] = useState<Filter>('Open');
  const [adding, setAdding] = useState(false);

  const list = useMemo(() => {
    const l = filter === 'Open' ? deals.filter(isOpen) : deals.filter(d => d.stage === filter);
    return [...l].sort((a, b) => (a.followUp || '9999').localeCompare(b.followUp || '9999'));
  }, [deals, filter]);
  const total = list.reduce((s, d) => s + d.value, 0);

  const setStage = (d: SfaDeal, stage: SfaStage) =>
    store.updateSfaDeal(d.id, { stage, closedAt: stage === 'Won' || stage === 'Lost' ? new Date().toISOString() : undefined });

  const remove = (d: SfaDeal) => showAlert('Delete deal', `Remove "${d.title}"?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => store.deleteSfaDeal(d.id) },
  ]);

  return (
    <>
      <ScreenWrap>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <PillRow options={FILTERS} value={filter} onChange={setFilter} testIDPrefix="deal-filter" />
        </ScrollView>
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>{list.length} {filter === 'Open' ? 'open' : filter.toLowerCase()} deal{list.length !== 1 ? 's' : ''}</Text>
          <Text style={styles.summaryValue} testID="deals-total">{inr(total)}</Text>
        </View>
        <PrimaryButton label="Add Deal" icon="add" onPress={() => setAdding(true)} testID="add-deal-btn" />

        {list.length === 0 && <Card><EmptyState icon="briefcase-outline" title="No deals here" body="Add a deal for a client you're nurturing — a wedding wardrobe, corporate gifting, a VIP preview." /></Card>}

        {list.map(d => (
          <Card key={d.id} testID={`deal-${d.id}`}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{d.title}</Text>
                <Text style={styles.meta}>{d.contactName || 'No contact'}{d.phone ? ` · ${d.phone}` : ''}</Text>
              </View>
              <Text style={styles.value}>{inr(d.value)}</Text>
            </View>
            {!!d.followUp && isOpen(d) && (
              <View style={styles.row}>
                <Ionicons name="calendar-outline" size={14} color={isOverdue(d.followUp) ? colors.npsRed : colors.textSecondary} />
                <Text style={[styles.meta, isOverdue(d.followUp) && { color: colors.npsRed }]}>Follow up · {dueLabel(d.followUp)}</Text>
              </View>
            )}
            {!!d.notes && <Text style={styles.meta}>{d.notes}</Text>}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <PillRow options={SFA_STAGES} value={d.stage} onChange={s => setStage(d, s)} testIDPrefix={`deal-stage-${d.id}`} />
            </ScrollView>
            <View style={styles.actions}>
              {!!d.phone && (
                <>
                  <IconBtn icon="call-outline" label="Call" onPress={() => Linking.openURL(`tel:${d.phone}`)} />
                  <IconBtn icon="logo-whatsapp" label="WhatsApp" onPress={() => Linking.openURL(`https://wa.me/91${d.phone.replace(/\D/g, '').slice(-10)}`)} />
                </>
              )}
              <View style={{ flex: 1 }} />
              <IconBtn icon="trash-outline" label="Delete" onPress={() => remove(d)} testID={`deal-delete-${d.id}`} />
            </View>
          </Card>
        ))}
      </ScreenWrap>
      <DealSheet open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

const IconBtn: React.FC<{ icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void; testID?: string }> =
  ({ icon, label, onPress, testID }) => (
    <TouchableOpacity onPress={onPress} style={styles.iconBtn} accessibilityLabel={label} testID={testID}>
      <Ionicons name={icon} size={18} color={colors.navy} />
    </TouchableOpacity>
  );

function DealSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [value, setValue] = useState('');
  const [stage, setStage] = useState<SfaStage>('Prospect');
  const [due, setDue] = useState<string>(DUE_PRESETS[1].label);
  const [notes, setNotes] = useState('');

  const save = async () => {
    if (!title.trim() && !contact.trim()) { showAlert('Missing details', 'Add a deal title or a contact name.'); return; }
    const preset = DUE_PRESETS.find(p => p.label === due);
    await store.addSfaDeal({
      id: newId('deal'), createdAt: new Date().toISOString(),
      title: title.trim() || `Deal with ${contact.trim()}`, contactName: contact.trim(), phone: phone.trim(),
      value: parseFloat(value.replace(/,/g, '')) || 0, stage,
      followUp: preset ? addDays(preset.days) : '', notes: notes.trim(),
    });
    setTitle(''); setContact(''); setPhone(''); setValue(''); setStage('Prospect'); setNotes('');
    onClose();
  };

  return (
    <Sheet open={open} title="New Deal" onClose={onClose} testID="deal-sheet">
      <Input label="Deal" placeholder="e.g. Wedding wardrobe – 4 shirts" value={title} onChangeText={setTitle} testID="deal-title" />
      <Input label="Contact name" value={contact} onChangeText={setContact} testID="deal-contact" />
      <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" testID="deal-phone" />
      <Input label="Expected value (₹)" value={value} onChangeText={setValue} keyboardType="numeric" testID="deal-value" />
      <FieldLabel>Stage</FieldLabel>
      <PillRow options={SFA_STAGES} value={stage} onChange={setStage} testIDPrefix="deal-new-stage" />
      <FieldLabel>Follow up</FieldLabel>
      <PillRow options={[...DUE_PRESETS.map(p => p.label), 'None']} value={due} onChange={setDue} testIDPrefix="deal-due" />
      <Input label="Notes" value={notes} onChangeText={setNotes} multiline testID="deal-notes" />
      <PrimaryButton label="Save Deal" onPress={save} testID="save-deal-btn" />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.sm },
  summaryLabel: { fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontSize: 24, fontWeight: '500', color: colors.navy },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '500', color: colors.navy },
  meta: { fontSize: 14, color: colors.textSecondary },
  value: { fontSize: 20, fontWeight: '500', color: colors.navy },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  iconBtn: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.mist, alignItems: 'center', justifyContent: 'center' },
});
