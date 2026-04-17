import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { apiRequest } from '../api/client';
import { fetchMe } from '../store/authSlice';
import { brand } from '../theme';
import { formatINForDisplay } from '../utils/phone';

// --- Professional Field Icons ---
const FieldIcon = ({ type, focused }: { type: 'user' | 'phone' | 'mail'; focused?: boolean }) => {
  const color = focused ? brand.blue : brand.helperColor;
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
};

const LockIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={brand.placeholder} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

const CameraIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <Circle cx="12" cy="13" r="4" />
  </Svg>
);

export function EditProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.accessToken);
  const { displayName, phone: userPhone, email: userEmail } = useAppSelector((s) => s.user);

  const [form, setForm] = useState({
    name: displayName,
    phone: userPhone,
    email: userEmail,
  });

  const [focused, setFocused] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!token) {
      Alert.alert('Not logged in', 'Please login again.');
      return;
    }
    const name = String(form.name ?? '').trim();
    if (name.length < 2) {
      Alert.alert('Invalid name', 'Name must be at least 2 characters.');
      return;
    }
    if (saving) return;

    setSaving(true);
    try {
      await apiRequest('/users/me/profile', {
        method: 'PATCH',
        token,
        body: { name },
      });
      // Pull fresh /auth/me so Redux + local storage are updated consistently.
      await dispatch(fetchMe(token) as any);
      Alert.alert('Profile Updated', 'Your profile details have been saved.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Update failed', e?.message ?? 'Could not update profile.');
    } finally {
      setSaving(false);
    }
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* --- ELITE DARK HEADER --- */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
            <View style={styles.backArrow} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

        {/* --- AVATAR SECTION --- */}
        <View style={styles.avatarSection}>
          <TouchableOpacity activeOpacity={0.8} style={styles.avatarWrap}>
            <View style={styles.avatarBase}>
              <Text style={styles.avatarLetter}>{(form.name.trim()[0] || '?').toUpperCase()}</Text>
            </View>
            <View style={styles.editBadge}>
              <CameraIcon />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- FORM SHEET --- */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: insets.bottom + 40 }}
          >
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>FULL NAME</Text>
              <View style={[styles.inputWrapper, focused === 'name' && styles.inputFocused]}>
                <FieldIcon type="user" focused={focused === 'name'} />
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={(t: string) => setForm({...form, name: t})}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                  placeholder="Enter your name"
                  placeholderTextColor={brand.placeholder}
                />
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>MOBILE NUMBER</Text>
              <View style={[styles.inputWrapper, styles.disabledInput]}>
                <FieldIcon type="phone" />
                <TextInput
                  style={[styles.input, styles.inputTextDisabled]}
                  value={formatINForDisplay(form.phone)}
                  editable={false}
                />
                <LockIcon />
              </View>
              <Text style={styles.helperText}>Used for secure login and account recovery.</Text>
            </View>

            {/* Email Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={[styles.inputWrapper, styles.disabledInput]}>
                <FieldIcon type="mail" />
                <TextInput
                  style={[styles.input, styles.inputTextDisabled]}
                  value={form.email}
                  editable={false}
                />
                <LockIcon />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity 
              style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
              activeOpacity={0.9}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving Changes...' : 'Save Changes'}</Text>
            </TouchableOpacity>

            {/* Danger Zone */}
            <View style={styles.dangerZone}>
              <Text style={styles.dangerTitle}>Danger Zone</Text>
              <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.8} onPress={confirmDeleteAccount}>
                <Text style={styles.deleteBtnText}>Delete Account</Text>
              </TouchableOpacity>
            </View>

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
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 24 },
  backCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  backArrow: { width: 10, height: 10, borderLeftWidth: 2, borderTopWidth: 2, borderColor: brand.surface, transform: [{ rotate: '-45deg' }], marginLeft: 4 },
  headerTitle: { color: brand.surface, fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  placeholder: { width: 44 },

  // Avatar
  avatarSection: { alignItems: 'center', paddingBottom: 10 },
  avatarWrap: { width: 104, height: 104, position: 'relative' },
  avatarBase: { flex: 1, borderRadius: 52, backgroundColor: '#2A2A32', borderWidth: 4, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: brand.surface, fontSize: 38, fontWeight: '900' },
  editBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: brand.blue, 
    borderWidth: 3, 
    borderColor: brand.dark, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },

  // Sheet
  sheet: { flex: 1, backgroundColor: '#F8F9FB', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -24 },
  sheetHandle: { width: 40, height: 5, backgroundColor: '#E2E5F1', borderRadius: 3, alignSelf: 'center', marginTop: 12, marginBottom: 12 },
  
  // Form Fields
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '900', color: brand.helperColor, marginBottom: 8, marginLeft: 4, letterSpacing: 1.2 },
  helperText: { fontSize: 12, color: brand.placeholder, marginTop: 8, marginLeft: 4, fontWeight: '500' },
  
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: brand.surface, 
    borderRadius: 18, 
    paddingHorizontal: 16, 
    height: 60,
    borderWidth: 1.5,
    borderColor: '#EAECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  inputFocused: { borderColor: brand.blue, backgroundColor: '#F4F7FF' },
  disabledInput: { backgroundColor: '#F0F1F7', borderColor: '#EAECEF' },
  input: { flex: 1, marginLeft: 14, fontSize: 16, fontWeight: '700', color: brand.cardHeading },
  inputTextDisabled: { color: brand.helperColor },

  // Buttons
  saveBtn: {
    backgroundColor: brand.dark,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: brand.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  saveBtnText: { color: brand.surface, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  
  // Danger Zone
  dangerZone: { 
    marginTop: 48,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#EAECEF',
    alignItems: 'center'
  },
  dangerTitle: { fontSize: 12, fontWeight: '800', color: brand.placeholder, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 16 },
  deleteBtn: { 
    backgroundColor: '#FFF0F0', 
    paddingVertical: 14, 
    paddingHorizontal: 24, 
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  deleteBtnText: { color: '#FF5252', fontSize: 14, fontWeight: '800' },
});