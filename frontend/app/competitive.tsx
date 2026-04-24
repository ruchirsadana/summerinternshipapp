import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, font } from '../lib/theme';
import { Card, ScreenWrap, PrimaryButton, Input, RadioGroup, SectionTitle, StarRating, EmptyState } from '../lib/ui';
import { BarChart } from '../lib/charts';
import { store } from '../lib/storage';
import type { CompetitorVisit } from '../lib/types';

const STORES = ['Hugo Boss', 'Calvin Klein', 'Massimo Dutti', 'Zara', 'Ralph Lauren'] as const;
const FOOTFALL = ['Low', 'Medium', 'High'] as const;
const PRICE = ['Higher', 'Similar', 'Lower'] as const;

export default function Competitive() {
  const [visits, setVisits] = useState<CompetitorVisit[]>([]);
  const [store_, setStore_] = useState<typeof STORES[number] | ''>('');
  const [vm, setVm] = useState(0);
  const [staff, setStaff] = useState(0);
  const [range, setRange] = useState(0);
  const [ff, setFf] = useState<typeof FOOTFALL[number] | ''>('');
  const [pr, setPr] = useState<typeof PRICE[number] | ''>('');
  const [obs, setObs] = useState('');

  const load = useCallback(async () => setVisits(await store.getCompetitors()), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    if (!store_ || !ff || !pr) return;
    await store.addCompetitor({
      id: `cv-${Date.now()}`, createdAt: new Date().toISOString(), storeName: store_,
      visitDate: new Date().toISOString().slice(0, 10), vmScore: vm, staffScore: staff, productRangeScore: range,
      footfall: ff, pricePoint: pr, observation: obs,
    });
    setStore_(''); setVm(0); setStaff(0); setRange(0); setFf(''); setPr(''); setObs('');
    load();
  };

  // compare table
  const byStore = new Map<string, { vm: number; staff: number; range: number; n: number }>();
  visits.forEach(v => {
    const cur = byStore.get(v.storeName) || { vm: 0, staff: 0, range: 0, n: 0 };
    byStore.set(v.storeName, { vm: cur.vm + v.vmScore, staff: cur.staff + v.staffScore, range: cur.range + v.productRangeScore, n: cur.n + 1 });
  });

  return (
    <ScreenWrap>
      <Card>
        <SectionTitle title="Log Competitor Visit" />
        <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '700', marginTop: 8 }}>Store</Text>
        <RadioGroup options={STORES} value={store_} onChange={setStore_} testIDPrefix="cv-store" columns={2} />
        <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '700', marginTop: 12 }}>VM Score</Text>
        <StarRating value={vm} onChange={setVm} testID="cv-vm" />
        <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '700', marginTop: 12 }}>Staff Score</Text>
        <StarRating value={staff} onChange={setStaff} testID="cv-staff" />
        <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '700', marginTop: 12 }}>Product Range</Text>
        <StarRating value={range} onChange={setRange} testID="cv-range" />
        <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '700', marginTop: 12 }}>Footfall</Text>
        <RadioGroup options={FOOTFALL} value={ff} onChange={setFf} testIDPrefix="cv-ff" columns={3} />
        <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '700', marginTop: 12 }}>Price vs TH</Text>
        <RadioGroup options={PRICE} value={pr} onChange={setPr} testIDPrefix="cv-pr" columns={3} />
        <Input label="Key Observation" value={obs} onChangeText={setObs} multiline numberOfLines={3} testID="cv-obs" />
        <PrimaryButton label="Save Visit" variant="accent" onPress={save} testID="cv-save" />
      </Card>

      {byStore.size > 0 && (
        <Card>
          <SectionTitle title="Competitor Scorecard" subtitle="Average across visits" />
          {Array.from(byStore.entries()).map(([name, v]) => (
            <View key={name} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
              <Text style={{ ...font.h3, color: colors.navy }}>{name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                VM {(v.vm / v.n).toFixed(1)}★ · Staff {(v.staff / v.n).toFixed(1)}★ · Range {(v.range / v.n).toFixed(1)}★ · {v.n} visit{v.n > 1 ? 's' : ''}
              </Text>
            </View>
          ))}
        </Card>
      )}
      {visits.length === 0 && <Card><EmptyState icon="git-compare-outline" title="No competitor visits yet" body="Log your first observation above." /></Card>}
    </ScreenWrap>
  );
}
