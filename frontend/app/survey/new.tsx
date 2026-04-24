import React, { useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { colors, font, spacing, radius } from '../../lib/theme';
import { Card, PrimaryButton, Input, RadioGroup, CheckboxGroup, SectionTitle, StarRating, ProgressBar } from '../../lib/ui';
import { store } from '../../lib/storage';
import { npsColor } from '../../lib/theme';
import type { Survey, Ratings, Comparisons, Comparison } from '../../lib/types';

const AGE = ['18-24', '25-34', '35-44', '45+'] as const;
const GENDER = ['Male', 'Female', 'Prefer not to say'] as const;
const OCCUPATION = ['Student', 'Salaried Professional', 'Business Owner', 'Other'] as const;
const FREQ = ['Weekly', '2-3 times a month', 'Once a month', 'Once in 2-3 months'] as const;
const BRANDS = ['Tommy Hilfiger', 'Hugo Boss', 'Calvin Klein', 'Ralph Lauren', 'Massimo Dutti', 'Emporio Armani'] as const;
const DISCOVERY = ['Social Media (Instagram / YouTube)', 'Word of Mouth', 'Mall / Store Walk-in', 'Online Shopping', 'Celebrity / Influencer', 'Brand Website', 'TV / OOH Advertisement', 'Other'] as const;
const COMPARISON: Comparison[] = ['Much Better', 'Better', 'Similar', 'Worse', "Don't Know"];
const VISIT = ['Browsing / No specific reason', 'Looking for a specific product', 'Gift for someone', 'Self-reward / treat', 'Special occasion (wedding, event)', 'Sale / Offer', 'Loyalty / regular visit', 'Other'] as const;
const CATEGORIES = ['Apparel (Shirts / T-shirts / Jackets)', 'Denim', 'Fragrance', 'Accessories (Bags / Belts / Caps)', 'Footwear', 'Did not purchase today'] as const;
const SPEND = ['Under ₹3,000', '₹3,000 – ₹8,000', '₹8,000 – ₹15,000', 'Above ₹15,000'] as const;
const PRIOR = ['Yes — more than 3 times', 'Yes — 1 to 2 times', 'No — this is my first purchase'] as const;

const emptyRatings: Ratings = { quality: 0, style: 0, value: 0, prestige: 0, inStoreExperience: 0, staff: 0 };
const emptyComparisons: Comparisons = { hugoBoss: '', calvinKlein: '', ralphLauren: '' };

export default function NewSurvey() {
  const router = useRouter();
  const navigation = useNavigation();
  const [step, setStep] = useState(0);
  const [s, setS] = useState<Omit<Survey, 'id' | 'createdAt'>>({
    ageGroup: '', gender: '', occupation: '', shoppingFrequency: '',
    unaidedRecall: '', brandAwareness: [], discoveryChannel: '', discoveryOther: '',
    word1: '', word2: '', word3: '',
    ratings: emptyRatings, comparisons: emptyComparisons,
    visitReason: '', visitReasonOther: '', categories: [], spendBracket: '', purchaseBarrier: '',
    priorPurchase: '', nps: 7, feedback: '',
  });

  const isDirty = (): boolean => {
    return !!(s.ageGroup || s.gender || s.occupation || s.unaidedRecall ||
      s.brandAwareness.length || s.word1 || s.word2 || s.word3 ||
      Object.values(s.ratings).some(v => v > 0) || s.visitReason ||
      s.categories.length || s.spendBracket || s.feedback || s.nps !== 7);
  };

  const exitToHome = () => {
    if (isDirty()) {
      Alert.alert('Exit survey?', 'Your progress will be lost.', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => router.replace('/') },
      ]);
    } else {
      router.replace('/');
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={exitToHome} style={{ paddingHorizontal: 8 }} testID="survey-exit">
          <Ionicons name="home" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, s]);

  const sectionTitles = ['Profile', 'Brand Awareness', 'Brand Perception', 'Purchase Behaviour', 'Loyalty'];
  const progress = (step + 1) / sectionTitles.length;

  const submit = async () => {
    const survey: Survey = { id: `S-${Date.now()}`, createdAt: new Date().toISOString(), ...s };
    await store.addSurvey(survey);
    Alert.alert('Survey submitted', `Saved as ${survey.id}`, [
      { text: 'Done', onPress: () => router.replace('/(tabs)') },
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        <View style={styles.stepperRow}>
          {sectionTitles.map((t, i) => (
            <View key={t} style={[styles.stepDot, i <= step && { backgroundColor: colors.red }]}>
              <Text style={{ color: i <= step ? colors.white : colors.textMuted, fontWeight: '800', fontSize: 12 }}>{String.fromCharCode(65 + i)}</Text>
            </View>
          ))}
        </View>
        <ProgressBar progress={progress} color={colors.red} />
        <Text style={[font.h2, { color: colors.navy }]}>Section {String.fromCharCode(65 + step)} · {sectionTitles[step]}</Text>

        {step === 0 && (
          <Card>
            <Label text="Q1. Age Group" />
            <RadioGroup options={AGE} value={s.ageGroup} onChange={v => setS({ ...s, ageGroup: v })} testIDPrefix="age" columns={2} />
            <Label text="Q2. Gender" />
            <RadioGroup options={GENDER} value={s.gender} onChange={v => setS({ ...s, gender: v })} testIDPrefix="gender" />
            <Label text="Q3. Occupation" />
            <RadioGroup options={OCCUPATION} value={s.occupation} onChange={v => setS({ ...s, occupation: v })} testIDPrefix="occupation" />
            <Label text="Q4. Shopping Frequency at premium stores" />
            <RadioGroup options={FREQ} value={s.shoppingFrequency} onChange={v => setS({ ...s, shoppingFrequency: v })} testIDPrefix="freq" />
          </Card>
        )}

        {step === 1 && (
          <Card>
            <Label text="Q5. Which premium casual brand comes to mind FIRST? (unaided)" />
            <Input value={s.unaidedRecall} onChangeText={t => setS({ ...s, unaidedRecall: t })} placeholder="Type brand name..." testID="unaided-recall" />
            <Label text="Q6. Which brands are you aware of?" />
            <CheckboxGroup options={BRANDS} values={s.brandAwareness} onChange={v => setS({ ...s, brandAwareness: v })} testIDPrefix="aware" />
            <Label text="Q7. Where did you first discover Tommy Hilfiger?" />
            <RadioGroup options={DISCOVERY} value={s.discoveryChannel} onChange={v => setS({ ...s, discoveryChannel: v })} testIDPrefix="discovery" />
            {s.discoveryChannel === 'Other' && (
              <Input value={s.discoveryOther} onChangeText={t => setS({ ...s, discoveryOther: t })} placeholder="Please specify..." testID="discovery-other" />
            )}
          </Card>
        )}

        {step === 2 && (
          <Card>
            <Label text="Q8. Three words that describe Tommy Hilfiger" />
            <Input value={s.word1} onChangeText={t => setS({ ...s, word1: t })} placeholder="Word 1" testID="word-1" />
            <Input value={s.word2} onChangeText={t => setS({ ...s, word2: t })} placeholder="Word 2" testID="word-2" />
            <Input value={s.word3} onChangeText={t => setS({ ...s, word3: t })} placeholder="Word 3" testID="word-3" />
            <Label text="Q9. Rate Tommy Hilfiger on these attributes" />
            {([
              ['quality', 'Product Quality'], ['style', 'Style & Design'], ['value', 'Value for Money'],
              ['prestige', 'Brand Prestige / Status'], ['inStoreExperience', 'In-Store Experience'], ['staff', 'Staff Helpfulness'],
            ] as const).map(([k, label]) => (
              <View key={k} style={{ marginBottom: 10 }}>
                <Text style={{ color: colors.textPrimary, marginBottom: 6, fontWeight: '600' }}>{label}</Text>
                <StarRating value={s.ratings[k]} onChange={v => setS({ ...s, ratings: { ...s.ratings, [k]: v } })} testID={`rating-${k}`} />
              </View>
            ))}
            <Label text="Q10. Compared to similar brands" />
            {(['hugoBoss', 'Hugo Boss'] as const).map(() => null)}
            {[
              { key: 'hugoBoss' as const, label: 'vs. Hugo Boss' },
              { key: 'calvinKlein' as const, label: 'vs. Calvin Klein' },
              { key: 'ralphLauren' as const, label: 'vs. Ralph Lauren' },
            ].map(({ key, label }) => (
              <View key={key} style={{ marginBottom: 8 }}>
                <Text style={{ color: colors.textPrimary, marginBottom: 6, fontWeight: '600' }}>{label}</Text>
                <RadioGroup options={COMPARISON} value={s.comparisons[key]} onChange={v => setS({ ...s, comparisons: { ...s.comparisons, [key]: v } })} testIDPrefix={`cmp-${key}`} columns={2} />
              </View>
            ))}
          </Card>
        )}

        {step === 3 && (
          <Card>
            <Label text="Q11. What brought you here today?" />
            <RadioGroup options={VISIT} value={s.visitReason} onChange={v => setS({ ...s, visitReason: v })} testIDPrefix="visit" />
            {s.visitReason === 'Other' && (
              <Input value={s.visitReasonOther} onChangeText={t => setS({ ...s, visitReasonOther: t })} placeholder="Please specify..." testID="visit-other" />
            )}
            <Label text="Q12. Categories purchased / considered" />
            <CheckboxGroup options={CATEGORIES} values={s.categories} onChange={v => setS({ ...s, categories: v })} testIDPrefix="cat" />
            <Label text="Q13. Spend bracket today" />
            <RadioGroup options={SPEND} value={s.spendBracket} onChange={v => setS({ ...s, spendBracket: v })} testIDPrefix="spend" columns={2} />
            <Label text="Q14. Any barrier to purchase?" />
            <Input value={s.purchaseBarrier} onChangeText={t => setS({ ...s, purchaseBarrier: t })} placeholder="Optional" multiline numberOfLines={3} testID="barrier" />
          </Card>
        )}

        {step === 4 && (
          <Card>
            <Label text="Q15. Have you purchased from TH before?" />
            <RadioGroup options={PRIOR} value={s.priorPurchase} onChange={v => setS({ ...s, priorPurchase: v })} testIDPrefix="prior" />
            <Label text={`Q16. How likely to recommend? (${s.nps}/10)`} />
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ fontSize: 44, fontWeight: '800', color: npsColor(s.nps) }}>{s.nps}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.6 }}>
                {s.nps >= 9 ? 'PROMOTER' : s.nps >= 7 ? 'PASSIVE' : 'DETRACTOR'}
              </Text>
            </View>
            <Slider
              testID="nps-slider"
              minimumValue={0} maximumValue={10} step={1} value={s.nps}
              onValueChange={v => setS({ ...s, nps: Math.round(v) })}
              minimumTrackTintColor={npsColor(s.nps)} maximumTrackTintColor={colors.border} thumbTintColor={npsColor(s.nps)}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>0 · Not at all</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>10 · Extremely</Text>
            </View>
            <Label text="Q17. Any feedback or suggestions?" />
            <Input value={s.feedback} onChangeText={t => setS({ ...s, feedback: t })} placeholder="Optional open feedback..." multiline numberOfLines={4} testID="feedback" />
          </Card>
        )}

        <View style={{ flexDirection: 'row', gap: 12 }}>
          {step > 0 ? (
            <PrimaryButton label="Back" variant="outline" onPress={() => setStep(step - 1)} style={{ flex: 1 }} testID="survey-back" />
          ) : (
            <PrimaryButton label="Exit" variant="outline" icon="home" onPress={exitToHome} style={{ flex: 1 }} testID="survey-home" />
          )}
          {step < sectionTitles.length - 1 ? (
            <PrimaryButton label="Next" onPress={() => setStep(step + 1)} style={{ flex: 1 }} testID="survey-next" icon="arrow-forward" />
          ) : (
            <PrimaryButton label="Submit Survey" variant="accent" onPress={submit} style={{ flex: 1 }} testID="survey-submit" icon="checkmark-circle" />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const Label = ({ text }: { text: string }) => (
  <Text style={{ color: colors.navy, fontWeight: '700', fontSize: 15, marginTop: 12, marginBottom: 6 }}>{text}</Text>
);

const styles = StyleSheet.create({
  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  stepDot: {
    flex: 1, height: 44, borderRadius: 8, backgroundColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
});
