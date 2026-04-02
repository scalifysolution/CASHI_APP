import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
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

type OnboardingNav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen() {
  const navigation = useNavigation<OnboardingNav>();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [refCode, setRefCode] = useState('');

  // Validation: Only Full Name is mandatory
  const isValid = fullName.trim().length >= 2;

  const handleSave = () => {
    // Add API logic to save the user profile, then:
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

              {/* Reference Code (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>
                  Reference Code <Text style={styles.optionalText}>(Optional)</Text>
                </Text>
                <View style={styles.inputWrapper} collapsable={false}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter code"
                    placeholderTextColor={brand.placeholder}
                    value={refCode}
                    onChangeText={setRefCode}
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
              </View>

            </View>

            {/* Push button to bottom if there's extra space, or just keep it below form */}
            <View style={styles.spacer} />

            <TouchableOpacity
              style={[styles.ctaButton, !isValid && styles.ctaButtonDisabled]}
              activeOpacity={isValid ? 0.85 : 1}
              // disabled={!isValid}
              onPress={handleSave}>
              <Text style={[styles.ctaText, !isValid && styles.ctaTextDisabled]}>
                Save & Continue
              </Text>
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
    marginBottom: 32,
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