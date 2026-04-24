import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, spacing, radius, shadow, tierColor } from '../../lib/theme';
import { Card, ScreenWrap, PrimaryButton, Input, RadioGroup, CheckboxGroup, SectionTitle, Chip, EmptyState } from '../../lib/ui';
import { store } from '../../lib/storage';
import type { Customer, AgeGroup, SpendBracket } from '../../lib/types';

const AGE_OPTIONS = ['18-24', '25-34', '35-44', '45+'] as const;
const SPEND_OPTIONS = ['Under ₹3,000', '₹3,000 – ₹8,000', '₹8,000 – ₹15,000', 'Above ₹15,000'] as const;
const CATEGORY_OPTIONS = ['Apparel', 'Denim', 'Fragrance', 'Accessories', 'Footwear'] as const;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

type Tier = 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
const getTier = (c: Customer): Tier => {
  const spend = c.totalSpend || 0;
  if (spend >= 85000 && c.purchaseCount >= 3) return 'Platinum';
  if (spend >= 25000) return 'Gold';
  if (spend >= 10000) return 'Silver';
  return 'Bronze';
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [visitCust, setVisitCust] = useState<Customer | null>(null);
  const [visitAmt, setVisitAmt] = useState('');
  const [birthdayFilter, setBirthdayFilter] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => setCustomers(await store.getCustomers()), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const thisMonth = MONTHS[new Date().getMonth()];
  const filtered = useMemo(() => {
    let list = customers;
    if (birthdayFilter) list = list.filter(c => c.birthdayMonth === thisMonth);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    }
    return list;
  }, [customers, birthdayFilter, query, thisMonth]);

  const grouped: Record<Tier, Customer[]> = {
    Platinum: filtered.filter(c => getTier(c) === 'Platinum'),
    Gold: filtered.filter(c => getTier(c) === 'Gold'),
    Silver: filtered.filter(c => getTier(c) === 'Silver'),
    Bronze: filtered.filter(c => getTier(c) === 'Bronze'),
  };
  const TIER_ORDER: Tier[] = ['Platinum', 'Gold', 'Silver', 'Bronze'];
  const tierSubtitle: Record<Tier, string> = {
    Platinum: '₹85K+ spend · 3+ visits',
    Gold: '₹25K+ lifetime spend',
    Silver: '₹10K+ lifetime spend',
    Bronze: 'New / under ₹10K',
  };

  const logVisit = async () => {
    if (!visitCust) return;
    const amt = parseFloat(visitAmt) || 0;
    await store.updateCustomer(visitCust.id, {
      purchaseCount: visitCust.purchaseCount + 1,
      totalSpend: (visitCust.totalSpend || 0) + amt,
      visitDate: new Date().toISOString().slice(0, 10),
    });
    setVisitCust(null); setVisitAmt(''); load();
  };

  return (
    <>
      <ScreenWrap>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Input placeholder="Search name or phone" value={query} onChangeText={setQuery} testID="customer-search" />
          </View>
          <TouchableOpacity
            testID="birthday-filter-toggle"
            onPress={() => setBirthdayFilter(v => !v)}
            style={[styles.filterBtn, birthdayFilter && { backgroundColor: colors.red }]}
          >
            <Ionicons name="gift" size={18} color={birthdayFilter ? colors.white : colors.red} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: birthdayFilter ? colors.white : colors.red }}>{thisMonth}</Text>
          </TouchableOpacity>
        </View>

        <PrimaryButton label="Add Customer" icon="person-add" variant="accent" onPress={() => setModalOpen(true)} testID="add-customer-btn" />

        <Card>
          <SectionTitle title="Tier Legend" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {TIER_ORDER.map(t => (
              <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: tierColor(t) }} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.navy }}>{t}</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>· {tierSubtitle[t]}</Text>
              </View>
            ))}
          </View>
        </Card>

        {filtered.length === 0 && (
          <Card><EmptyState icon="people-outline" title="No customers yet" body="Log floor customer details to build your database." /></Card>
        )}

        {TIER_ORDER.map(t => grouped[t].length > 0 && (
          <View key={t} style={{ gap: 8 }}>
            <SectionTitle title={`${t} · ${grouped[t].length}`} subtitle={tierSubtitle[t]} />
            {grouped[t].map(c => (
              <Card key={c.id} testID={`customer-${c.id}`}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.tierDot, { backgroundColor: tierColor(t) }]}>
                    <Text style={{ color: colors.white, fontWeight: '800', fontSize: 10 }}>{t[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[font.h3, { color: colors.navy }]}>{c.name}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                      **** {c.phone.slice(-4)} · {c.ageGroup || '—'} · {c.purchaseCount} visit{c.purchaseCount !== 1 ? 's' : ''}
                    </Text>
                    <Text style={{ color: colors.gold, fontSize: 13, fontWeight: '800', marginTop: 2 }}>
                      ₹{(c.totalSpend || 0).toLocaleString('en-IN')} lifetime
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      {c.categoryPrefs.slice(0, 3).map(cat => <Chip key={cat} label={cat} small />)}
                      {c.birthdayMonth === thisMonth && <Chip label="🎂 THIS MONTH" tone="red" small />}
                    </View>
                  </View>
                  <TouchableOpacity
                    testID={`customer-visit-${c.id}`}
                    onPress={() => { setVisitCust(c); setVisitAmt(''); }}
                    style={{ padding: 8 }}
                  >
                    <Ionicons name="add-circle" size={30} color={colors.red} />
                  </TouchableOpacity>
                </View>
                {!!c.notes && <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6 }}>{c.notes}</Text>}
              </Card>
            ))}
          </View>
        ))}
      </ScreenWrap>

      <AddCustomerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); load(); }}
      />

      <Modal visible={!!visitCust} animationType="fade" transparent onRequestClose={() => setVisitCust(null)}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={[font.h3, { color: colors.navy }]}>Log Visit · {visitCust?.name}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              Current: ₹{(visitCust?.totalSpend || 0).toLocaleString('en-IN')} · {visitCust?.purchaseCount} visits
            </Text>
            <Input label="Amount spent today (₹)" value={visitAmt} onChangeText={setVisitAmt} keyboardType="numeric" testID="visit-amt" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <PrimaryButton label="Cancel" variant="outline" onPress={() => setVisitCust(null)} style={{ flex: 1 }} testID="cancel-visit" />
              <PrimaryButton label="Log Visit" variant="accent" onPress={logVisit} style={{ flex: 1 }} testID="confirm-visit" />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function AddCustomerModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<AgeGroup | ''>('');
  const [cats, setCats] = useState<string[]>([]);
  const [spend, setSpend] = useState<SpendBracket | ''>('');
  const [todaySpend, setTodaySpend] = useState('');
  const [birthday, setBirthday] = useState('');
  const [notes, setNotes] = useState('');

  const save = async () => {
    if (!name.trim()) { Alert.alert('Missing', 'Please enter the customer name.'); return; }
    await store.addCustomer({
      id: `c-${Date.now()}`,
      createdAt: new Date().toISOString(),
      name: name.trim(),
      phone: phone.trim(),
      ageGroup: age,
      categoryPrefs: cats,
      spendBracket: spend,
      birthdayMonth: birthday,
      visitDate: new Date().toISOString().slice(0, 10),
      notes: notes.trim(),
      purchaseCount: 1,
      totalSpend: parseFloat(todaySpend) || 0,
    });
    setName(''); setPhone(''); setAge(''); setCats([]); setSpend(''); setBirthday(''); setNotes(''); setTodaySpend('');
    onSaved();
  };

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={styles.modalHeader}>
          <Text style={[font.h3, { color: colors.white }]}>Add Customer</Text>
          <TouchableOpacity onPress={onClose} testID="close-customer-modal"><Ionicons name="close" size={26} color={colors.white} /></TouchableOpacity>
        </View>
        <ScreenWrap>
          <Input label="Name" value={name} onChangeText={setName} testID="cust-name" />
          <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" testID="cust-phone" />
          <Input label="Today's Spend (₹)" value={todaySpend} onChangeText={setTodaySpend} keyboardType="numeric" testID="cust-today-spend" />
          <Text style={styles.fieldLabel}>Age Group</Text>
          <RadioGroup options={AGE_OPTIONS} value={age} onChange={setAge} testIDPrefix="cust-age" columns={2} />
          <Text style={styles.fieldLabel}>Category Preference</Text>
          <CheckboxGroup options={CATEGORY_OPTIONS as any} values={cats} onChange={setCats} testIDPrefix="cust-cat" />
          <Text style={styles.fieldLabel}>Typical Spend Bracket</Text>
          <RadioGroup options={SPEND_OPTIONS} value={spend} onChange={setSpend} testIDPrefix="cust-spend" />
          <Text style={styles.fieldLabel}>Birthday Month</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {MONTHS.map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => setBirthday(m)}
                style={[styles.monthChip, birthday === m && { backgroundColor: colors.navy }]}
                testID={`cust-bday-${m}`}
              >
                <Text style={{ color: birthday === m ? colors.white : colors.navy, fontWeight: '700' }}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={3} testID="cust-notes" />
          <PrimaryButton label="Save Customer" variant="accent" onPress={save} testID="save-customer-btn" />
        </ScreenWrap>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  filterBtn: {
    borderWidth: 1.5, borderColor: colors.red, borderRadius: radius.md, paddingHorizontal: 14,
    alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: colors.white,
  },
  tierDot: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  modalHeader: { backgroundColor: colors.navy, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '700', marginTop: 4, marginBottom: 4 },
  monthChip: { borderWidth: 1, borderColor: colors.navy, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.white },
  overlay: { flex: 1, backgroundColor: 'rgba(15,26,48,0.6)', justifyContent: 'center', padding: 24 },
  dialog: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 20, gap: 12, ...shadow.elevated },
});
