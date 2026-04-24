import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, font } from '../lib/theme';
import { Card, ScreenWrap, PrimaryButton, Input, SectionTitle, EmptyState } from '../lib/ui';
import { store } from '../lib/storage';
import type { FieldNote } from '../lib/types';

export default function FieldNotes() {
  const [list, setList] = useState<FieldNote[]>([]);
  const [obs, setObs] = useState(''); const [idea, setIdea] = useState(''); const [anom, setAnom] = useState('');

  const load = useCallback(async () => setList(await store.getFieldNotes()), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    if (!obs && !idea && !anom) return;
    await store.addFieldNote({
      id: `fn-${Date.now()}`, createdAt: new Date().toISOString(),
      date: new Date().toISOString().slice(0, 10),
      observation: obs, idea, anomaly: anom,
    });
    setObs(''); setIdea(''); setAnom(''); load();
  };

  return (
    <ScreenWrap>
      <Card>
        <SectionTitle title="Captain's Log" subtitle="30 seconds · 3 fields" />
        <Input label="Observation" value={obs} onChangeText={setObs} multiline numberOfLines={2} testID="fn-obs" />
        <Input label="Idea" value={idea} onChangeText={setIdea} multiline numberOfLines={2} testID="fn-idea" />
        <Input label="Anomaly" value={anom} onChangeText={setAnom} multiline numberOfLines={2} testID="fn-anom" />
        <PrimaryButton label="Save Note" variant="accent" onPress={save} testID="fn-save" />
      </Card>

      {list.length === 0 && <Card><EmptyState icon="book-outline" title="Start your log" body="One observation a day builds a goldmine." /></Card>}
      {list.map(n => (
        <Card key={n.id} testID={`fn-${n.id}`}>
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>{new Date(n.createdAt).toLocaleString()}</Text>
          {!!n.observation && <LogRow label="OBSERVATION" text={n.observation} color={colors.navy} />}
          {!!n.idea && <LogRow label="IDEA" text={n.idea} color={colors.red} />}
          {!!n.anomaly && <LogRow label="ANOMALY" text={n.anomaly} color={colors.gold} />}
        </Card>
      ))}
    </ScreenWrap>
  );
}

const LogRow = ({ label, text, color }: { label: string; text: string; color: string }) => (
  <View style={{ marginTop: 8 }}>
    <Text style={{ color, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>{label}</Text>
    <Text style={{ color: colors.textPrimary, fontSize: 14, marginTop: 2 }}>{text}</Text>
  </View>
);
