import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import type {
  RootStackParamList,
  RootStackScreenProps,
} from '../navigation/types';
import { brand } from '../theme';

const OTP_LENGTH = 4;
const { height: WINDOW_HEIGHT } = Dimensions.get('window');

type OtpNav = NativeStackNavigationProp<RootStackParamList, 'OtpVerification'>;

function formatPhoneDisplay(digits: string) {
  const d = digits.replace(/\D/g, '');
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)} ${d.slice(5, 10)}`;
}

export function OtpVerificationScreen({
  route,
}: RootStackScreenProps<'OtpVerification'>) {
  const navigation = useNavigation<OtpNav>();
  const insets = useSafeAreaInsets();
  const phoneDisplay = formatPhoneDisplay(route.params.phone);

  const [code, setCode] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);
  const inputRef = useRef<TextInput>(null);

  const isComplete = code.length === OTP_LENGTH;

  const cardMinHeight = WINDOW_HEIGHT - insets.top - 52;

  useEffect(() => {
    if (timeLeft === 0) return;
    const intervalId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const handleResend = () => {
    setTimeLeft(30);
    setCode('');
    inputRef.current?.focus();
  };

  const handleVerify = () => {
    // Add verification API; on success:
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      }),
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={brand.dark} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}>
          <View style={styles.backRow}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
              <View style={styles.backRowInner}>
                <Text style={styles.backArrow}>←</Text>
                <Text style={styles.backLabel}>Go back</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.card,
              {
                minHeight: cardMinHeight,
                paddingBottom: 32,
              },
            ]}>
            <Text style={styles.cardTitle}>Verify your number</Text>
            <Text style={styles.cardSub}>
              Enter the 4-digit code we sent to{'\n'}
              <Text style={styles.highlightText}>
                +91 {phoneDisplay || '— — — — — — — — — —'}
              </Text>
            </Text>

            <View style={styles.otpContainer}>
              <TextInput
                ref={inputRef}
                style={styles.hiddenInput}
                value={code}
                onChangeText={setCode}
                maxLength={OTP_LENGTH}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoFocus
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />

              <TouchableOpacity
                style={styles.visualBoxesContainer}
                activeOpacity={1}
                onPress={() => inputRef.current?.focus()}>
                {Array(OTP_LENGTH)
                  .fill(0)
                  .map((_, index) => {
                    const digit = code[index] || '';
                    const isCurrentBox = isInputFocused && code.length === index;
                    const isBoxFilled = digit !== '';

                    return (
                      <View
                        key={index}
                        style={[
                          styles.otpBox,
                          isCurrentBox && styles.otpBoxFocused,
                          isBoxFilled && styles.otpBoxFilled,
                        ]}>
                        <Text style={styles.otpText}>{digit}</Text>
                      </View>
                    );
                  })}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.ctaButton, !isComplete && styles.ctaButtonDisabled]}
              activeOpacity={isComplete ? 0.85 : 1}
              disabled={!isComplete}
              onPress={handleVerify}>
              <Text style={[styles.ctaText, !isComplete && styles.ctaTextDisabled]}>
                Verify & Continue
              </Text>
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn&apos;t receive the code? </Text>
              <TouchableOpacity
                disabled={timeLeft > 0}
                onPress={handleResend}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.resendLink,
                    timeLeft > 0 && styles.resendLinkDisabled,
                  ]}>
                  {timeLeft > 0 ? `Resend in ${timeLeft}s` : 'Resend now'}
                </Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 0,
  },
  backRow: {
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: brand.dark,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
    marginTop: Platform.OS === 'ios' ? 1 : -5,
    ...Platform.select({
      android: { includeFontPadding: false },
    }),
  },
  backLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0.2,
    ...Platform.select({
      android: { includeFontPadding: false },
    }),
  },
  card: {
    flexGrow: 1,
    backgroundColor: brand.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 28,
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
    marginBottom: 40,
  },
  highlightText: {
    color: brand.cardHeading,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  otpContainer: {
    marginBottom: 40,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  visualBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  otpBox: {
    width: 68,
    height: 72,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: brand.inputBorder,
    backgroundColor: brand.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFocused: {
    borderColor: brand.inputBorderFocus,
    backgroundColor: brand.inputFocusBg,
    shadowColor: brand.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 2,
  },
  otpBoxFilled: {
    borderColor: brand.inputBorderFocus,
  },
  otpText: {
    fontSize: 28,
    fontWeight: '700',
    color: brand.cardHeading,
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

  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 32,
    paddingBottom: 8,
  },
  resendText: {
    fontSize: 14,
    color: brand.termsText,
    fontWeight: '500',
  },
  resendLink: {
    fontSize: 14,
    color: brand.termsLinkColor,
    fontWeight: '700',
  },
  resendLinkDisabled: {
    color: brand.termsText,
    fontWeight: '500',
  },
});
