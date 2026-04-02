import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Image,
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
import { brand } from '../theme';

type LoginNav = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<LoginNav>();
  const [phone, setPhone] = useState('');

  // Check validity by stripping the space we will add during formatting
  const rawPhone = phone.replace(/\s/g, '');
  const isValid = rawPhone.length === 10;

  // Professional UX: Auto-format the phone number with a space after 5 digits
  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, ''); // Remove non-numeric chars
    let formatted = cleaned;
    if (cleaned.length > 5) {
      formatted = `${cleaned.substring(0, 5)} ${cleaned.substring(5, 10)}`;
    }
    setPhone(formatted);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={brand.dark} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}>
          
          <View style={styles.heroSection}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../assets/cashi-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
                accessibilityLabel="Cashi logo"
              />
            </View>

            <View style={styles.badgePill}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>
                India&apos;s community rewards app
              </Text>
            </View>

            <Text style={styles.heroHeading}>
              Shop Local.{'\n'}Earn Rewards.
            </Text>
            <Text style={styles.heroSub}>
              Turn every purchase at your neighbourhood store into points,
              perks, and feel-good impact.
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Text style={styles.statValue}>50K+</Text>
                <Text style={styles.statLabel}>Members</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statChip}>
                <Text style={styles.statValue}>1,200+</Text>
                <Text style={styles.statLabel}>Local stores</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statChip}>
                <Text style={styles.statValue}>Free</Text>
                <Text style={styles.statLabel}>Always</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHandle} />

            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>
              Enter your mobile number to get started
            </Text>

            <Text style={styles.fieldLabel}>Mobile number</Text>
            <View style={styles.inputGroup}>
              <View style={styles.dialCodeBox}>
                <Text style={styles.flagText}>IN</Text>
                <Text style={styles.dialCode}>+91</Text>
              </View>
              <View style={styles.inputWrapper} collapsable={false}>
                <TextInput
                  style={styles.input}
                  placeholder="00000 00000"
                  placeholderTextColor={brand.placeholder}
                  keyboardType="phone-pad"
                  maxLength={11} // 10 digits + 1 space
                  value={phone}
                  onChangeText={handlePhoneChange}
                  returnKeyType="done"
                  autoCorrect={false}
                  autoCapitalize="none"
                  underlineColorAndroid="transparent"
                  textAlignVertical="center"
                  blurOnSubmit={false}
                  cursorColor={brand.blue}
                  selectionColor={brand.blueLight}
                />
              </View>
            </View>

            <Text style={styles.helperText}>
              We&apos;ll send a one-time password to this number
            </Text>

            <TouchableOpacity
              style={[styles.ctaButton, !isValid && styles.ctaButtonDisabled]}
              activeOpacity={isValid ? 0.85 : 1}
              disabled={!isValid}
              onPress={() =>
                navigation.navigate('OtpVerification', { phone: rawPhone })
              }>
              <Text style={[styles.ctaText, !isValid && styles.ctaTextDisabled]}>
                Send OTP
              </Text>
            </TouchableOpacity>

            <Text style={styles.terms}>
              By continuing you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
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

  heroSection: {
    backgroundColor: brand.dark,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 48,
  },

  logoWrap: {
    marginBottom: 28,
  },
  logoImage: {
    width: 110,
    height: 36,
  },

  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: brand.badgeBg,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 20,
    gap: 7,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: brand.badgeDotColor,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: brand.badgeFg,
    letterSpacing: 0.2,
  },

  heroHeading: {
    fontSize: 36,
    fontWeight: '800',
    color: brand.heroHeading,
    lineHeight: 44,
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  heroSub: {
    fontSize: 14,
    color: brand.heroBody,
    lineHeight: 22,
    marginBottom: 32,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statChip: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.statValueColor,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    color: brand.statLabelColor,
    marginTop: 4,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: brand.statDividerColor,
    marginHorizontal: 15,
  },

  card: {
    flexGrow: 1,
    minHeight: 420,
    backgroundColor: brand.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 14,
    paddingBottom: 48,
    marginTop: -24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 12,
  },
  cardHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: brand.handleColor,
    alignSelf: 'center',
    marginBottom: 28,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: brand.cardHeading,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 14,
    color: brand.cardBody,
    marginBottom: 28,
    lineHeight: 20,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.fieldLabelColor,
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  dialCodeBox: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: brand.dialBg,
    gap: 6,
    borderWidth: 1.5,
    borderColor: brand.inputBorder,
  },
  flagText: {
    fontSize: 11,
    fontWeight: '700',
    color: brand.dialText,
    letterSpacing: 0.5,
  },
  dialCode: {
    fontSize: 15,
    fontWeight: '700',
    color: brand.dialText,
  },
  inputWrapper: {
    flex: 1,
    minWidth: 0,
    height: 54,
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
    fontSize: 17,
    color: brand.cardHeading,
    paddingVertical: 0,
    paddingHorizontal: 0,
    letterSpacing: 1,
    fontWeight: '500',
  },

  helperText: {
    fontSize: 12,
    color: brand.helperColor,
    marginTop: 8,
    marginBottom: 24,
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
    gap: 8,
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

  terms: {
    fontSize: 12,
    color: brand.termsText,
    textAlign: 'center',
    marginTop: 32, // Increased margin to balance the layout after removing the email button
    lineHeight: 18,
  },
  termsLink: {
    color: brand.termsLinkColor,
    fontWeight: '600',
  },
});