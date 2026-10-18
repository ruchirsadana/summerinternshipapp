import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../theme';
import { webConstraint } from '../ui';

/** Full-screen form sheet used by all SFA "add" flows. */
export const Sheet: React.FC<{ open: boolean; title: string; onClose: () => void; children: React.ReactNode; testID?: string }> =
  ({ open, title, onClose, children, testID }) => {
    const insets = useSafeAreaInsets();
    return (
      <Modal visible={open} animationType="slide" onRequestClose={onClose}>
        <View style={{ flex: 1, backgroundColor: colors.white }} testID={testID}>
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.close} testID="sfa-sheet-close" accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={colors.navy} />
            </TouchableOpacity>
          </View>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[{ padding: spacing.md, gap: spacing.md, paddingBottom: insets.bottom + 40 }, webConstraint]}
            >
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  };

/** Pill option row (single select). */
export function PillRow<T extends string>({ options, value, onChange, testIDPrefix }: {
  options: readonly T[]; value: T | ''; onChange: (v: T) => void; testIDPrefix?: string;
}) {
  return (
    <View style={styles.pillRow}>
      {options.map(o => {
        const active = o === value;
        return (
          <TouchableOpacity
            key={o}
            onPress={() => onChange(o)}
            testID={testIDPrefix ? `${testIDPrefix}-${o}` : undefined}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>{o}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={styles.label}>{children}</Text>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white,
  },
  title: { fontSize: 24, fontWeight: '500', color: colors.navy },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.mist, alignItems: 'center', justifyContent: 'center' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 16, minHeight: 40, justifyContent: 'center', borderRadius: radius.pill,
    backgroundColor: colors.mist,
  },
  pillActive: { backgroundColor: colors.fill },
  pillText: { fontSize: 14, fontWeight: '500', color: colors.navy },
  pillTextActive: { color: colors.onFill },
  label: { fontSize: 12, fontWeight: '500', color: colors.textSecondary, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: -4 },
});
