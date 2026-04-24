import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors } from '../lib/theme';
import { Card, ScreenWrap, PrimaryButton, Input, SectionTitle, EmptyState } from '../lib/ui';
import { Heatmap } from '../lib/charts';
import { store } from '../lib/storage';
import { conversionPerHour } from '../lib/analytics';
import type { DeadHourEntry } from '../lib/types';

export default function DeadHours() {
  const [list, setList] = useState<DeadHourEntry[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hour, setHour] = useState('14');
  const [foot, setFoot] = useState(''); const [bills, setBills] = useState(''); const [act, setAct] = useState('');

  const load = useCallback(async () => setList(await store.getDeadHours()), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    if (!foot) return;
    await store.addDeadHour({
      id: `h-${Date.now()}`, date, hour: parseInt(hour, 10) || 10,
      footfall: parseInt(foot, 10) || 0, bills: parseInt(bills, 10) || 0, activation: act,
    });
    setFoot(''); setBills(''); setAct(''); load();
  };

  const hourly = conversionPerHour(list);
  const peak = hourly.reduce((a, b) => (b.footfall > a.footfall ? b : a), hourly[0] || { hour: 0, footfall: 0, conv: 0, bills: 0 });

  return (
    <ScreenWrap>
      <Card>
        <SectionTitle title="Log Hour" subtitle="10am – 10pm slots" />
        <Input label="Date" value={date} onChangeText={setDate} testID="dh-date" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Input label="Hour (10-22)" value={hour} onChangeText={setHour} keyboardType="numeric" testID="dh-hour" /></View>
          <View style={{ flex: 1 }}><Input label="Footfall" value={foot} onChangeText={setFoot} keyboardType="numeric" testID="dh-foot" /></View>
          <View style={{ flex: 1 }}><Input label="Bills" value={bills} onChangeText={setBills} keyboardType="numeric" testID="dh-bills" /></View>
        </View>
        <Input label="Activation Tried" value={act} onChangeText={setAct} testID="dh-act" placeholder="e.g. Window display change" />
        <PrimaryButton label="Save Hour" variant="accent" onPress={save} testID="dh-save" />
      </Card>

      <Card>
        <SectionTitle title="Conversion Heatmap" subtitle="% bills ÷ footfall per hour" />
        <Heatmap cells={hourly.map(h => ({ hour: h.hour, value: h.conv }))} suffix="%" />
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 10 }}>
          🔥 Peak hour: {peak.hour}:00 · {peak.footfall} footfall · {peak.conv}% conversion
        </Text>
      </Card>

      {list.length === 0 && <Card><EmptyState icon="time-outline" title="No hourly logs yet" body="Add entries to see your peak & dead hours." /></Card>}
    </ScreenWrap>
  );
}
