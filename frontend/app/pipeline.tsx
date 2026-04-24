import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, font, radius, shadow } from '../lib/theme';
import { Card, ScreenWrap, PrimaryButton, Input, RadioGroup, SectionTitle, EmptyState } from '../lib/ui';
import { store } from '../lib/storage';
import type { PipelineLead } from '../lib/types';

const REQS = ['Gifting', 'Bulk', 'Event'] as const;
const STATUSES: PipelineLead['status'][] = ['Prospect', 'Contacted', 'Proposal Sent', 'Closed'];

export default function Pipeline() {
  const [list, setList] = useState<PipelineLead[]>([]);
  const [company, setCompany] = useState(''); const [contact, setContact] = useState('');
  const [des, setDes] = useState(''); const [req, setReq] = useState<typeof REQS[number] | ''>('');
  const [val, setVal] = useState(''); const [notes, setNotes] = useState('');

  const load = useCallback(async () => setList(await store.getPipeline()), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    if (!company.trim()) return;
    await store.addLead({
      id: `l-${Date.now()}`, createdAt: new Date().toISOString(),
      company, contact, designation: des, requirement: req, estValue: parseFloat(val) || 0,
      status: 'Prospect', notes,
    });
    setCompany(''); setContact(''); setDes(''); setReq(''); setVal(''); setNotes(''); load();
  };

  const totalValue = list.reduce((s, l) => s + (l.status !== 'Closed' ? l.estValue : 0), 0);
  const closedValue = list.filter(l => l.status === 'Closed').reduce((s, l) => s + l.estValue, 0);

  const advance = async (l: PipelineLead) => {
    const idx = STATUSES.indexOf(l.status);
    const next = STATUSES[Math.min(STATUSES.length - 1, idx + 1)];
    await store.updateLead(l.id, { status: next }); load();
  };

  return (
    <ScreenWrap>
      <Card style={{ backgroundColor: colors.navy }}>
        <Text style={{ color: colors.gold, fontSize: 11, letterSpacing: 0.8, fontWeight: '800' }}>OPEN PIPELINE VALUE</Text>
        <Text style={{ color: colors.white, fontSize: 32, fontWeight: '800', marginTop: 4 }}>₹{totalValue.toLocaleString('en-IN')}</Text>
        <Text style={{ color: '#AAB5CE', fontSize: 13 }}>₹{closedValue.toLocaleString('en-IN')} closed · {list.length} leads total</Text>
      </Card>

      <Card>
        <SectionTitle title="Log New Lead" />
        <Input label="Company" value={company} onChangeText={setCompany} testID="lead-company" />
        <Input label="Contact" value={contact} onChangeText={setContact} testID="lead-contact" />
        <Input label="Designation" value={des} onChangeText={setDes} testID="lead-des" />
        <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '700' }}>Requirement</Text>
        <RadioGroup options={REQS} value={req} onChange={setReq} testIDPrefix="lead-req" columns={3} />
        <Input label="Estimated Value (₹)" value={val} onChangeText={setVal} keyboardType="numeric" testID="lead-val" />
        <Input label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={2} testID="lead-notes" />
        <PrimaryButton label="Save Lead" variant="accent" onPress={save} testID="lead-save" />
      </Card>

      {list.length === 0 && <Card><EmptyState icon="briefcase-outline" title="No leads yet" body="This is the only screen with rupees attached. Start logging." /></Card>}

      {list.map(l => (
        <TouchableOpacity key={l.id} activeOpacity={0.8} onPress={() => advance(l)} testID={`lead-${l.id}`}>
          <View style={styles.leadCard}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={[font.h3, { color: colors.navy }]}>{l.company}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{l.contact} · {l.designation}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{l.requirement || '—'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.gold, fontSize: 18, fontWeight: '800' }}>₹{l.estValue.toLocaleString('en-IN')}</Text>
                <View style={[styles.statusBadge, { backgroundColor: l.status === 'Closed' ? colors.npsGreen : colors.navy }]}>
                  <Text style={{ color: colors.white, fontSize: 10, fontWeight: '800' }}>{l.status.toUpperCase()}</Text>
                </View>
              </View>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 6 }}>Tap to advance stage →</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScreenWrap>
  );
}

const styles = StyleSheet.create({
  leadCard: { backgroundColor: colors.white, padding: 14, borderRadius: radius.lg, ...shadow.card },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, marginTop: 4 },
});
