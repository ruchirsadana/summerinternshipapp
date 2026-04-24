import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, Image, ScrollView, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, shadow } from '../../lib/theme';
import { Card, ScreenWrap, PrimaryButton, Input, RadioGroup, SectionTitle, Chip, EmptyState, Stat } from '../../lib/ui';
import { BarChart, RadarChart } from '../../lib/charts';
import { store } from '../../lib/storage';
import {
  VM_ZONES, VM_ELEMENTS,
  type VMLog, type VMScorecard, type ZoneSales, type VMZone, type VMElement,
} from '../../lib/types';

const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtINR0 = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const fmtNum = (n: number, d = 1) => Number.isFinite(n) ? n.toFixed(d) : '—';

type Tab = 'dashboard' | 'log' | 'scorecard' | 'sspd';

export default function BrandVM() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [logs, setLogs] = useState<VMLog[]>([]);
  const [cards, setCards] = useState<VMScorecard[]>([]);
  const [sales, setSales] = useState<ZoneSales[]>([]);
  const [storeSqft, setStoreSqftState] = useState<number>(0);

  const [logOpen, setLogOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [sqftOpen, setSqftOpen] = useState(false);

  const load = useCallback(async () => {
    setLogs(await store.getVMLogs());
    setCards(await store.getVMScorecards());
    setSales(await store.getZoneSales());
    setStoreSqftState(await store.getStoreSqft());
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Health score = latest scorecard avg × 20 (so 1..5 → 20..100)
  const latestCard = cards[0];
  const elementAvgs: Record<VMElement, number> = useMemo(() => {
    const out: Record<string, number> = {};
    VM_ELEMENTS.forEach(e => {
      if (!cards.length) { out[e] = 0; return; }
      const vals = cards.map(c => c.scores[e] || 0).filter(v => v > 0);
      out[e] = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    });
    return out as Record<VMElement, number>;
  }, [cards]);
  const overallAvg = useMemo(() => {
    const vals = VM_ELEMENTS.map(e => elementAvgs[e]).filter(v => v > 0);
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  }, [elementAvgs]);
  const healthScore = Math.round(overallAvg * 20);

  // SSPD (daily sales ÷ store sq ft)
  const today = todayISO();
  const todaySales = sales.filter(s => s.date === today).reduce((s, x) => s + x.sale, 0);
  const sspdToday = storeSqft ? todaySales / storeSqft : 0;

  // SSPD by zone (avg sale / sqft per zone; uses the sqft captured per zone entry)
  const sspdByZone = useMemo(() => {
    return VM_ZONES.map(z => {
      const zs = sales.filter(s => s.zone === z);
      const totalSale = zs.reduce((s, x) => s + x.sale, 0);
      const totalSqft = zs.reduce((s, x) => s + x.sqft, 0);
      return { zone: z, sspd: totalSqft ? totalSale / totalSqft : 0 };
    });
  }, [sales]);

  return (
    <>
      <ScreenWrap>
        <View style={styles.tabBar}>
          {(['dashboard', 'log', 'scorecard', 'sspd'] as Tab[]).map(t => (
            <TouchableOpacity
              key={t}
              testID={`vm-tab-${t}`}
              onPress={() => setTab(t)}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, tab === t && { color: colors.white }]}>
                {t === 'dashboard' ? 'Overview' : t === 'log' ? 'Logs' : t === 'scorecard' ? 'Scorecard' : 'SSPD'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'dashboard' && (
          <>
            <Card>
              <SectionTitle title="VM Health Score" subtitle={latestCard ? `Last reviewed ${latestCard.date}` : 'Submit a scorecard to unlock'} />
              <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                <View style={[styles.scoreRing, { borderColor: healthScoreColor(healthScore) }]}>
                  <Text style={[styles.scoreNum, { color: healthScoreColor(healthScore) }]}>{healthScore}</Text>
                  <Text style={styles.scoreSub}>/ 100</Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginTop: 6 }}>
                  {healthScore >= 80 ? 'EXCELLENT' : healthScore >= 60 ? 'HEALTHY' : healthScore >= 40 ? 'NEEDS ATTENTION' : 'CRITICAL'}
                </Text>
              </View>
            </Card>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Stat testID="vm-logs-count" label="Total Logs" value={logs.length} />
              <Stat testID="vm-sspd-today" label="SSPD Today" value={sspdToday ? fmtINR0(sspdToday) : '—'} accent={colors.gold} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Stat testID="vm-store-sqft" label="Store Sq Ft" value={storeSqft || '—'} />
              <Stat testID="vm-today-sale" label="Today Sale" value={todaySales ? fmtINR0(todaySales) : '—'} accent={colors.navy} />
            </View>

            <Card>
              <SectionTitle title="Radar · 12 VM Elements" subtitle="Overall scores across reviews" />
              {cards.length ? (
                <RadarChart
                  axes={VM_ELEMENTS.map(e => ({ label: e, value: elementAvgs[e] }))}
                  max={5}
                  size={320}
                  color={colors.navy}
                />
              ) : (
                <EmptyState icon="analytics-outline" title="No scorecards yet" body="Submit your first VM scorecard to see the radar." />
              )}
            </Card>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <PrimaryButton label="Log Change" icon="camera" variant="accent" onPress={() => setLogOpen(true)} style={{ flex: 1 }} testID="vm-new-log" />
              <PrimaryButton label="Scorecard" icon="checkmark-done" onPress={() => setCardOpen(true)} style={{ flex: 1 }} testID="vm-new-card" />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <PrimaryButton label="Log Zone Sale" icon="cash" variant="outline" onPress={() => setSaleOpen(true)} style={{ flex: 1 }} testID="vm-new-sale" />
              <PrimaryButton label={storeSqft ? `${storeSqft} sq ft` : 'Set Store Sq Ft'} icon="resize" variant="outline" onPress={() => setSqftOpen(true)} style={{ flex: 1 }} testID="vm-set-sqft" />
            </View>
          </>
        )}

        {tab === 'log' && (
          <>
            <PrimaryButton label="Log a VM Change" icon="camera" variant="accent" onPress={() => setLogOpen(true)} testID="vm-add-log" />
            {logs.length === 0 ? (
              <Card><EmptyState icon="clipboard-outline" title="No VM logs" body="Each tweak becomes a timestamped log with before/after photos." /></Card>
            ) : logs.map(l => (
              <Card key={l.id} testID={`vm-log-${l.id}`}>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Chip label={l.zone || '—'} tone="navy" small />
                      <Chip label={`★ ${l.score}`} tone="gold" small />
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{l.date}</Text>
                    </View>
                    <Text style={{ color: colors.textPrimary, fontSize: 14, marginTop: 6 }}>{l.whatChanged}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>by {l.changedBy || 'Anon'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => confirmDelete(() => store.deleteVMLog(l.id).then(load))}>
                    <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
                {(l.beforePhoto || l.afterPhoto) && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    {!!l.beforePhoto && (
                      <View style={{ flex: 1 }}>
                        <Text style={styles.photoLabel}>BEFORE</Text>
                        <Image source={{ uri: l.beforePhoto }} style={styles.photo} />
                      </View>
                    )}
                    {!!l.afterPhoto && (
                      <View style={{ flex: 1 }}>
                        <Text style={styles.photoLabel}>AFTER</Text>
                        <Image source={{ uri: l.afterPhoto }} style={styles.photo} />
                      </View>
                    )}
                  </View>
                )}
              </Card>
            ))}
          </>
        )}

        {tab === 'scorecard' && (
          <>
            <PrimaryButton label="New Scorecard" icon="checkmark-done" variant="accent" onPress={() => setCardOpen(true)} testID="vm-add-card" />
            {cards.length === 0 ? (
              <Card><EmptyState icon="list-outline" title="No scorecards yet" body="Score the 12 VM elements to track brand standards." /></Card>
            ) : cards.map(c => (
              <Card key={c.id} testID={`vm-card-${c.id}`}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[font.h3, { color: colors.navy }]}>{c.date}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <Chip
                      label={`${((Object.values(c.scores).reduce((s: number, v: number) => s + v, 0)) / 12).toFixed(2)} avg`}
                      tone="navy"
                      small
                    />
                    <TouchableOpacity onPress={() => confirmDelete(() => store.deleteVMScorecard(c.id).then(load))}>
                      <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {VM_ELEMENTS.map(e => (
                    <View key={e} style={styles.scoreDot}>
                      <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '700' }}>{e}</Text>
                      <Text style={{ fontSize: 14, color: starColor(c.scores[e]), fontWeight: '800' }}>{c.scores[e] || '—'}</Text>
                    </View>
                  ))}
                </View>
                {!!c.notes && <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>{c.notes}</Text>}
              </Card>
            ))}
          </>
        )}

        {tab === 'sspd' && (
          <>
            <Card>
              <SectionTitle title="Sales per Sq Ft per Day" subtitle="Daily sale ÷ store sq ft" />
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                Log zone-level sales with the sqft occupied by each zone. SSPD auto-computes per zone.
              </Text>
              <PrimaryButton label="Log Zone Sale" icon="cash" variant="accent" onPress={() => setSaleOpen(true)} testID="sspd-add" style={{ marginTop: 8 }} />
            </Card>
            <Card>
              <SectionTitle title="SSPD by Zone (11 sections)" subtitle="₹ per sq ft" />
              <BarChart
                data={sspdByZone.map((r, i) => ({
                  label: r.zone,
                  value: r.sspd,
                  color: r.sspd ? colors.chart[i % colors.chart.length] : colors.border,
                }))}
                height={200}
                valueSuffix=""
              />
            </Card>
          </>
        )}
      </ScreenWrap>

      <LogModal open={logOpen} onClose={() => setLogOpen(false)} onSaved={() => { setLogOpen(false); load(); }} />
      <ScorecardModal open={cardOpen} onClose={() => setCardOpen(false)} onSaved={() => { setCardOpen(false); load(); }} />
      <ZoneSaleModal open={saleOpen} onClose={() => setSaleOpen(false)} onSaved={() => { setSaleOpen(false); load(); }} />
      <SqftModal
        open={sqftOpen}
        current={storeSqft}
        onClose={() => setSqftOpen(false)}
        onSaved={async (n) => { await store.setStoreSqft(n); setSqftOpen(false); load(); }}
      />
    </>
  );
}

function confirmDelete(doIt: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm('Delete this entry?')) doIt();
  } else {
    Alert.alert('Delete', 'Remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doIt },
    ]);
  }
}

const healthScoreColor = (v: number) =>
  v >= 80 ? '#15803D' : v >= 60 ? '#84CC16' : v >= 40 ? '#F59E0B' : v >= 1 ? '#EF4444' : colors.border;
const starColor = (v: number) =>
  v >= 4 ? colors.npsGreen : v === 3 ? colors.gold : v >= 1 ? colors.red : colors.textMuted;

/* ---------- Log Modal (Daily log + photos) ---------- */
function LogModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState(todayISO());
  const [zone, setZone] = useState<VMZone | ''>('');
  const [whatChanged, setWhatChanged] = useState('');
  const [changedBy, setChangedBy] = useState('');
  const [score, setScore] = useState(3);
  const [beforePhoto, setBeforePhoto] = useState<string | undefined>();
  const [afterPhoto, setAfterPhoto] = useState<string | undefined>();

  const pickPhoto = async (setter: (uri: string) => void) => {
    if (Platform.OS === 'web') {
      // Web: use native file input
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = () => {
        const f = input.files?.[0]; if (!f) return;
        const reader = new FileReader();
        reader.onload = () => setter(reader.result as string);
        reader.readAsDataURL(f);
      };
      input.click();
    } else {
      Alert.alert('Photo', 'Image picker available on web preview; use camera roll on device build.');
    }
  };

  const save = async () => {
    if (!zone) { Alert.alert('Missing', 'Pick a zone.'); return; }
    if (!whatChanged.trim()) { Alert.alert('Missing', 'Describe what changed.'); return; }
    await store.addVMLog({
      id: `vm-${Date.now()}`,
      createdAt: new Date().toISOString(),
      date, zone, whatChanged: whatChanged.trim(), changedBy: changedBy.trim(),
      score, beforePhoto, afterPhoto,
    });
    setDate(todayISO()); setZone(''); setWhatChanged(''); setChangedBy(''); setScore(3); setBeforePhoto(undefined); setAfterPhoto(undefined);
    onSaved();
  };

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={styles.modalHeader}>
          <Text style={[font.h3, { color: colors.white }]}>New VM Log</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={colors.white} /></TouchableOpacity>
        </View>
        <ScreenWrap>
          <Input label="Date" value={date} onChangeText={setDate} testID="vm-date" />
          <Text style={styles.label}>Zone / Section</Text>
          <RadioGroup options={VM_ZONES} value={zone} onChange={setZone} testIDPrefix="vm-zone" columns={2} />
          <Input label="What changed" value={whatChanged} onChangeText={setWhatChanged} multiline numberOfLines={3} testID="vm-what" />
          <Input label="Changed by" value={changedBy} onChangeText={setChangedBy} testID="vm-who" />
          <Text style={styles.label}>VM Score (1–5)</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity key={n} onPress={() => setScore(n)} style={[styles.scoreChip, score === n && { backgroundColor: colors.navy }]} testID={`vm-score-${n}`}>
                <Text style={{ fontWeight: '800', color: score === n ? colors.white : colors.navy }}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            <PhotoSlot label="BEFORE" uri={beforePhoto} onPick={() => pickPhoto(setBeforePhoto)} onClear={() => setBeforePhoto(undefined)} />
            <PhotoSlot label="AFTER" uri={afterPhoto} onPick={() => pickPhoto(setAfterPhoto)} onClear={() => setAfterPhoto(undefined)} />
          </View>
          <PrimaryButton label="Save Log" variant="accent" onPress={save} testID="vm-save-log" />
        </ScreenWrap>
      </View>
    </Modal>
  );
}

const PhotoSlot = ({ label, uri, onPick, onClear }: { label: string; uri?: string; onPick: () => void; onClear: () => void }) => (
  <View style={{ flex: 1 }}>
    <Text style={styles.photoLabel}>{label}</Text>
    <TouchableOpacity activeOpacity={0.8} onPress={onPick} style={styles.photoPlaceholder} testID={`vm-photo-${label.toLowerCase()}`}>
      {uri ? (
        <Image source={{ uri }} style={styles.photo} />
      ) : (
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Ionicons name="camera" size={22} color={colors.textMuted} />
          <Text style={{ fontSize: 11, color: colors.textMuted }}>Tap to add</Text>
        </View>
      )}
    </TouchableOpacity>
    {!!uri && (
      <TouchableOpacity onPress={onClear} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
        <Text style={{ color: colors.red, fontWeight: '700', fontSize: 12 }}>Clear</Text>
      </TouchableOpacity>
    )}
  </View>
);

/* ---------- Scorecard Modal (12 elements) ---------- */
function ScorecardModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const initial = VM_ELEMENTS.reduce((acc, e) => ({ ...acc, [e]: 3 }), {} as Record<VMElement, number>);
  const [date, setDate] = useState(todayISO());
  const [scores, setScores] = useState<Record<VMElement, number>>(initial);
  const [notes, setNotes] = useState('');

  const overall = Object.values(scores).reduce((s, v) => s + v, 0) / VM_ELEMENTS.length;

  const save = async () => {
    await store.addVMScorecard({
      id: `vmc-${Date.now()}`,
      createdAt: new Date().toISOString(),
      date, scores, notes: notes.trim(),
    });
    setDate(todayISO()); setScores(initial); setNotes('');
    onSaved();
  };

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={styles.modalHeader}>
          <Text style={[font.h3, { color: colors.white }]}>VM Scorecard</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={colors.white} /></TouchableOpacity>
        </View>
        <ScreenWrap>
          <Input label="Date" value={date} onChangeText={setDate} testID="vmc-date" />
          <Card>
            <SectionTitle title={`Rate each element · live avg ${overall.toFixed(2)}`} subtitle="1 = Poor · 5 = Excellent" />
            {VM_ELEMENTS.map(e => (
              <View key={e} style={styles.scoreRow}>
                <Text style={{ flex: 1, color: colors.textPrimary, fontWeight: '700' }}>{e}</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => setScores(s => ({ ...s, [e]: n }))}
                      style={[styles.scoreNumPill, scores[e] === n && { backgroundColor: colors.navy }]}
                      testID={`vmc-${e}-${n}`}
                    >
                      <Text style={{ fontWeight: '800', fontSize: 12, color: scores[e] === n ? colors.white : colors.navy }}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </Card>
          <Input label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={3} testID="vmc-notes" />
          <PrimaryButton label="Save Scorecard" variant="accent" onPress={save} testID="vmc-save" />
        </ScreenWrap>
      </View>
    </Modal>
  );
}

/* ---------- Zone Sale Modal (for SSPD) ---------- */
function ZoneSaleModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState(todayISO());
  const [zone, setZone] = useState<VMZone | ''>('');
  const [sale, setSale] = useState('');
  const [sqft, setSqft] = useState('');

  const save = async () => {
    const saleN = parseFloat(sale) || 0;
    const sqftN = parseFloat(sqft) || 0;
    if (!zone) { Alert.alert('Missing', 'Pick a zone.'); return; }
    if (!saleN || !sqftN) { Alert.alert('Missing', 'Enter sale & sq ft.'); return; }
    await store.addZoneSale({ id: `zs-${Date.now()}`, date, zone, sale: saleN, sqft: sqftN });
    setZone(''); setSale(''); setSqft(''); setDate(todayISO());
    onSaved();
  };

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={styles.modalHeader}>
          <Text style={[font.h3, { color: colors.white }]}>Log Zone Sale</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={colors.white} /></TouchableOpacity>
        </View>
        <ScreenWrap>
          <Input label="Date" value={date} onChangeText={setDate} testID="zs-date" />
          <Text style={styles.label}>Zone</Text>
          <RadioGroup options={VM_ZONES} value={zone} onChange={setZone} testIDPrefix="zs-zone" columns={2} />
          <Input label="Sale from zone (₹)" value={sale} onChangeText={setSale} keyboardType="numeric" testID="zs-sale" />
          <Input label="Zone sq ft" value={sqft} onChangeText={setSqft} keyboardType="numeric" testID="zs-sqft" />
          <PrimaryButton label="Save Zone Sale" variant="accent" onPress={save} testID="zs-save" />
        </ScreenWrap>
      </View>
    </Modal>
  );
}

function SqftModal({ open, current, onClose, onSaved }: {
  open: boolean; current: number; onClose: () => void; onSaved: (n: number) => void;
}) {
  const [val, setVal] = useState(String(current || ''));
  React.useEffect(() => { if (open) setVal(String(current || '')); }, [open, current]);
  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={[font.h3, { color: colors.navy }]}>Store Area</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Set the total store area (sq ft) for overall SSPD.</Text>
          <Input label="Store sq ft" value={val} onChangeText={setVal} keyboardType="numeric" testID="sqft-input" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <PrimaryButton label="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} testID="sqft-cancel" />
            <PrimaryButton label="Save" variant="accent" onPress={() => onSaved(parseFloat(val) || 0)} style={{ flex: 1 }} testID="sqft-save" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', gap: 6, backgroundColor: colors.white, padding: 4, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, alignItems: 'center' },
  tabBtnActive: { backgroundColor: colors.navy },
  tabText: { color: colors.navy, fontWeight: '700', fontSize: 12 },
  scoreRing: {
    width: 140, height: 140, borderRadius: 70, borderWidth: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreNum: { fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  scoreSub: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginTop: -4 },
  label: { fontSize: 13, color: colors.textSecondary, fontWeight: '700', marginTop: 4 },
  scoreChip: {
    width: 44, height: 40, borderWidth: 1.5, borderColor: colors.navy, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white,
  },
  scoreNumPill: {
    width: 36, height: 34, borderWidth: 1.2, borderColor: colors.navy, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white,
  },
  scoreRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  scoreDot: {
    width: '31%' as any, borderWidth: 1, borderColor: colors.borderLight, borderRadius: radius.sm,
    padding: 6, alignItems: 'center', gap: 2, backgroundColor: colors.white,
  },
  photo: { width: '100%', height: 120, borderRadius: radius.md, resizeMode: 'cover', backgroundColor: colors.borderLight },
  photoPlaceholder: {
    height: 120, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border,
    borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white,
    overflow: 'hidden',
  },
  photoLabel: { fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.6, marginBottom: 4 },
  modalHeader: { backgroundColor: colors.navy, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(15,26,48,0.6)', justifyContent: 'center', padding: 20 },
  dialog: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 20, gap: 12, ...shadow.elevated },
});
