import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, radius } from '../../lib/theme';
import { useTheme } from '../../lib/themeContext';
import { webConstraint } from '../../lib/ui';
import LeadsList from '../../lib/LeadsList';
import { useSfaData } from '../../lib/sfa/useSfaData';
import SfaDashboard, { type SfaSegment } from '../../lib/sfa/Dashboard';
import SfaDeals from '../../lib/sfa/Deals';
import SfaTasks from '../../lib/sfa/Tasks';
import SfaActivityLog from '../../lib/sfa/Activity';

const SEGMENTS: SfaSegment[] = ['Dashboard', 'Contacts', 'Deals', 'Tasks', 'Activity'];

export default function Sfa() {
  const { colors: t } = useTheme();
  const [seg, setSeg] = useState<SfaSegment>('Dashboard');
  const data = useSfaData();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={styles.bar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.barInner, webConstraint]}>
          {SEGMENTS.map(s => {
            const active = s === seg;
            return (
              <TouchableOpacity key={s} onPress={() => setSeg(s)} style={[styles.seg, active && styles.segActive]} testID={`sfa-tab-${s}`}>
                <Text style={[styles.segText, active && styles.segTextActive]}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      {seg === 'Dashboard' && <SfaDashboard {...data} onNavigate={setSeg} />}
      {seg === 'Contacts' && <LeadsList />}
      {seg === 'Deals' && <SfaDeals deals={data.deals} />}
      {seg === 'Tasks' && <SfaTasks tasks={data.tasks} />}
      {seg === 'Activity' && <SfaActivityLog activities={data.activities} />}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
  barInner: { gap: 8, paddingHorizontal: spacing.md, paddingVertical: 10 },
  seg: { paddingHorizontal: 16, minHeight: 36, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.mist },
  segActive: { backgroundColor: colors.fill },
  segText: { fontSize: 14, fontWeight: '500', color: colors.navy },
  segTextActive: { color: colors.onFill },
});
