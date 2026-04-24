import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, shadow } from '../../lib/theme';
import { PrimaryButton } from '../../lib/ui';

export default function SurveySuccess() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  return (
    <View style={styles.root}>
      <View style={styles.badge}>
        <Ionicons name="checkmark" size={56} color={colors.white} />
      </View>
      <Text style={styles.title}>Survey Submitted</Text>
      <Text style={styles.sub}>Thank you. Your response has been saved.</Text>
      {!!id && (
        <View style={styles.idChip}>
          <Text style={styles.idCaption}>SURVEY ID</Text>
          <Text style={styles.idValue}>{id}</Text>
        </View>
      )}
      <View style={{ gap: 12, width: '100%', maxWidth: 420, marginTop: 20 }}>
        <PrimaryButton label="Start Another Survey" icon="add-circle" variant="accent" onPress={() => router.replace('/survey/new')} testID="success-new" />
        <PrimaryButton label="Go to Home" icon="home" variant="primary" onPress={() => router.replace('/')} testID="success-home" />
        <PrimaryButton label="View All Responses" icon="list" variant="outline" onPress={() => router.replace('/responses')} testID="success-responses" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  badge: {
    width: 104, height: 104, borderRadius: 52, backgroundColor: colors.npsGreen,
    alignItems: 'center', justifyContent: 'center', ...shadow.elevated, marginBottom: 8,
  },
  title: { ...font.h1, color: colors.navy, textAlign: 'center' },
  sub: { color: colors.textSecondary, fontSize: 15, textAlign: 'center', maxWidth: 360 },
  idChip: {
    marginTop: 16, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: radius.pill, backgroundColor: colors.white, alignItems: 'center', gap: 2,
    borderWidth: 1, borderColor: colors.border,
  },
  idCaption: { fontSize: 10, fontWeight: '800', color: colors.textSecondary, letterSpacing: 1 },
  idValue: { fontSize: 16, fontWeight: '800', color: colors.red },
});
