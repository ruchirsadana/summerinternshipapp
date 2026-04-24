import React, { useCallback, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors } from '../lib/theme';
import { Card, ScreenWrap, PrimaryButton, Input, SectionTitle } from '../lib/ui';
import { store } from '../lib/storage';
import type { Settings } from '../lib/types';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings | null>(null);
  useFocusEffect(useCallback(() => { store.getSettings().then(setSettings); }, []));

  if (!settings) return null;

  const save = async () => {
    await store.setSettings(settings);
    Alert.alert('Saved', 'Your settings have been updated.');
  };

  return (
    <ScreenWrap>
      <Card>
        <SectionTitle title="Profile" />
        <Input label="Your Name" value={settings.internName} onChangeText={v => setSettings({ ...settings, internName: v })} testID="set-name" />
        <Input label="Store Name" value={settings.storeName} onChangeText={v => setSettings({ ...settings, storeName: v })} testID="set-store" />
        <Input label="Target Surveys" value={String(settings.target)} onChangeText={v => setSettings({ ...settings, target: parseInt(v, 10) || 150 })} keyboardType="numeric" testID="set-target" />
        <Input label="Internship Start Date (YYYY-MM-DD)" value={settings.startDate} onChangeText={v => setSettings({ ...settings, startDate: v })} testID="set-start" />
        <PrimaryButton label="Save Settings" variant="accent" onPress={save} testID="set-save" />
      </Card>
      <Card>
        <SectionTitle title="About" />
        <Text style={{ color: colors.textSecondary }}>TH Growth Intelligence · Offline-first · All data stored locally on device. Tap Export to back up anytime.</Text>
      </Card>
    </ScreenWrap>
  );
}
