import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '../api/client';
import { API_BASE_URL } from '../config/env';
import { brand } from '../theme';
import { getCustomerPinnedLocation } from '../utils/customerPinnedLocation';
import { requestLocationCoords } from '../utils/requestLocationCoords';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = 16;
const HORIZONTAL_PADDING = 20;
const COLUMN_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / 2;

type ShopItem = {
  id: string;
  name: string;
  username: string;
  cashiTag?: string | null;
  city: string | null;
  state: string | null;
  imageUrl: string | null;
  distanceKm?: number | null;
};

type ShopsResponse = {
  page: number;
  limit: number;
  total: number;
  suggestions: string[];
  items: ShopItem[];
};

const PAGE_SIZE = 20;
const NEARBY_LIMIT = 50;
const RADIUS_STEPS_KM = [2, 5, 10, 20, 35, 50];

function assetUrl(pathOrUrl: string | null) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!pathOrUrl.startsWith('/')) return pathOrUrl;
  const origin = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
  return `${origin}${pathOrUrl}`;
}

export function ShopsDirectoryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<ShopItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [radiusIndex, setRadiusIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingMoreRef = useRef(false);
  const reachedEndRef = useRef(false);

  useEffect(() => {
    const id = setTimeout(() => setSearch(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

  const isSearchMode = search.trim().length > 0;

  const getCoords = async (): Promise<{ latitude: number; longitude: number } | null> => {
    const pinned = await getCustomerPinnedLocation();
    if (pinned) return { latitude: pinned.latitude, longitude: pinned.longitude };
    const res = await requestLocationCoords();
    return res.coords;
  };

  const load = async (mode: 'initial' | 'refresh' | 'more') => {
    if (mode === 'more' && (loadingMoreRef.current || !hasMore)) return;
    if (mode === 'initial') setLoading(true);
    else if (mode === 'refresh') setRefreshing(true);
    else {
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }
    setError(null);
    try {
      if (isSearchMode) {
        const targetPage = mode === 'more' ? page + 1 : 1;
        const res = await apiRequest<ShopsResponse>(
          `/shops/public?page=${targetPage}&limit=${PAGE_SIZE}&q=${encodeURIComponent(search)}`,
          { method: 'GET' },
        );
        setPage(targetPage);
        setHasMore(targetPage * (res.limit ?? PAGE_SIZE) < (res.total ?? 0));
        setSuggestions(res.suggestions ?? []);
        setItems((prev) => (mode === 'more' ? [...prev, ...(res.items ?? [])] : res.items ?? []));
      } else {
        // Nearby-first directory: expand radius as user scrolls.
        const nextRadiusIndex =
          mode === 'more' ? Math.min(radiusIndex + 1, RADIUS_STEPS_KM.length - 1) : 0;
        const radiusKm = RADIUS_STEPS_KM[nextRadiusIndex] ?? 10;
        const coords = await getCoords();
        const path =
          coords != null
            ? `/shops/nearby?limit=${NEARBY_LIMIT}&radiusKm=${radiusKm}&lat=${encodeURIComponent(
                String(coords.latitude),
              )}&lng=${encodeURIComponent(String(coords.longitude))}`
            : `/shops/nearby?limit=${NEARBY_LIMIT}&radiusKm=${radiusKm}`;
        const res = await apiRequest<{ items: ShopItem[] }>(path, { method: 'GET' });
        const nextItems = res.items ?? [];

        setRadiusIndex(nextRadiusIndex);
        setSuggestions([]);

        setItems((prev) => {
          const base = mode === 'more' ? prev : [];
          const byId = new Map<string, ShopItem>();
          for (const it of base) byId.set(it.id, it);
          for (const it of nextItems) byId.set(it.id, it);
          const merged = Array.from(byId.values());
          merged.sort((a, b) => {
            const da = a.distanceKm == null ? Number.POSITIVE_INFINITY : Number(a.distanceKm);
            const db = b.distanceKm == null ? Number.POSITIVE_INFINITY : Number(b.distanceKm);
            return da - db;
          });
          return merged;
        });

        // Has more if we can still expand the radius.
        setHasMore(nextRadiusIndex < RADIUS_STEPS_KM.length - 1);
        setPage(1);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load shops');
    } finally {
      if (mode === 'initial') setLoading(false);
      else if (mode === 'refresh') setRefreshing(false);
      else {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    // Reset paging state when switching between nearby mode and search mode.
    setPage(1);
    setRadiusIndex(0);
    setHasMore(true);
    load('initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const headerText = useMemo(() => {
    if (loading) return 'Fetching partners...';
    if (error) return error;
    if (items.length === 0) return 'No partners found';
    return `${items.length} partner${items.length === 1 ? '' : 's'} available`;
  }, [loading, error, items.length]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={brand.dark} />
      
      {/* HEADER AREA */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <View style={styles.arrow} />
          </TouchableOpacity>
          <Text style={styles.title}>Discover Partners</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or @cashiTag"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {!!suggestions.length && (
          <FlatList
            horizontal
            data={suggestions}
            keyExtractor={(s) => s}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsRow}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.suggestionChip} onPress={() => setQuery(item)}>
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* LIST SHEET */}
      <View style={styles.sheet}>
        <Text style={styles.metaText}>{headerText}</Text>
        
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2} // <--- Set to 2 columns
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          columnWrapperStyle={styles.row} // <--- Styles the rows
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor={brand.blue} />
          }
          renderItem={({ item }) => {
            const img = assetUrl(item.imageUrl);
            const location = [item.city, item.state].filter(Boolean).join(', ');
            const handleRaw = String((item.cashiTag ?? item.username) ?? '').trim();
            const handle = handleRaw ? (handleRaw.startsWith('@') ? handleRaw : `@${handleRaw}`) : '';
            
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('ShopDetail', { shop: item })}>
                
                {/* Huge Image Area */}
                <View style={styles.imageWrap}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.cardImage} resizeMode="cover" />
                  ) : (
                    <Text style={styles.initial}>{(item.name?.[0] ?? 'S').toUpperCase()}</Text>
                  )}
                  
                  {/* Floating Distance Badge */}
                  {item.distanceKm != null && (
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceText}>{item.distanceKm} km</Text>
                    </View>
                  )}
                </View>

                {/* Details Area */}
                <View style={styles.cardDetails}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {!!handle && (
                    <Text style={styles.username} numberOfLines={1}>
                      {handle}
                    </Text>
                  )}
                  <Text style={styles.city} numberOfLines={1}>
                    {location || 'Location unavailable'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          onMomentumScrollBegin={() => {
            reachedEndRef.current = false;
          }}
          onEndReachedThreshold={0.35}
          onEndReached={() => {
            if (reachedEndRef.current || loading || refreshing || loadingMore || !hasMore) return;
            reachedEndRef.current = true;
            void load('more');
          }}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={brand.blue} size="small" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            loading ? null : (
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconWrap}>
                  <Text style={styles.emptyIcon}>🏪</Text>
                </View>
                <Text style={styles.emptyTitle}>No partners found</Text>
                <Text style={styles.emptySub}>
                  We couldn't find any shops matching "{query}". Try searching for something else.
                </Text>
              </View>
            )
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: brand.dark 
  },
  
  // Header
  header: { 
    paddingHorizontal: HORIZONTAL_PADDING, 
    paddingBottom: 24 
  },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: brand.surface,
    transform: [{ rotate: '-45deg' }],
    marginLeft: 4,
  },
  title: { 
    color: brand.surface, 
    fontSize: 20, 
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  placeholder: { width: 44, height: 44 },
  
  // Search
  searchContainer: {
    marginTop: 20,
  },
  searchInput: {
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    color: brand.surface,
    paddingHorizontal: 20,
    fontSize: 15,
    fontWeight: '500',
  },
  
  // Suggestions
  suggestionsRow: { 
    paddingTop: 16, 
    gap: 10 
  },
  suggestionChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  suggestionText: { 
    color: brand.surface, 
    fontSize: 13, 
    fontWeight: '700' 
  },
  
  // Main Sheet
  sheet: {
    flex: 1,
    backgroundColor: '#F4F6FB',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    overflow: 'hidden',
  },
  metaText: { 
    color: brand.helperColor, 
    fontSize: 11, 
    fontWeight: '800', 
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16, 
    paddingHorizontal: 28,
  },
  listContent: { 
    paddingHorizontal: HORIZONTAL_PADDING,
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: COLUMN_GAP,
  },
  
  // Grid Card
  card: {
    width: COLUMN_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECEEF4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden', // Ensures top image fits the rounded corners
  },
  imageWrap: {
    width: '100%',
    height: 130, // Large square-like image aspect
    backgroundColor: '#F8F9FB',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF4',
    position: 'relative',
  },
  cardImage: { 
    width: '100%', 
    height: '100%' 
  },
  initial: { 
    fontSize: 42, 
    fontWeight: '900', 
    color: '#D0D4E4' 
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  distanceText: {
    color: brand.dark,
    fontSize: 10,
    fontWeight: '800',
  },
  cardDetails: { 
    padding: 12,
  },
  name: { 
    color: brand.cardHeading, 
    fontSize: 15, 
    fontWeight: '800',
    marginBottom: 2,
  },
  username: { 
    color: brand.blue, 
    fontSize: 12, 
    fontWeight: '700',
    marginBottom: 6,
  },
  city: { 
    color: brand.helperColor, 
    fontSize: 11, 
    fontWeight: '600' 
  },
  
  // States
  footer: { 
    paddingVertical: 20, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  emptyWrap: { 
    paddingVertical: 40, 
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 20,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: { 
    color: brand.cardHeading, 
    fontSize: 18, 
    fontWeight: '900',
    marginBottom: 8,
  },
  emptySub: {
    color: brand.helperColor,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  }
});