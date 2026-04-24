import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, shadow } from '../lib/theme';
import { Card, ScreenWrap, PrimaryButton, Input, SectionTitle, Stat, EmptyState, Chip } from '../lib/ui';
import { BarChart } from '../lib/charts';
import { store } from '../lib/storage';
import { JOG_SLAB_AMOUNTS, type JogPromoEntry } from '../lib/types';

const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtINR = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function JogPromo() {
  const [entries, setEntries] = useState<JogPromoEntry[]>([]);
  const [date, setDate] = useState(todayISO());
  const [saleThroughJog, setSaleThroughJog] = useState('');
  const [offersRedeemed, setOffersRedeemed] = useState('');
  const [slab1, setSlab1] = useState('');
  const [slab2, setSlab2] = useState('');
  const [slab3, setSlab3] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => setEntries(await store.getJogEntries()), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totals = useMemo(() => entries.reduce((t, e) => ({
    sale: t.sale + (e.saleThroughJog || 0),
    redeemed: t.redeemed + (e.offersRedeemed || 0),
    s1: t.s1 + (e.slab1 || 0),
    s2: t.s2 + (e.slab2 || 0),
    s3: t.s3 + (e.slab3 || 0),
  }), { sale: 0, redeemed: 0, s1: 0, s2: 0, s3: 0 }), [entries]);

  const slabValue =
    totals.s1 * JOG_SLAB_AMOUNTS.slab1 +
    totals.s2 * JOG_SLAB_AMOUNTS.slab2 +
    totals.s3 * JOG_SLAB_AMOUNTS.slab3;

  const save = async () => {
    const s = parseFloat(saleThroughJog) || 0;
    const r = parseFloat(offersRedeemed) || 0;
    const s1 = parseInt(slab1) || 0;
    const s2 = parseInt(slab2) || 0;
    const s3 = parseInt(slab3) || 0;
    if (!s && !r && !s1 && !s2 && !s3) { Alert.alert('Nothing to save', 'Fill at least one field.'); return; }
    await store.addJogEntry({
      id: `jog-${Date.now()}`,
      createdAt: new Date().toISOString(),
      date,
      saleThroughJog: s, offersRedeemed: r,
      slab1: s1, slab2: s2, slab3: s3,
      notes: notes.trim(),
    });
    setSaleThroughJog(''); setOffersRedeemed(''); setSlab1(''); setSlab2(''); setSlab3(''); setNotes('');
    load();
  };

  const del = (id: string) => {
    const doIt = async () => { await store.deleteJogEntry(id); load(); };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Delete this entry?')) doIt();
    } else {
      Alert.alert('Delete', 'Remove this entry?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doIt },
      ]);
    }
  };

  return (
    <ScreenWrap>
      <Card>
        <SectionTitle title="JOG Promo · Totals" subtitle={`${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Stat label="Sales via JOG" value={fmtINR(totals.sale)} accent={colors.navy} testID="jog-total-sale" />
          <Stat label="Offers Redeemed" value={totals.redeemed} accent={colors.red} testID="jog-total-redeem" />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Stat label="Implied Slab ₹" value={fmtINR(slabValue)} accent={colors.gold} testID="jog-slab-value" />
          <Stat label="Total Redemptions" value={totals.s1 + totals.s2 + totals.s3} testID="jog-slab-count" />
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <Chip label={`Slab 1 (₹7,999) · ${totals.s1}`} tone="muted" small />
          <Chip label={`Slab 2 (₹13,999) · ${totals.s2}`} tone="muted" small />
          <Chip label={`Slab 3 (₹24,999) · ${totals.s3}`} tone="muted" small />
        </View>

        <BarChart
          data={[
            { label: 'Slab 1\n₹7,999', value: totals.s1, color: colors.npsGreen },
            { label: 'Slab 2\n₹13,999', value: totals.s2, color: colors.gold },
            { label: 'Slab 3\n₹24,999', value: totals.s3, color: colors.red },
          ]}
          height={160}
        />
      </Card>

      <Card>
        <SectionTitle title="Log JOG Redemptions" subtitle="Entry per day / session" />
        <Input label="Date" value={date} onChangeText={setDate} testID="jog-date" />
        <Input label="Sale through JOG (₹)" value={saleThroughJog} onChangeText={setSaleThroughJog} keyboardType="numeric" testID="jog-sale" />
        <Input label="Total offers redeemed (count)" value={offersRedeemed} onChangeText={setOffersRedeemed} keyboardType="numeric" testID="jog-redeem" />

        <Text style={styles.slabHdr}>Redemptions by slab</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Input label="Slab 1 (₹7,999)" value={slab1} onChangeText={setSlab1} keyboardType="numeric" testID="jog-slab1" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Slab 2 (₹13,999)" value={slab2} onChangeText={setSlab2} keyboardType="numeric" testID="jog-slab2" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Slab 3 (₹24,999)" value={slab3} onChangeText={setSlab3} keyboardType="numeric" testID="jog-slab3" />
          </View>
        </View>
        <Input label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={2} testID="jog-notes" />
        <PrimaryButton label="Save Entry" variant="accent" icon="add-circle" onPress={save} testID="jog-save" />
      </Card>

      <SectionTitle title="History" />
      {entries.length === 0 ? (
        <Card><EmptyState icon="pricetag-outline" title="No JOG entries" body="Log redemptions to track slab performance." /></Card>
      ) : entries.map(e => (
        <Card key={e.id} testID={`jog-${e.id}`}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[font.h3, { color: colors.navy }]}>{e.date}</Text>
            <TouchableOpacity onPress={() => del(e.id)}>
              <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={styles.rowKey}>Sale via JOG</Text>
            <Text style={styles.rowVal}>{fmtINR(e.saleThroughJog)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.rowKey}>Offers redeemed</Text>
            <Text style={styles.rowVal}>{e.offersRedeemed}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Chip label={`S1 × ${e.slab1}`} tone="muted" small />
            <Chip label={`S2 × ${e.slab2}`} tone="muted" small />
            <Chip label={`S3 × ${e.slab3}`} tone="muted" small />
          </View>
          {!!e.notes && <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>{e.notes}</Text>}
        </Card>
      ))}
    </ScreenWrap>
  );
}

const styles = StyleSheet.create({
  slabHdr: { fontSize: 12, color: colors.textSecondary, fontWeight: '800', letterSpacing: 0.5, marginTop: 6 },
  rowKey: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  rowVal: { color: colors.navy, fontSize: 14, fontWeight: '800' },
});
