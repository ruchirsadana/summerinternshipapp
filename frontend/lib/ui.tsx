import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, ViewStyle, TextStyle, StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, font } from './theme';

export const Card: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string }> =
  ({ children, style, testID }) => (
    <View testID={testID} style={[styles.card, style]}>{children}</View>
  );

export const SectionTitle: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode }> =
  ({ title, subtitle, right }) => (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.caption}>{title.toUpperCase()}</Text>
        {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );

export const PrimaryButton: React.FC<{
  label: string; onPress: () => void; loading?: boolean; disabled?: boolean;
  variant?: 'primary' | 'accent' | 'outline'; icon?: React.ComponentProps<typeof Ionicons>['name'];
  testID?: string; style?: StyleProp<ViewStyle>;
}> = ({ label, onPress, loading, disabled, variant = 'primary', icon, testID, style }) => {
  const bg = variant === 'primary' ? colors.navy : variant === 'accent' ? colors.red : 'transparent';
  const fg = variant === 'outline' ? colors.navy : colors.white;
  const borderColor = variant === 'outline' ? colors.navy : 'transparent';
  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.btn, { backgroundColor: bg, borderColor, borderWidth: variant === 'outline' ? 1.5 : 0, opacity: disabled ? 0.5 : 1 }, style]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon && <Ionicons name={icon} size={18} color={fg} />}
          <Text style={[styles.btnLabel, { color: fg }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const Input: React.FC<React.ComponentProps<typeof TextInput> & { label?: string }> = ({ label, style, ...rest }) => (
  <View style={{ gap: 6 }}>
    {!!label && <Text style={styles.inputLabel}>{label}</Text>}
    <TextInput
      placeholderTextColor={colors.textMuted}
      style={[styles.input, style]}
      {...rest}
    />
  </View>
);

export const RadioGroup: <T extends string>(p: {
  options: readonly T[]; value: T | ''; onChange: (v: T) => void; testIDPrefix?: string; columns?: number;
}) => React.ReactElement = ({ options, value, onChange, testIDPrefix, columns = 1 }) => (
  <View style={{ gap: 10, flexDirection: columns > 1 ? 'row' : 'column', flexWrap: 'wrap' }}>
    {options.map((opt) => {
      const selected = value === opt;
      return (
        <TouchableOpacity
          key={opt}
          testID={testIDPrefix ? `${testIDPrefix}-${opt}` : undefined}
          activeOpacity={0.8}
          onPress={() => onChange(opt)}
          style={[styles.radioRow, selected && styles.radioRowActive, columns > 1 && { flexBasis: `${100 / columns - 2}%` as any }]}
        >
          <View style={[styles.radioDot, selected && { borderColor: colors.navy }]}>
            {selected && <View style={styles.radioDotInner} />}
          </View>
          <Text style={[styles.radioLabel, selected && { color: colors.navy, fontWeight: '600' }]} numberOfLines={2}>
            {opt}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export const CheckboxGroup: React.FC<{
  options: readonly string[]; values: string[]; onChange: (v: string[]) => void; testIDPrefix?: string;
}> = ({ options, values, onChange, testIDPrefix }) => (
  <View style={{ gap: 10 }}>
    {options.map(opt => {
      const selected = values.includes(opt);
      return (
        <TouchableOpacity
          key={opt}
          testID={testIDPrefix ? `${testIDPrefix}-${opt}` : undefined}
          activeOpacity={0.8}
          onPress={() => onChange(selected ? values.filter(v => v !== opt) : [...values, opt])}
          style={[styles.radioRow, selected && styles.radioRowActive]}
        >
          <View style={[styles.checkBox, selected && { backgroundColor: colors.navy, borderColor: colors.navy }]}>
            {selected && <Ionicons name="checkmark" size={14} color={colors.white} />}
          </View>
          <Text style={[styles.radioLabel, selected && { color: colors.navy, fontWeight: '600' }]}>{opt}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export const StarRating: React.FC<{ value: number; onChange: (v: number) => void; testID?: string }> =
  ({ value, onChange, testID }) => (
    <View testID={testID} style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.7} testID={testID ? `${testID}-${n}` : undefined}>
          <Ionicons name={n <= value ? 'star' : 'star-outline'} size={30} color={n <= value ? colors.gold : colors.border} />
        </TouchableOpacity>
      ))}
    </View>
  );

export const Chip: React.FC<{ label: string; tone?: 'navy' | 'red' | 'gold' | 'muted' | 'green'; small?: boolean }> =
  ({ label, tone = 'muted', small }) => {
    const bgMap = { navy: colors.navy, red: colors.red, gold: colors.gold, muted: '#F1F3F6', green: colors.npsGreen };
    const fgMap = { navy: colors.white, red: colors.white, gold: colors.white, muted: colors.textSecondary, green: colors.white };
    return (
      <View style={{
        backgroundColor: bgMap[tone], paddingHorizontal: small ? 8 : 12, paddingVertical: small ? 4 : 6,
        borderRadius: radius.pill, alignSelf: 'flex-start',
      }}>
        <Text style={{ color: fgMap[tone], fontSize: small ? 11 : 12, fontWeight: '700', letterSpacing: 0.3 }}>{label}</Text>
      </View>
    );
  };

export const Stat: React.FC<{ label: string; value: string | number; accent?: string; testID?: string }> =
  ({ label, value, accent, testID }) => (
    <View testID={testID} style={[styles.card, { flex: 1, alignItems: 'flex-start' }]}>
      <Text style={styles.caption}>{label}</Text>
      <Text style={[font.h2, { color: accent || colors.navy, marginTop: 4 }]}>{value}</Text>
    </View>
  );

export const ProgressBar: React.FC<{ progress: number; color?: string }> = ({ progress, color }) => (
  <View style={styles.progressTrack}>
    <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: color || colors.navy }]} />
  </View>
);

export const ScreenWrap: React.FC<{ children: React.ReactNode; refresh?: React.ReactNode }> = ({ children }) => (
  <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 60 }}>
    {children}
  </ScrollView>
);

export const EmptyState: React.FC<{ icon: React.ComponentProps<typeof Ionicons>['name']; title: string; body?: string }> =
  ({ icon, title, body }) => (
    <View style={{ alignItems: 'center', padding: 32, gap: 10 }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#F1F3F6', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={32} color={colors.navy} />
      </View>
      <Text style={[font.h3, { color: colors.navy, textAlign: 'center' }]}>{title}</Text>
      {!!body && <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>{body}</Text>}
    </View>
  );

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
    gap: 8,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  sectionSubtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  caption: { ...font.caption, color: colors.textSecondary },
  btn: {
    minHeight: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 18,
  },
  btnLabel: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  inputLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  input: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, minHeight: 48,
    fontSize: 15, color: colors.textPrimary,
  },
  radioRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: radius.md,
    borderWidth: 1.2, borderColor: colors.border, backgroundColor: colors.white, gap: 10,
  },
  radioRowActive: { borderColor: colors.navy, backgroundColor: '#F5F7FC' },
  radioDot: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioDotInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.navy },
  radioLabel: { fontSize: 14, color: colors.textPrimary, flex: 1 },
  checkBox: {
    width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white,
  },
  progressTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
});
