import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, shadow } from '../lib/theme';
import { Card, ScreenWrap, Input, SectionTitle, PrimaryButton } from '../lib/ui';
import { store } from '../lib/storage';

type Mode = 'daily' | 'lfl' | 'target' | 'customer';

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
            {(['daily', 'lfl', 'target', 'customer'] as Mode[]).map(m => (
              <TouchableOpacity
                key={m}
                testID={`calc-tab-${m}`}
                onPress={() => setMode(m)}
                style={[styles.segmentBtn, mode === m && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, mode === m && { color: colors.white }]}>
                  {m === 'daily' ? 'Daily' : m === 'lfl' ? 'YoY / LFL' : m === 'target' ? 'Target' : 'Customer'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {mode === 'daily' && <DailyCalculator />}
        {mode === 'lfl' && <LFLCalculator />}
        {mode === 'target' && <TargetCalculator />}
        {mode === 'customer' && <CustomerCalculator />}

        <Card>
          <SectionTitle title="Formulas used" />
          <Formula label="ASP" body="Sale ÷ Qty  (Average Selling Price)" />
          <Formula label="ATV" body="Sale ÷ Bills  (Average Transaction Value)" />
          <Formula label="UPT" body="Qty ÷ Bills  (Units Per Transaction)" />
          <Formula label="Conversion %" body="Bills ÷ Footfall × 100" />
          <Formula label="LFL %" body="(Current − Prior) ÷ Prior × 100" />
          <Formula label="Target / Day" body="(Target − Achieved) ÷ Days Remaining" />
          <Formula label="CLV" body="Avg Order Value × Purchase Freq/yr × Lifespan (yrs)" />
          <Formula label="Repeat Rate" body="Customers with ≥2 purchases ÷ Total customers × 100" />
          <Formula label="Churn Rate" body="Customers lost ÷ Customers at period start × 100" />
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

// ------ Customer Analytics (CLV · RPR · Churn) ------
function CustomerCalculator() {
  // Inputs (autofilled from stored customer data when user taps the chip)
  const [aov, setAov] = useState('');        // Avg Order Value (₹)
  const [freq, setFreq] = useState('');      // Purchase freq / year
  const [lifespan, setLifespan] = useState('3');  // Years
  const [totalCust, setTotalCust] = useState('');
  const [repeatCust, setRepeatCust] = useState('');
  const [startCust, setStartCust] = useState('');
  const [lostCust, setLostCust] = useState('');
  const [loadedFromDb, setLoadedFromDb] = useState(false);

  // Auto-suggest from stored customer data on first mount
  const autofill = async () => {
    const list = await store.getCustomers();
    if (!list.length) { setLoadedFromDb(true); return; }
    const total = list.length;
    const repeat = list.filter(c => (c.purchaseCount || 0) >= 2).length;
    const totalVisits = list.reduce((s, c) => s + (c.purchaseCount || 0), 0);
    const totalSpend = list.reduce((s, c) => s + (c.totalSpend || 0), 0);
    const avgOrder = totalVisits ? totalSpend / totalVisits : 0;
    const avgFreqPerYear = total ? totalVisits / total : 0;
    setAov(avgOrder ? Math.round(avgOrder).toString() : '');
    setFreq(avgFreqPerYear ? avgFreqPerYear.toFixed(1) : '');
    setTotalCust(String(total));
    setRepeatCust(String(repeat));
    setLoadedFromDb(true);
  };

  useEffect(() => { autofill(); /* eslint-disable-line */ }, []);

  const n = (v: string) => parseFloat(v) || 0;
  const a = n(aov), f = n(freq), l = n(lifespan);
  const tc = n(totalCust), rc = n(repeatCust);
  const sc = n(startCust), lc = n(lostCust);

  const clv = a * f * l;
  const rpr = tc ? (rc / tc) * 100 : 0;
  const churn = sc ? (lc / sc) * 100 : 0;
  const retention = sc ? 100 - churn : 0;

  const verdict = (v: number, good: number, bad: number, higherIsBetter = true) => {
    if (!v) return { text: '—', color: colors.textMuted };
    const isGood = higherIsBetter ? v >= good : v <= good;
    const isBad = higherIsBetter ? v <= bad : v >= bad;
    if (isGood) return { text: 'HEALTHY', color: colors.npsGreen };
    if (isBad) return { text: 'AT RISK', color: colors.red };
    return { text: 'FAIR', color: colors.npsYellow };
  };

  const rprVerdict = verdict(rpr, 30, 10, true);
  const churnVerdict = verdict(churn, 5, 20, false);

  const clear = () => {
    setAov(''); setFreq(''); setLifespan('3'); setTotalCust('');
    setRepeatCust(''); setStartCust(''); setLostCust('');
  };

  return (
    <>
      <Card>
        <SectionTitle title="Customer Lifetime Value" subtitle="How much each customer is worth over their lifespan" />
        <TouchableOpacity onPress={autofill} style={styles.autofillChip} testID="calc-autofill">
          <Ionicons name="sparkles" size={14} color={colors.navy} />
          <Text style={styles.autofillText}>
            {loadedFromDb ? 'Refresh from Leads database' : 'Auto-fill from Leads'}
          </Text>
        </TouchableOpacity>
        <Input label="Avg Order Value (₹)" value={aov} onChangeText={setAov} keyboardType="numeric" testID="clv-aov" />
        <Input label="Purchase Frequency / year" value={freq} onChangeText={setFreq} keyboardType="numeric" testID="clv-freq" />
        <Input label="Customer Lifespan (years)" value={lifespan} onChangeText={setLifespan} keyboardType="numeric" testID="clv-lifespan" />
      </Card>

      <Card>
        <SectionTitle title="CLV Result" />
        <ResultRow label="CLV" help="AOV × Freq × Lifespan" value={fmtINR(clv)} />
        <ResultRow label="Per-year value" help="AOV × Frequency" value={fmtINR(a * f)} />
      </Card>

      <Card>
        <SectionTitle title="Repeat Purchase Rate" subtitle="Share of customers with ≥ 2 purchases" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Input label="Total customers" value={totalCust} onChangeText={setTotalCust} keyboardType="numeric" testID="rpr-total" /></View>
          <View style={{ flex: 1 }}><Input label="Repeat (≥2 visits)" value={repeatCust} onChangeText={setRepeatCust} keyboardType="numeric" testID="rpr-repeat" /></View>
        </View>
        <View style={[styles.verdictRow, { backgroundColor: rprVerdict.color + '22' }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.navy, fontWeight: '800', fontSize: 15 }}>Repeat Rate</Text>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>Benchmark: 30%+ healthy · &lt;10% at risk</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: rprVerdict.color, fontSize: 24, fontWeight: '800' }}>{rpr.toFixed(1)}%</Text>
            <Text style={{ color: rprVerdict.color, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>{rprVerdict.text}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <SectionTitle title="Churn Rate" subtitle="Customers lost during the period" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Input label="Customers at start" value={startCust} onChangeText={setStartCust} keyboardType="numeric" testID="churn-start" /></View>
          <View style={{ flex: 1 }}><Input label="Customers lost" value={lostCust} onChangeText={setLostCust} keyboardType="numeric" testID="churn-lost" /></View>
        </View>
        <View style={[styles.verdictRow, { backgroundColor: churnVerdict.color + '22' }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.navy, fontWeight: '800', fontSize: 15 }}>Churn</Text>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>Retention {sc ? retention.toFixed(1) : '—'}% · Benchmark: ≤5% healthy</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: churnVerdict.color, fontSize: 24, fontWeight: '800' }}>{churn.toFixed(1)}%</Text>
            <Text style={{ color: churnVerdict.color, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>{churnVerdict.text}</Text>
          </View>
        </View>
      </Card>

      <PrimaryButton label="Clear" variant="outline" icon="refresh" onPress={clear} testID="customer-clear" />
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
  segmentRow: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  segmentBtn: {
    flex: 1, minWidth: 68, paddingVertical: 10, paddingHorizontal: 8,
    borderRadius: radius.md, borderWidth: 1.2, borderColor: colors.navy,
    backgroundColor: colors.white, alignItems: 'center',
  },
  segmentBtnActive: { backgroundColor: colors.navy },
  segmentText: { color: colors.navy, fontWeight: '700', fontSize: 12 },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  autofillChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: '#F1F3F6', borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 6, marginVertical: 6,
  },
  autofillText: { color: colors.navy, fontWeight: '700', fontSize: 12 },
  verdictRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: radius.md, marginTop: 8,
  },
});
