import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, font } from '../lib/theme';
import { Card, ScreenWrap, PrimaryButton, Input, SectionTitle, EmptyState, Chip } from '../lib/ui';
import { LineChart } from '../lib/charts';
import { store } from '../lib/storage';
import { bestDay } from '../lib/analytics';
import type { PerformanceEntry } from '../lib/types';

export default function Performance() {
  const [list, setList] = useState<PerformanceEntry[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [bills, setBills] = useState(''); const [units, setUnits] = useState('');
  const [asp, setAsp] = useState(''); const [atv, setAtv] = useState(''); const [upt, setUpt] = useState('');

  const load = useCallback(async () => setList(await store.getPerformance()), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    const n = (v: string) => parseFloat(v) || 0;
    if (!bills && !units) return;
    await store.addPerformance({
      id: `p-${Date.now()}`, date, bills: n(bills), units: n(units), asp: n(asp), atv: n(atv), upt: n(upt),
    });
    setBills(''); setUnits(''); setAsp(''); setAtv(''); setUpt(''); load();
  };

  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
  const weekTotal = list.slice(0, 7).reduce((s, e) => s + e.bills, 0);
  const best = bestDay(list);

  return (
    <ScreenWrap>
      <Card>
        <SectionTitle title="Log Today's KPIs" />
        <Input label="Date" value={date} onChangeText={setDate} testID="perf-date" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Input label="Bills" value={bills} onChangeText={setBills} keyboardType="numeric" testID="perf-bills" /></View>
          <View style={{ flex: 1 }}><Input label="Units" value={units} onChangeText={setUnits} keyboardType="numeric" testID="perf-units" /></View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Input label="ASP (₹)" value={asp} onChangeText={setAsp} keyboardType="numeric" testID="perf-asp" /></View>
          <View style={{ flex: 1 }}><Input label="ATV (₹)" value={atv} onChangeText={setAtv} keyboardType="numeric" testID="perf-atv" /></View>
          <View style={{ flex: 1 }}><Input label="UPT" value={upt} onChangeText={setUpt} keyboardType="numeric" testID="perf-upt" /></View>
        </View>
        <PrimaryButton label="Save Entry" variant="accent" onPress={save} testID="perf-save" />
      </Card>

      {best && (
        <Card>
          <SectionTitle title="🏆 Personal Best Day" />
          <Text style={[font.h2, { color: colors.gold }]}>{best.date}</Text>
          <Text style={{ color: colors.textSecondary }}>ATV ₹{best.atv} · {best.bills} bills · {best.units} units</Text>
        </Card>
      )}

      <Card>
        <SectionTitle title="Weekly Totals" subtitle={`${weekTotal} bills in last 7 entries`} />
        <LineChart points={sorted.map(e => e.atv)} suffix="" stroke={colors.red} />
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>ATV trend</Text>
      </Card>

      {list.length === 0 ? (
        <Card><EmptyState icon="trending-up-outline" title="Start logging KPIs" body="Track bills, ATV and UPT to see trends." /></Card>
      ) : (
        <Card>
          <SectionTitle title="Recent Entries" />
          {list.slice(0, 10).map(e => (
            <View key={e.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
              <Text style={{ color: colors.navy, fontWeight: '700' }}>{e.date}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Bills {e.bills} · Units {e.units} · ASP ₹{e.asp} · ATV ₹{e.atv} · UPT {e.upt}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScreenWrap>
  );
}
