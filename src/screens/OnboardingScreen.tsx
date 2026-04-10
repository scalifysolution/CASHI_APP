import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/types';
import { apiRequest } from '../api/client';
import { ApiException } from '../api/http';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchMe } from '../store/authSlice';
import { setUser } from '../store/userSlice';
import { saveUserProfile } from '../store/userStorage';
import { brand } from '../theme';

type OnboardingNav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen() {
  const navigation = useNavigation<OnboardingNav>();
  const dispatch = useAppDispatch();
  const existing = useAppSelector((s) => s.user);
  const accessToken = useAppSelector((s) => s.auth.accessToken);

  const [fullName, setFullName] = useState(existing.displayName ?? '');
  const [email, setEmail] = useState(existing.email ?? '');
  /** Someone else's code — only used as `referrerCode` for the API (not your share code). */
  const [friendReferralCode, setFriendReferralCode] = useState('');
  const [saving, setSaving] = useState(false);

  const myReferralCode = useAppSelector((s) => s.user.referenceCode);

  useEffect(() => {
    if (accessToken) {
      void dispatch(fetchMe(accessToken));
    }
  }, [accessToken, dispatch]);

  // Validation: Only Full Name is mandatory
  const isValid = fullName.trim().length >= 2;

  const handleSave = async () => {
    if (!isValid || saving) return;
    if (!accessToken) {
      Alert.alert('Session error', 'Please log in again.');
      return;
    }
    const payload = {
      displayName: fullName.trim(),
      email: email.trim(),
      profileComplete: true,
      phone: existing.phone,
      id: existing.id,
    };
    const normalizedFriend = friendReferralCode.trim().toUpperCase().replace(/\s+/g, '');
    const body: { name: string; email?: string; referrerCode?: string } = {
      name: payload.displayName,
      ...(payload.email ? { email: payload.email } : {}),
      ...(normalizedFriend.length > 0 ? { referrerCode: normalizedFriend } : {}),
    };
    setSaving(true);
    let serverReferralCode = myReferralCode;
    try {
      const res = await apiRequest<{
        id: string;
        referralCode?: string;
      }>('/auth/customer/profile', {
        method: 'POST',
        token: accessToken,
        body,
      });
      if (res.referralCode) serverReferralCode = res.referralCode;
    } catch (e: unknown) {
      const msg =
        e instanceof ApiException
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Could not save profile';
      Alert.alert('Save failed', msg);
      setSaving(false);
      return;
    }
    dispatch(
      setUser({
        ...payload,
        referenceCode: serverReferralCode,
      }),
    );
    await saveUserProfile({
      displayName: payload.displayName,
      email: payload.email,
      phone: existing.phone,
      referenceCode: serverReferralCode,
      profileComplete: true,
    });
    setSaving(false);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      }),
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={brand.dark} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Almost there!</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Complete your profile</Text>
            <Text style={styles.cardSub}>
              Tell us a bit about yourself to get the best out of your local rewards.
            </Text>

            <View style={styles.myCodeSection}>
              <Text style={styles.myCodeLabel}>Your referral code</Text>
              <View style={styles.myCodeBox}>
                <Text style={styles.myCodeValue} selectable>
                  {myReferralCode || '…'}
                </Text>
              </View>
              <Text style={styles.myCodeHint}>
                Share this code with friends. Their welcome reward (100 wallet points for shopping) is
                not active yet; we will turn it on soon.
              </Text>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              
              {/* Full Name (Required) */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <View style={styles.inputWrapper} collapsable={false}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor={brand.placeholder}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    underlineColorAndroid="transparent"
                    textAlignVertical="center"
                    blurOnSubmit={false}
                    cursorColor={brand.blue}
                    selectionColor={brand.blueLight}
                  />
                </View>
              </View>

              {/* Email (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>
                  Email address <Text style={styles.optionalText}>(Optional)</Text>
                </Text>
                <View style={styles.inputWrapper} collapsable={false}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. rahul@example.com"
                    placeholderTextColor={brand.placeholder}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    underlineColorAndroid="transparent"
                    textAlignVertical="center"
                    blurOnSubmit={false}
                    cursorColor={brand.blue}
                    selectionColor={brand.blueLight}
                  />
                </View>
              </View>

              {/* Friend's referral code (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>
                  Friend&apos;s referral code <Text style={styles.optionalText}>(Optional)</Text>
                </Text>
                <View style={styles.inputWrapper} collapsable={false}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. CASHI-XXXXXX"
                    placeholderTextColor={brand.placeholder}
                    value={friendReferralCode}
                    onChangeText={setFriendReferralCode}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="done"
                    underlineColorAndroid="transparent"
                    textAlignVertical="center"
                    blurOnSubmit={false}
                    cursorColor={brand.blue}
                    selectionColor={brand.blueLight}
                  />
                </View>
                <Text style={styles.fieldFootnote}>
                  If you join with a friend&apos;s code, you&apos;ll be eligible for 100 wallet points
                  toward future shopping. Point credit is not live yet.
                </Text>
              </View>

            </View>

            {/* Push button to bottom if there's extra space, or just keep it below form */}
            <View style={styles.spacer} />

            <TouchableOpacity
              style={[
                styles.ctaButton,
                (!isValid || saving) && styles.ctaButtonDisabled,
              ]}
              activeOpacity={isValid && !saving ? 0.85 : 1}
              disabled={!isValid || saving}
              onPress={handleSave}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={[styles.ctaText, !isValid && styles.ctaTextDisabled]}>
                  Save & Continue
                </Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: brand.dark,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  header: {
    height: 70,
    backgroundColor: brand.dark,
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  headerTitle: {
    color: brand.heroHeading,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  card: {
    flexGrow: 1,
    minHeight: 420,
    backgroundColor: brand.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 12,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: brand.cardHeading,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  cardSub: {
    fontSize: 15,
    color: brand.cardBody,
    lineHeight: 22,
    marginBottom: 20,
  },
  myCodeSection: {
    marginBottom: 24,
  },
  myCodeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.fieldLabelColor,
    marginBottom: 8,
  },
  myCodeBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: brand.inputBorder,
    backgroundColor: brand.inputBg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  myCodeValue: {
    fontSize: 18,
    fontWeight: '800',
    color: brand.cardHeading,
    letterSpacing: 1.5,
  },
  myCodeHint: {
    marginTop: 10,
    fontSize: 12,
    color: brand.helperColor,
    lineHeight: 17,
    fontWeight: '500',
  },
  formContainer: {
    gap: 20, // Spaces out the input groups nicely
  },
  inputGroup: {
    flexDirection: 'column',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.fieldLabelColor,
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  optionalText: {
    color: brand.helperColor,
    fontWeight: '400',
    fontSize: 12,
  },
  fieldFootnote: {
    marginTop: 8,
    fontSize: 12,
    color: brand.helperColor,
    lineHeight: 17,
    fontWeight: '500',
  },
  inputWrapper: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: brand.inputBorder,
    backgroundColor: brand.inputBg,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    minWidth: 0,
    width: '100%',
    fontSize: 16,
    color: brand.cardHeading,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontWeight: '500',
  },
  
  spacer: {
    flex: 1,
    minHeight: 40, // Ensures there is always some space before the button
  },

  ctaButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: brand.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brand.blue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaButtonDisabled: {
    backgroundColor: brand.ctaDisabledBg,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  ctaTextDisabled: {
    color: brand.ctaDisabledText,
  },
});