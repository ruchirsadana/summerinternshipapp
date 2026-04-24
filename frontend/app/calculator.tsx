import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, shadow } from '../lib/theme';
import { Card, ScreenWrap, Input, SectionTitle, PrimaryButton } from '../lib/ui';

type Mode = 'daily' | 'lfl' | 'target';

const fmtINR = (n: number) => Number.isFinite(n) && n !== 0 ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—';
const fmtNum = (n: number, d = 2) => Number.isFinite(n) && n !== 0 ? n.toFixed(d) : '—';
const fmtPct = (n: number) => Number.isFinite(n) ? `${n > 0 ? '+' : ''}${n.toFixed(1)}%` : '—';

export default function Calculator() {
  const [mode, setMode] = useState<Mode>('daily');

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        <Card>
          <SectionTitle title="KPI Calculator" subtitle="Instant — nothing is saved" />
          <View style={styles.segmentRow}>
            {(['daily', 'lfl', 'target'] as Mode[]).map(m => (
              <TouchableOpacity
                key={m}
                testID={`calc-tab-${m}`}
                onPress={() => setMode(m)}
                style={[styles.segmentBtn, mode === m && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, mode === m && { color: colors.white }]}>
                  {m === 'daily' ? 'Daily KPIs' : m === 'lfl' ? 'YoY / LFL' : 'Target Back-solve'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {mode === 'daily' && <DailyCalculator />}
        {mode === 'lfl' && <LFLCalculator />}
        {mode === 'target' && <TargetCalculator />}

        <Card>
          <SectionTitle title="Formulas used" />
          <Formula label="ASP" body="Sale ÷ Qty  (Average Selling Price)" />
          <Formula label="ATV" body="Sale ÷ Bills  (Average Transaction Value)" />
          <Formula label="UPT" body="Qty ÷ Bills  (Units Per Transaction)" />
          <Formula label="Conversion %" body="Bills ÷ Footfall × 100" />
          <Formula label="LFL %" body="(Current − Prior) ÷ Prior × 100" />
          <Formula label="Target / Day" body="(Target − Achieved) ÷ Days Remaining" />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ------ Daily KPI Calculator ------
function DailyCalculator() {
  const [sale, setSale] = useState('');
  const [bill, setBill] = useState('');
  const [qty, setQty] = useState('');
  const [foot, setFoot] = useState('');

  const s = parseFloat(sale) || 0;
  const b = parseFloat(bill) || 0;
  const q = parseFloat(qty) || 0;
  const f = parseFloat(foot) || 0;

  const asp = q ? s / q : 0;
  const atv = b ? s / b : 0;
  const upt = b ? q / b : 0;
  const conv = f ? (b / f) * 100 : 0;

  const clear = () => { setSale(''); setBill(''); setQty(''); setFoot(''); };

  return (
    <>
      <Card>
        <SectionTitle title="Inputs" />
        <Input label="Sale (₹)" value={sale} onChangeText={setSale} keyboardType="numeric" testID="calc-sale" />
        <Input label="Bills (transactions)" value={bill} onChangeText={setBill} keyboardType="numeric" testID="calc-bill" />
        <Input label="Qty (units sold)" value={qty} onChangeText={setQty} keyboardType="numeric" testID="calc-qty" />
        <Input label="Footfall (optional)" value={foot} onChangeText={setFoot} keyboardType="numeric" testID="calc-foot" />
        <PrimaryButton label="Clear" variant="outline" icon="refresh" onPress={clear} testID="calc-clear" />
      </Card>

      <Card>
        <SectionTitle title="Results" />
        <ResultRow label="ASP" help="Sale ÷ Qty" value={fmtINR(asp)} />
        <ResultRow label="ATV" help="Sale ÷ Bills" value={fmtINR(atv)} />
        <ResultRow label="UPT" help="Qty ÷ Bills" value={fmtNum(upt, 2)} />
        <ResultRow label="Conversion" help="Bills ÷ Footfall" value={conv ? `${conv.toFixed(1)}%` : '—'} />
      </Card>
    </>
  );
}

// ------ LFL (Year on Year) Calculator ------
function LFLCalculator() {
  const [curSale, setCurSale] = useState(''); const [curBill, setCurBill] = useState(''); const [curQty, setCurQty] = useState('');
  const [preSale, setPreSale] = useState(''); const [preBill, setPreBill] = useState(''); const [preQty, setPreQty] = useState('');

  const n = (v: string) => parseFloat(v) || 0;
  const cs = n(curSale), cb = n(curBill), cq = n(curQty);
  const ps = n(preSale), pb = n(preBill), pq = n(preQty);

  const cur = { asp: cq ? cs / cq : 0, atv: cb ? cs / cb : 0, upt: cb ? cq / cb : 0 };
  const pre = { asp: pq ? ps / pq : 0, atv: pb ? ps / pb : 0, upt: pb ? pq / pb : 0 };

  const diff = (c: number, p: number) => p ? ((c - p) / p) * 100 : 0;

  return (
    <>
      <Card>
        <SectionTitle title="Current Period" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Input label="Sale (₹)" value={curSale} onChangeText={setCurSale} keyboardType="numeric" testID="lfl-cs" /></View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Input label="Bills" value={curBill} onChangeText={setCurBill} keyboardType="numeric" testID="lfl-cb" /></View>
          <View style={{ flex: 1 }}><Input label="Qty" value={curQty} onChangeText={setCurQty} keyboardType="numeric" testID="lfl-cq" /></View>
        </View>
      </Card>

      <Card>
        <SectionTitle title="Prior Period (last year)" />
        <Input label="Sale (₹)" value={preSale} onChangeText={setPreSale} keyboardType="numeric" testID="lfl-ps" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Input label="Bills" value={preBill} onChangeText={setPreBill} keyboardType="numeric" testID="lfl-pb" /></View>
          <View style={{ flex: 1 }}><Input label="Qty" value={preQty} onChangeText={setPreQty} keyboardType="numeric" testID="lfl-pq" /></View>
        </View>
      </Card>

      <Card>
        <SectionTitle title="YoY / LFL Variance" />
        <CompareRow label="Sale" cur={fmtINR(cs)} prior={fmtINR(ps)} pct={diff(cs, ps)} />
        <CompareRow label="Bills" cur={String(cb || '—')} prior={String(pb || '—')} pct={diff(cb, pb)} />
        <CompareRow label="Qty" cur={String(cq || '—')} prior={String(pq || '—')} pct={diff(cq, pq)} />
        <CompareRow label="ASP" cur={fmtINR(cur.asp)} prior={fmtINR(pre.asp)} pct={diff(cur.asp, pre.asp)} />
        <CompareRow label="ATV" cur={fmtINR(cur.atv)} prior={fmtINR(pre.atv)} pct={diff(cur.atv, pre.atv)} />
        <CompareRow label="UPT" cur={fmtNum(cur.upt)} prior={fmtNum(pre.upt)} pct={diff(cur.upt, pre.upt)} />
      </Card>
    </>
  );
}

// ------ Target Back-solver ------
function TargetCalculator() {
  const [target, setTarget] = useState('');
  const [achieved, setAchieved] = useState('');
  const [daysLeft, setDaysLeft] = useState('');
  const [currentATV, setCurrentATV] = useState('');

  const n = (v: string) => parseFloat(v) || 0;
  const t = n(target), a = n(achieved), d = n(daysLeft), atv = n(currentATV);
  const gap = t - a;
  const pct = t ? (a / t) * 100 : 0;
  const runRate = d ? gap / d : 0;
  const billsPerDay = atv ? runRate / atv : 0;

  return (
    <>
      <Card>
        <SectionTitle title="Target & Progress" subtitle="Back-solve what you need per day" />
        <Input label="Target Sale (₹)" value={target} onChangeText={setTarget} keyboardType="numeric" testID="tgt-target" />
        <Input label="Achieved so far (₹)" value={achieved} onChangeText={setAchieved} keyboardType="numeric" testID="tgt-done" />
        <Input label="Days remaining" value={daysLeft} onChangeText={setDaysLeft} keyboardType="numeric" testID="tgt-days" />
        <Input label="Your current ATV (₹) (optional)" value={currentATV} onChangeText={setCurrentATV} keyboardType="numeric" testID="tgt-atv" />
      </Card>

      <Card>
        <SectionTitle title="What You Need" />
        <ResultRow label="Progress" help="Achieved ÷ Target" value={fmtNum(pct, 1) + '%'} />
        <ResultRow label="Gap" help="Target − Achieved" value={fmtINR(gap)} />
        <ResultRow label="Run-rate / day" help="Gap ÷ Days left" value={fmtINR(runRate)} />
        <ResultRow label="Bills needed / day" help="Run-rate ÷ ATV" value={atv ? fmtNum(billsPerDay, 1) : '—'} />
      </Card>
    </>
  );
}

// ------ Reusable rows ------
const ResultRow = ({ label, help, value }: { label: string; help: string; value: string }) => (
  <View style={styles.resultRow}>
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.navy, fontWeight: '800', fontSize: 15 }}>{label}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{help}</Text>
    </View>
    <Text style={{ color: colors.red, fontSize: 22, fontWeight: '800' }}>{value}</Text>
  </View>
);

const CompareRow = ({ label, cur, prior, pct }: { label: string; cur: string; prior: string; pct: number }) => {
  const pos = pct > 0, neg = pct < 0;
  const color = pos ? colors.npsGreen : neg ? colors.red : colors.textMuted;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
      <Text style={{ width: 70, color: colors.navy, fontWeight: '800' }}>{label}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{cur}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 11 }}>vs {prior}</Text>
      </View>
      <Text style={{ color, fontWeight: '800', fontSize: 16 }}>
        {pct ? (pos ? '▲' : neg ? '▼' : '—') + ' ' + fmtPct(pct) : '—'}
      </Text>
    </View>
  );
};

const Formula = ({ label, body }: { label: string; body: string }) => (
  <View style={{ flexDirection: 'row', paddingVertical: 6, gap: 12 }}>
    <View style={{ width: 90 }}>
      <Text style={{ color: colors.red, fontWeight: '800' }}>{label}</Text>
    </View>
    <Text style={{ color: colors.textSecondary, flex: 1, fontSize: 13 }}>{body}</Text>
  </View>
);

const styles = StyleSheet.create({
  segmentRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  segmentBtn: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 8,
    borderRadius: radius.md, borderWidth: 1.2, borderColor: colors.navy,
    backgroundColor: colors.white, alignItems: 'center',
  },
  segmentBtnActive: { backgroundColor: colors.navy },
  segmentText: { color: colors.navy, fontWeight: '700', fontSize: 12 },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
});
