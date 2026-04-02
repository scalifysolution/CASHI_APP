import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { STORE_SIGNUP_URL } from '../config/env';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setUser } from '../store/userSlice';
import { brand } from '../theme';

// --- Professional Field Icons ---
const FieldIcon = ({ type }: { type: 'user' | 'phone' | 'mail' }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={brand.helperColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {type === 'user' && (
      <>
        <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <Circle cx="12" cy="7" r="4" />
      </>
    )}
    {type === 'phone' && <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />}
    {type === 'mail' && (
      <>
        <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <Path d="M22 6l-10 7L2 6" />
      </>
    )}
  </Svg>
);

export function EditProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { displayName, phone: userPhone, email: userEmail, cashiBusiness } = useAppSelector((s) => s.user);

  const [form, setForm] = useState({
    name: displayName,
    phone: userPhone,
    email: userEmail,
  });

  const [focused, setFocused] = useState<string | null>(null);

  const handleSave = () => {
    dispatch(
      setUser({
        displayName: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone,
      }),
    );
    Alert.alert('Profile Updated', 'Your changes have been saved successfully.');
    navigation.goBack();
  };

  const resetToLogin = () => {
    const parent = navigation.getParent?.() ?? navigation;
    parent.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      }),
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This will permanently remove your account and data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: resetToLogin },
      ],
    );
  };

  const goRegisterSale = () => {
    if (cashiBusiness) {
      navigation.navigate('MerchantPortal');
    } else {
      Linking.openURL(STORE_SIGNUP_URL);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* --- ELITE DARK HEADER --- */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
            <View style={styles.backArrow} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

        {/* --- AVATAR EDITOR --- */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarBase}>
              <Text style={styles.avatarLetter}>{(form.name.trim()[0] || '?').toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.editBadge} activeOpacity={0.8}>
               <View style={styles.cameraIcon} />
            </TouchableOpacity>
          </View>
          <Text style={styles.changePhotoTxt}>Change Profile Photo</Text>
        </View>
      </View>

      {/* --- FORM SHEET --- */}
      <View style={styles.sheet}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: insets.bottom + 20 }}
          >
            {/* Full Name */}
            <Text style={styles.label}>Full Name</Text>
            <View style={[styles.inputWrapper, focused === 'name' && styles.inputFocused]}>
              <FieldIcon type="user" />
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(t) => setForm({...form, name: t})}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
                placeholder="Enter your name"
                placeholderTextColor={brand.placeholder}
              />
            </View>

            {/* Phone Number */}
            <Text style={styles.label}>Mobile Number</Text>
            <View style={[styles.inputWrapper, styles.disabledInput]}>
              <FieldIcon type="phone" />
              <TextInput
                style={[styles.input, { color: brand.helperColor }]}
                value={form.phone}
                editable={false} // Usually primary ID, non-editable for security
              />
              <View style={styles.lockIcon} />
            </View>

            {/* Email Address */}
            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputWrapper, focused === 'email' && styles.inputFocused]}>
              <FieldIcon type="mail" />
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(t) => setForm({...form, email: t})}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                placeholder="Enter your email"
                placeholderTextColor={brand.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity 
              style={styles.saveBtn} 
              activeOpacity={0.9}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={confirmDeleteAccount}>
               <Text style={styles.deleteBtnText}>Delete account</Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brand.dark },
  
  // Header
  header: { paddingBottom: 40 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 25 },
  backCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  backArrow: { width: 10, height: 10, borderLeftWidth: 2, borderTopWidth: 2, borderColor: brand.surface, transform: [{ rotate: '-45deg' }], marginLeft: 4 },
  headerTitle: { color: brand.surface, fontSize: 18, fontWeight: '800' },
  placeholder: { width: 40 },

  // Avatar
  avatarSection: { alignItems: 'center' },
  avatarWrap: { width: 100, height: 100 },
  avatarBase: { flex: 1, borderRadius: 50, backgroundColor: '#2A2A32', borderWidth: 3, borderColor: brand.surface, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: brand.surface, fontSize: 40, fontWeight: '800' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: brand.blue, borderWidth: 3, borderColor: brand.dark, alignItems: 'center', justifyContent: 'center' },
  cameraIcon: { width: 10, height: 8, backgroundColor: brand.surface, borderRadius: 1 },
  changePhotoTxt: { color: brand.heroBody, fontSize: 13, fontWeight: '700', marginTop: 16 },

  // Sheet
  sheet: { flex: 1, backgroundColor: brand.background, borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: -20 },
  
  label: { fontSize: 13, fontWeight: '800', color: brand.cardHeading, marginBottom: 8, marginTop: 24, marginLeft: 4 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: brand.surface, 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    height: 56,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.015,
    shadowRadius: 5,
    elevation: 1,
  },
  inputFocused: { borderColor: brand.blue, backgroundColor: brand.surface },
  disabledInput: { backgroundColor: '#F0F1F7', borderColor: 'transparent' },
  input: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '600', color: brand.cardHeading },
  lockIcon: { width: 8, height: 10, backgroundColor: brand.placeholder, borderRadius: 1, opacity: 0.5 },

  // Buttons
  saveBtn: {
    backgroundColor: brand.blue,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    shadowColor: brand.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: { color: brand.surface, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  
  registerSaleBtn: {
    marginTop: 16,
    height: 52,
    borderRadius: 16,
    backgroundColor: brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerSaleBtnText: { color: brand.surface, fontSize: 15, fontWeight: '800' },
  deleteBtn: { marginTop: 20, alignSelf: 'center', padding: 10 },
  deleteBtnText: { color: '#FF6B6B', fontSize: 14, fontWeight: '700' },
});