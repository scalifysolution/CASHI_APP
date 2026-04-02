import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppDispatch } from '../store/hooks';
import { completeStartCashi, type BusinessProfile } from '../store/userSlice';
import { brand } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'StartCashiOnboarding'>;
};

const CATEGORIES = ['Retail', 'Food & Beverage', 'Services', 'Other'] as const;

export function StartCashiOnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(1);

  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const canNext1 = storeName.trim().length >= 2;
  const canNext2 = addressLine.trim().length >= 3 && city.trim().length >= 2 && pincode.trim().length >= 4;

  const handleComplete = () => {
    const payload: BusinessProfile = {
      storeName: storeName.trim(),
      category,
      addressLine: addressLine.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
    };
    dispatch(completeStartCashi(payload));
    navigation.replace('MerchantPortal');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => (step > 1 ? setStep((s) => s - 1) : navigation.goBack())}
            style={styles.backCircle}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <View style={styles.backArrow} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Start Cashi</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.stepRow}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={[styles.stepDot, s === step && styles.stepDotActive, s < step && styles.stepDotDone]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>
          {step === 1 && 'Store details'}
          {step === 2 && 'Location'}
          {step === 3 && 'Review & confirm'}
        </Text>
      </View>

      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
          {step === 1 && (
            <>
              <Text style={styles.lead}>Tell us about your store so we can set up loyalty and payouts.</Text>
              <Text style={styles.label}>Store name</Text>
              <TextInput
                style={styles.input}
                value={storeName}
                onChangeText={setStoreName}
                placeholder="e.g. Mohan’s Corner Store"
                placeholderTextColor={brand.placeholder}
              />
              <Text style={styles.label}>Category</Text>
              <View style={styles.chips}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCategory(c)}
                    style={[styles.chip, category === c && styles.chipActive]}>
                    <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.lead}>Where customers can find you — used for maps and verification later.</Text>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={addressLine}
                onChangeText={setAddressLine}
                placeholder="Street, building, area"
                placeholderTextColor={brand.placeholder}
                multiline
              />
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor={brand.placeholder}
              />
              <Text style={styles.label}>PIN code</Text>
              <TextInput
                style={styles.input}
                value={pincode}
                onChangeText={setPincode}
                placeholder="6-digit PIN"
                placeholderTextColor={brand.placeholder}
                keyboardType="number-pad"
                maxLength={6}
              />
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.lead}>Review your details. You can edit them anytime in Settings.</Text>
              <View style={styles.summaryCard}>
                <SummaryRow label="Store" value={storeName} />
                <SummaryRow label="Category" value={category} />
                <SummaryRow label="Address" value={addressLine} />
                <SummaryRow label="City" value={city} />
                <SummaryRow label="PIN" value={pincode} />
              </View>
              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                activeOpacity={0.8}>
                <View style={[styles.checkbox, acceptedTerms && styles.checkboxOn]}>
                  {acceptedTerms ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>
                <Text style={styles.termsText}>I agree to the Cashi merchant terms and payout policy.</Text>
              </TouchableOpacity>
            </>
          )}

          {step < 3 ? (
            <TouchableOpacity
              style={[
                styles.primaryBtnSolid,
                ((step === 1 && !canNext1) || (step === 2 && !canNext2)) && styles.primaryBtnDisabled,
              ]}
              disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
              onPress={() => setStep((s) => s + 1)}
              activeOpacity={0.9}>
              <Text style={styles.primaryBtnTextLight}>Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtnSolid, !acceptedTerms && styles.primaryBtnDisabled]}
              disabled={!acceptedTerms}
              onPress={handleComplete}
              activeOpacity={0.9}>
              <Text style={styles.primaryBtnTextLight}>Complete setup</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryVal}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brand.dark },
  header: { paddingHorizontal: 24, paddingBottom: 16 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: brand.surface,
    transform: [{ rotate: '-45deg' }],
    marginLeft: 4,
  },
  headerTitle: { color: brand.surface, fontSize: 18, fontWeight: '800' },
  placeholder: { width: 40 },
  stepRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  stepDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  stepDotActive: { backgroundColor: brand.blue },
  stepDotDone: { backgroundColor: 'rgba(59,158,232,0.45)' },
  stepLabel: { color: brand.heroBody, fontSize: 13, fontWeight: '700' },

  sheet: {
    flex: 1,
    backgroundColor: brand.background,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E0E2EE',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 14,
  },
  scroll: { paddingHorizontal: 24, paddingTop: 8 },
  lead: { fontSize: 15, color: brand.cardBody, fontWeight: '500', marginBottom: 20, lineHeight: 22 },
  label: { fontSize: 12, fontWeight: '800', color: brand.fieldLabelColor, marginBottom: 8 },
  input: {
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: brand.cardHeading,
    marginBottom: 16,
  },
  inputMultiline: { minHeight: 88, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: brand.inputBg,
    borderWidth: 1,
    borderColor: brand.inputBorder,
  },
  chipActive: { backgroundColor: brand.blueLight, borderColor: brand.blue },
  chipText: { fontSize: 13, fontWeight: '700', color: brand.cardBody },
  chipTextActive: { color: brand.blue },

  summaryCard: {
    backgroundColor: brand.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F1F7',
    marginBottom: 16,
  },
  summaryRow: { marginBottom: 12 },
  summaryLabel: { fontSize: 11, fontWeight: '800', color: brand.helperColor, letterSpacing: 0.4 },
  summaryVal: { fontSize: 15, fontWeight: '700', color: brand.cardHeading, marginTop: 4 },

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: brand.inputBorder,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: brand.blue, borderColor: brand.blue },
  checkMark: { color: brand.surface, fontSize: 13, fontWeight: '900' },
  termsText: { flex: 1, fontSize: 13, color: brand.cardBody, fontWeight: '600', lineHeight: 20 },

  primaryBtnSolid: {
    backgroundColor: brand.blue,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryBtnTextLight: { color: brand.surface, fontSize: 16, fontWeight: '800' },
});
