import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand } from '../theme';
import { geocodeSearch, type GeocodeResult } from '../utils/googleGeocode';

type Props = {
  visible: boolean;
  onClose: () => void;
  headerTitle: string;
  currentFormattedAddress: string;
  onUseDeviceLocation: () => Promise<void>;
  onSelectResult: (result: GeocodeResult) => void;
  deviceBusy?: boolean;
};

// Clean, geometric pin
const GeometricPin = ({ color = brand.blue }: { color?: string }) => (
  <View style={[styles.geometricPin, { borderColor: color }]}>
    <View style={[styles.geometricPinInner, { backgroundColor: color }]} />
  </View>
);

export function LocationPickerModal({
  visible,
  onClose,
  headerTitle,
  currentFormattedAddress,
  onUseDeviceLocation,
  onSelectResult,
  deviceBusy,
}: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GeocodeResult[]>([]);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
      setSearching(false);
    }
  }, [visible]);

  const runSearch = useCallback(async () => {
    const qly = query.trim();
    if (qly.length < 3) return;
    setSearching(true);
    try {
      const rows = await geocodeSearch(qly);
      setResults(rows);
    } finally {
      setSearching(false);
    }
  }, [query]);

  const hasResolvedAddress = Boolean(currentFormattedAddress?.trim());

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {/* FIX: KeyboardAvoidingView is now the outermost container. 
        This anchors the sheet flush to the bottom edge and stops it from floating.
      */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}>
        
        {/* Absolute dark backdrop to close the modal */}
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <Pressable
          style={[
            styles.sheet,
            // FIX: Smooth bottom padding combining safe area and base margin
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.headerTitles}>
              <Text style={styles.headerOverline}>Set Your Location</Text>
              <Text style={styles.title}>{headerTitle}</Text>
            </View>
            <TouchableOpacity
              style={styles.closePill}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close">
              <Text style={styles.closePillText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.addressCard, hasResolvedAddress ? styles.addressCardFilled : null]}>
            <View style={styles.addressCardIcon}>
              <GeometricPin color={hasResolvedAddress ? brand.blue : brand.helperColor} />
            </View>
            <View style={styles.addressCardBody}>
              {hasResolvedAddress ? (
                <>
                  <Text style={styles.addressCardLabel}>Selected area</Text>
                  <Text style={styles.addressCardMain} numberOfLines={3}>
                    {currentFormattedAddress.trim()}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.addressEmptyTitle}>No location set</Text>
                  <Text style={styles.addressEmptyBody}>
                    Enable GPS or search for an area to discover partners nearby.
                  </Text>
                </>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, deviceBusy ? styles.primaryBtnDisabled : null]}
            onPress={() => void onUseDeviceLocation()}
            disabled={deviceBusy}
            activeOpacity={0.88}>
            {deviceBusy ? (
              <ActivityIndicator color={brand.surface} size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>Use current GPS location</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR SEARCH MANUALLY</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="e.g. Connaught Place, New Delhi"
              placeholderTextColor={brand.placeholder}
              style={styles.input}
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => void runSearch()}
            />
            <TouchableOpacity
              style={[
                styles.searchActionBtn,
                searching || query.trim().length < 3 ? styles.primaryBtnDisabled : null,
              ]}
              onPress={() => void runSearch()}
              disabled={searching || query.trim().length < 3}
              activeOpacity={0.8}>
              {searching ? (
                <ActivityIndicator color={brand.surface} size="small" />
              ) : (
                <Text style={styles.searchActionText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          {(results.length > 0 || (query.trim().length >= 3 && !searching)) && (
            <Text style={styles.resultsHeading}>Results</Text>
          )}

          <FlatList
            data={results}
            keyExtractor={(item, i) => `${item.latitude},${item.longitude},${i}`}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              results.length === 0 && !searching && query.trim().length >= 3 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyTitle}>No matches found</Text>
                  <Text style={styles.emptySub}>Try searching for a broader area or landmark.</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultRow}
                onPress={() => {
                  onSelectResult(item);
                  onClose();
                }}
                activeOpacity={0.8}>
                <View style={styles.resultIconWrap}>
                  <GeometricPin color={brand.helperColor} />
                </View>
                <View style={styles.resultCopy}>
                  <Text style={styles.resultMain} numberOfLines={1}>
                    {item.shortLabel}
                  </Text>
                  <Text style={styles.resultSub} numberOfLines={2}>
                    {item.formattedAddress}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardWrap: {
    flex: 1,
    backgroundColor: 'rgba(14,18,28,0.6)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 8,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 24,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E0E2EE',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitles: { flex: 1, paddingRight: 12 },
  headerOverline: {
    fontSize: 10,
    fontWeight: '800',
    color: brand.blue,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: { fontSize: 24, fontWeight: '800', color: brand.cardHeading, letterSpacing: -0.5 },
  closePill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F6FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePillText: { fontSize: 16, color: brand.helperColor, fontWeight: '700' },

  geometricPin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  geometricPinInner: { width: 4, height: 4, borderRadius: 2 },

  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F6FB',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECEEF4',
  },
  addressCardFilled: {
    backgroundColor: 'rgba(59,158,232,0.06)',
    borderColor: 'rgba(59,158,232,0.2)',
  },
  addressCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  addressCardBody: { flex: 1, minWidth: 0, justifyContent: 'center' },
  addressCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: brand.blue,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  addressCardMain: { fontSize: 14, fontWeight: '700', color: brand.cardHeading, lineHeight: 20 },
  addressEmptyTitle: { fontSize: 15, fontWeight: '800', color: brand.cardHeading, marginBottom: 4 },
  addressEmptyBody: { fontSize: 13, fontWeight: '500', color: brand.helperColor, lineHeight: 18 },

  primaryBtn: {
    backgroundColor: brand.dark,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: 15, fontWeight: '800', color: brand.surface, letterSpacing: 0.2 },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#ECEEF4' },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 10,
    fontWeight: '800',
    color: brand.helperColor,
    letterSpacing: 1,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4, // Tighter margin so empty lists don't feel too gapped
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ECEEF4',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500',
    color: brand.cardHeading,
    backgroundColor: '#F8F9FB',
  },
  searchActionBtn: {
    marginLeft: 12,
    backgroundColor: brand.blue,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchActionText: { color: brand.surface, fontSize: 14, fontWeight: '800' },

  resultsHeading: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 11,
    fontWeight: '800',
    color: brand.helperColor,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  list: { maxHeight: 240 },
  listContent: { paddingBottom: 10 },
  emptyWrap: { paddingVertical: 20, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: brand.cardHeading, marginBottom: 6 },
  emptySub: { fontSize: 13, fontWeight: '500', color: brand.helperColor, textAlign: 'center' },

  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F6FB',
  },
  resultIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F6FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  resultCopy: { flex: 1 },
  resultMain: { fontSize: 15, fontWeight: '700', color: brand.cardHeading },
  resultSub: { fontSize: 13, fontWeight: '500', color: brand.helperColor, marginTop: 4, lineHeight: 18 },
});