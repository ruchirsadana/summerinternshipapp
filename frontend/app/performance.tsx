import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, shadow } from '../lib/theme';
import { Card, ScreenWrap, PrimaryButton, Input, SectionTitle, EmptyState } from '../lib/ui';
import { store } from '../lib/storage';
import type { Employee, DailyKPI, LFLBaseline } from '../lib/types';

const fmt = (n: number) => (Number.isFinite(n) ? Math.round(n).toLocaleString('en-IN') : '—');
const fmtDec = (n: number, d = 1) => (Number.isFinite(n) ? n.toFixed(d) : '—');
const todayISO = () => new Date().toISOString().slice(0, 10);
const monthStartISO = () => {
  const d = new Date(); d.setDate(1);
  return d.toISOString().slice(0, 10);
};

function aggregate(k: { sale: number; bill: number; qty: number }) {
  return {
    sale: k.sale,
    bill: k.bill,
    qty: k.qty,
    asp: k.qty ? k.sale / k.qty : 0,
    atv: k.bill ? k.sale / k.bill : 0,
    upt: k.bill ? k.qty / k.bill : 0,
  };
}

export default function Performance() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [kpis, setKpis] = useState<DailyKPI[]>([]);
  const [lfl, setLfl] = useState<LFLBaseline | null>(null);
  const [fromDate, setFromDate] = useState(monthStartISO());
  const [toDate, setToDate] = useState(todayISO());
  const [entryOpen, setEntryOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [lflOpen, setLflOpen] = useState(false);

  const load = useCallback(async () => {
    setEmployees(await store.getEmployees());
    setKpis(await store.getDailyKpis());
    setLfl(await store.getLFL());
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const inRange = (d: string) => d >= fromDate && d <= toDate;

  // Per employee aggregated within range
  const empAgg = useMemo(() => {
    return employees.filter(e => e.active).map(e => {
      const mine = kpis.filter(k => k.employeeId === e.id && inRange(k.date));
      const sum = mine.reduce((s, k) => ({ sale: s.sale + k.sale, bill: s.bill + k.bill, qty: s.qty + k.qty }), { sale: 0, bill: 0, qty: 0 });
      return { emp: e, ...aggregate(sum) };
    }).sort((a, b) => b.sale - a.sale);
  }, [employees, kpis, fromDate, toDate]);

  const storeAgg = useMemo(() => {
    const sum = empAgg.reduce((s, r) => ({ sale: s.sale + r.sale, bill: s.bill + r.bill, qty: s.qty + r.qty }), { sale: 0, bill: 0, qty: 0 });
    return aggregate(sum);
  }, [empAgg]);

  const lflAgg = lfl ? aggregate(lfl) : null;
  const variance = lflAgg ? {
    sale: storeAgg.sale - lflAgg.sale, bill: storeAgg.bill - lflAgg.bill, qty: storeAgg.qty - lflAgg.qty,
    asp: storeAgg.asp - lflAgg.asp, atv: storeAgg.atv - lflAgg.atv, upt: storeAgg.upt - lflAgg.upt,
  } : null;
  const pct = (cur: number, prev: number) => prev ? Math.round(((cur - prev) / prev) * 100) : 0;

  return (
    <>
      <ScreenWrap>
        {/* Date range */}
        <Card>
          <SectionTitle title="Period" subtitle="Date range for aggregation" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Input label="From" value={fromDate} onChangeText={setFromDate} testID="perf-from" /></View>
            <View style={{ flex: 1 }}><Input label="To" value={toDate} onChangeText={setToDate} testID="perf-to" /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <TouchableOpacity testID="range-today" onPress={() => { setFromDate(todayISO()); setToDate(todayISO()); }} style={styles.quickChip}>
              <Text style={styles.quickChipText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="range-mtd" onPress={() => { setFromDate(monthStartISO()); setToDate(todayISO()); }} style={styles.quickChip}>
              <Text style={styles.quickChipText}>Month-to-date</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="range-7d" onPress={() => {
              const d = new Date(); d.setDate(d.getDate() - 6);
              setFromDate(d.toISOString().slice(0, 10)); setToDate(todayISO());
            }} style={styles.quickChip}>
              <Text style={styles.quickChipText}>Last 7 days</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Quick actions */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <PrimaryButton label="Log Daily KPIs" icon="add-circle" variant="accent" onPress={() => setEntryOpen(true)} style={{ flex: 1 }} testID="perf-entry-open" />
          <PrimaryButton label="Staff" icon="people" variant="outline" onPress={() => setManageOpen(true)} testID="perf-manage-open" />
        </View>

        {/* Store Scorecard (like the top of your sheet) */}
        <Card testID="store-scorecard">
          <SectionTitle title={`TH ${/*settings?.storeName ||*/ 'BKC'} Scorecard`} subtitle={`${fromDate} → ${toDate}`} />
          <View style={styles.kpiTable}>
            <Row label="KPI" cells={['SALE', 'BILL', 'QTY', 'ASP', 'ATV', 'UPT']} header />
            <Row
              label="Current"
              cells={[fmt(storeAgg.sale), fmt(storeAgg.bill), fmt(storeAgg.qty), fmt(storeAgg.asp), fmt(storeAgg.atv), fmtDec(storeAgg.upt, 2)]}
              tone="current"
            />
            {lflAgg && (
              <Row
                label="LFL Prior"
                cells={[fmt(lflAgg.sale), fmt(lflAgg.bill), fmt(lflAgg.qty), fmt(lflAgg.asp), fmt(lflAgg.atv), fmtDec(lflAgg.upt, 2)]}
                tone="lfl"
              />
            )}
            {variance && (
              <Row
                label="Variance"
                cells={[fmt(variance.sale), fmt(variance.bill), fmt(variance.qty), fmt(variance.asp), fmt(variance.atv), fmtDec(variance.upt, 2)]}
                deltas={[variance.sale, variance.bill, variance.qty, variance.asp, variance.atv, variance.upt]}
              />
            )}
            {lflAgg && (
              <Row
                label="Var %"
                cells={[
                  `${pct(storeAgg.sale, lflAgg.sale)}%`, `${pct(storeAgg.bill, lflAgg.bill)}%`, `${pct(storeAgg.qty, lflAgg.qty)}%`,
                  `${pct(storeAgg.asp, lflAgg.asp)}%`, `${pct(storeAgg.atv, lflAgg.atv)}%`, `${pct(storeAgg.upt, lflAgg.upt)}%`,
                ]}
                deltas={[
                  pct(storeAgg.sale, lflAgg.sale), pct(storeAgg.bill, lflAgg.bill), pct(storeAgg.qty, lflAgg.qty),
                  pct(storeAgg.asp, lflAgg.asp), pct(storeAgg.atv, lflAgg.atv), pct(storeAgg.upt, lflAgg.upt),
                ]}
              />
            )}
          </View>
          <TouchableOpacity onPress={() => setLflOpen(true)} testID="set-lfl-btn">
            <Text style={{ color: colors.red, fontSize: 13, fontWeight: '700', marginTop: 10 }}>
              {lfl ? '✏️ Edit LFL baseline' : '+ Set LFL (prior year) baseline'}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Staff Leaderboard */}
        <Card>
          <SectionTitle title="Staff Leaderboard" subtitle="Ranked by Sale · auto-calc ASP/ATV/UPT" />
          {empAgg.length === 0 ? (
            <EmptyState icon="people-outline" title="No staff entries in range" body="Tap Log Daily KPIs to start." />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                <Row label="STAFF" cells={['SALE', 'BILL', 'QTY', 'ASP', 'ATV', 'UPT']} header wide />
                {empAgg.map((r, i) => (
                  <Row
                    key={r.emp.id}
                    label={r.emp.name}
                    cells={[fmt(r.sale), fmt(r.bill), fmt(r.qty), fmt(r.asp), fmt(r.atv), fmtDec(r.upt, 2)]}
                    tone={i < 4 ? 'top' : undefined}
                    wide
                  />
                ))}
              </View>
            </ScrollView>
          )}
        </Card>
      </ScreenWrap>

      <DailyEntryModal
        open={entryOpen}
        onClose={() => setEntryOpen(false)}
        employees={employees.filter(e => e.active)}
        onSaved={() => { setEntryOpen(false); load(); }}
      />

      <ManageEmployeesModal
        open={manageOpen}
        onClose={() => { setManageOpen(false); load(); }}
        employees={employees}
      />

      <LFLModal
        open={lflOpen}
        initial={lfl}
        onClose={() => setLflOpen(false)}
        onSaved={async (b) => { await store.setLFL(b); setLflOpen(false); load(); }}
      />
    </>
  );
}

const Row = ({ label, cells, header, tone, wide, deltas }: {
  label: string; cells: string[]; header?: boolean; tone?: 'current' | 'lfl' | 'top'; wide?: boolean; deltas?: number[];
}) => {
  const bg = header ? '#E8EEF8' : tone === 'current' ? '#FFF9E6' : tone === 'lfl' ? '#F5F5F5' : tone === 'top' ? '#E8F5E9' : '#FFFFFF';
  const labelW = wide ? 110 : 90;
  return (
    <View style={{ flexDirection: 'row', backgroundColor: bg, borderBottomWidth: 1, borderColor: colors.borderLight }}>
      <View style={{ width: labelW, padding: 10, justifyContent: 'center' }}>
        <Text numberOfLines={1} style={{ fontWeight: header ? '800' : '700', color: header ? colors.navy : colors.textPrimary, fontSize: header ? 11 : 13, letterSpacing: header ? 0.6 : 0 }}>
          {header ? label.toUpperCase() : label}
        </Text>
      </View>
      {cells.map((c, i) => {
        const delta = deltas?.[i];
        const deltaColor = delta === undefined ? undefined : delta > 0 ? colors.npsGreen : delta < 0 ? colors.red : colors.textSecondary;
        return (
          <View key={i} style={{ width: 76, padding: 10, alignItems: 'flex-end', justifyContent: 'center' }}>
            <Text style={{
              fontWeight: header ? '800' : '700',
              color: deltaColor || (header ? colors.navy : colors.textPrimary),
              fontSize: header ? 11 : 13,
              letterSpacing: header ? 0.6 : 0,
            }}>
              {c}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// ------------- Daily Entry Modal -------------
function DailyEntryModal({ open, onClose, employees, onSaved }: {
  open: boolean; onClose: () => void; employees: Employee[]; onSaved: () => void;
}) {
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState<Record<string, { sale: string; bill: string; qty: string }>>({});

  const set = (id: string, key: 'sale' | 'bill' | 'qty', v: string) => {
    setRows(r => ({ ...r, [id]: { sale: '', bill: '', qty: '', ...r[id], [key]: v } }));
  };

  const save = async () => {
    const entries = Object.entries(rows);
    let saved = 0;
    for (const [empId, vals] of entries) {
      const sale = parseFloat(vals.sale) || 0;
      const bill = parseFloat(vals.bill) || 0;
      const qty = parseFloat(vals.qty) || 0;
      if (!sale && !bill && !qty) continue;
      await store.addDailyKpi({ id: `k-${Date.now()}-${empId}`, employeeId: empId, date, sale, bill, qty });
      saved++;
    }
    if (saved === 0) { Alert.alert('Nothing saved', 'Enter at least one row.'); return; }
    setRows({}); onSaved(); Alert.alert('Saved', `${saved} employee ${saved === 1 ? 'entry' : 'entries'} logged for ${date}.`);
  };

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={styles.modalHeader}>
          <Text style={[font.h3, { color: colors.white }]}>Daily KPIs</Text>
          <TouchableOpacity onPress={onClose} testID="close-entry"><Ionicons name="close" size={26} color={colors.white} /></TouchableOpacity>
        </View>
        <ScreenWrap>
          <Input label="Date" value={date} onChangeText={setDate} testID="entry-date" />
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
            Enter Sale ₹ · Bills · Qty for each staff. Blank rows are skipped. ASP/ATV/UPT auto-calculated.
          </Text>
          {employees.map(e => {
            const r = rows[e.id] || { sale: '', bill: '', qty: '' };
            const sale = parseFloat(r.sale) || 0;
            const bill = parseFloat(r.bill) || 0;
            const qty = parseFloat(r.qty) || 0;
            const a = aggregate({ sale, bill, qty });
            return (
              <Card key={e.id} testID={`entry-row-${e.id}`}>
                <Text style={[font.h3, { color: colors.navy }]}>{e.name}</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <View style={{ flex: 1 }}><Input label="Sale (₹)" value={r.sale} onChangeText={v => set(e.id, 'sale', v)} keyboardType="numeric" testID={`entry-sale-${e.id}`} /></View>
                  <View style={{ flex: 1 }}><Input label="Bills" value={r.bill} onChangeText={v => set(e.id, 'bill', v)} keyboardType="numeric" testID={`entry-bill-${e.id}`} /></View>
                  <View style={{ flex: 1 }}><Input label="Qty" value={r.qty} onChangeText={v => set(e.id, 'qty', v)} keyboardType="numeric" testID={`entry-qty-${e.id}`} /></View>
                </View>
                {(sale > 0 || bill > 0 || qty > 0) && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF9E6', padding: 10, borderRadius: 8, marginTop: 4 }}>
                    <Text style={styles.calc}>ASP ₹{fmt(a.asp)}</Text>
                    <Text style={styles.calc}>ATV ₹{fmt(a.atv)}</Text>
                    <Text style={styles.calc}>UPT {fmtDec(a.upt, 2)}</Text>
                  </View>
                )}
              </Card>
            );
          })}
          <PrimaryButton label="Save All Entries" variant="accent" onPress={save} testID="save-entries" />
        </ScreenWrap>
      </View>
    </Modal>
  );
}

// ------------- Manage Employees Modal -------------
function ManageEmployeesModal({ open, onClose, employees }: { open: boolean; onClose: () => void; employees: Employee[] }) {
  const [name, setName] = useState('');
  const [list, setList] = useState<Employee[]>(employees);

  const refresh = async () => setList(await store.getEmployees());
  React.useEffect(() => { if (open) setList(employees); }, [open, employees]);

  const add = async () => {
    if (!name.trim()) return;
    await store.addEmployee({ id: `emp-${Date.now()}`, name: name.trim(), active: true, createdAt: new Date().toISOString() });
    setName(''); refresh();
  };

  const toggle = async (e: Employee) => { await store.updateEmployee(e.id, { active: !e.active }); refresh(); };

  const remove = (e: Employee) => Alert.alert('Remove staff', `Delete ${e.name}? KPI history stays.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { await store.deleteEmployee(e.id); refresh(); } },
  ]);

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={styles.modalHeader}>
          <Text style={[font.h3, { color: colors.white }]}>Manage Staff</Text>
          <TouchableOpacity onPress={onClose} testID="close-manage"><Ionicons name="close" size={26} color={colors.white} /></TouchableOpacity>
        </View>
        <ScreenWrap>
          <Card>
            <SectionTitle title="Add Employee" />
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
              <View style={{ flex: 1 }}><Input label="Name" value={name} onChangeText={setName} testID="new-emp-name" /></View>
              <PrimaryButton label="Add" variant="accent" onPress={add} testID="add-emp-btn" />
            </View>
          </Card>
          {list.map(e => (
            <Card key={e.id} testID={`emp-${e.id}`}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[font.h3, { color: colors.navy }]}>{e.name}</Text>
                  <Text style={{ color: e.active ? colors.npsGreen : colors.textMuted, fontSize: 12, fontWeight: '700' }}>{e.active ? 'ACTIVE' : 'INACTIVE'}</Text>
                </View>
                <TouchableOpacity onPress={() => toggle(e)} testID={`emp-toggle-${e.id}`} style={styles.iconBtn}>
                  <Ionicons name={e.active ? 'pause' : 'play'} size={18} color={colors.navy} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(e)} testID={`emp-delete-${e.id}`} style={styles.iconBtn}>
                  <Ionicons name="trash" size={18} color={colors.red} />
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </ScreenWrap>
      </View>
    </Modal>
  );
}

// ------------- LFL Baseline Modal -------------
function LFLModal({ open, initial, onClose, onSaved }: {
  open: boolean; initial: LFLBaseline | null; onClose: () => void; onSaved: (b: LFLBaseline) => void;
}) {
  const [label, setLabel] = useState(initial?.label || 'Prior Year Same Period');
  const [sd, setSd] = useState(initial?.startDate || '');
  const [ed, setEd] = useState(initial?.endDate || '');
  const [sale, setSale] = useState(String(initial?.sale ?? ''));
  const [bill, setBill] = useState(String(initial?.bill ?? ''));
  const [qty, setQty] = useState(String(initial?.qty ?? ''));

  React.useEffect(() => {
    if (open && initial) {
      setLabel(initial.label); setSd(initial.startDate); setEd(initial.endDate);
      setSale(String(initial.sale)); setBill(String(initial.bill)); setQty(String(initial.qty));
    }
  }, [open, initial]);

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={[font.h3, { color: colors.navy }]}>LFL Baseline</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Enter prior-year totals to unlock Var / Var% rows.</Text>
          <Input label="Label" value={label} onChangeText={setLabel} testID="lfl-label" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Input label="From" value={sd} onChangeText={setSd} testID="lfl-from" /></View>
            <View style={{ flex: 1 }}><Input label="To" value={ed} onChangeText={setEd} testID="lfl-to" /></View>
          </View>
          <Input label="Sale (₹)" value={sale} onChangeText={setSale} keyboardType="numeric" testID="lfl-sale" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Input label="Bill" value={bill} onChangeText={setBill} keyboardType="numeric" testID="lfl-bill" /></View>
            <View style={{ flex: 1 }}><Input label="Qty" value={qty} onChangeText={setQty} keyboardType="numeric" testID="lfl-qty" /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <PrimaryButton label="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} testID="lfl-cancel" />
            <PrimaryButton label="Save" variant="accent" style={{ flex: 1 }} testID="lfl-save"
              onPress={() => onSaved({ label, startDate: sd, endDate: ed, sale: +sale || 0, bill: +bill || 0, qty: +qty || 0 })} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  kpiTable: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: 10, overflow: 'hidden', marginTop: 10 },
  quickChip: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.navy, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  quickChipText: { color: colors.navy, fontWeight: '700', fontSize: 12 },
  calc: { fontSize: 12, fontWeight: '800', color: colors.navy },
  modalHeader: { backgroundColor: colors.navy, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(15,26,48,0.6)', justifyContent: 'center', padding: 20 },
  dialog: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 20, gap: 12, ...shadow.elevated },
});
