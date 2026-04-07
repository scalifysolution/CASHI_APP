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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '../api/client';
import { API_BASE_URL } from '../config/env';
import { brand } from '../theme';

type ShopItem = {
  id: string;
  name: string;
  username: string;
  city: string | null;
  state: string | null;
  imageUrl: string | null;
};

type ShopsResponse = {
  page: number;
  limit: number;
  total: number;
  suggestions: string[];
  items: ShopItem[];
};

const PAGE_SIZE = 20;

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
      const targetPage = mode === 'more' ? page + 1 : 1;
      const res = await apiRequest<ShopsResponse>(
        `/shops/public?page=${targetPage}&limit=${PAGE_SIZE}&q=${encodeURIComponent(search)}`,
        { method: 'GET' },
      );
      setPage(targetPage);
      setHasMore(targetPage * (res.limit ?? PAGE_SIZE) < (res.total ?? 0));
      setSuggestions(res.suggestions ?? []);
      setItems((prev) => (mode === 'more' ? [...prev, ...(res.items ?? [])] : res.items ?? []));
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
    load('initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const headerText = useMemo(() => {
    if (loading) return 'Loading shops...';
    if (error) return error;
    return `${items.length} shop${items.length === 1 ? '' : 's'} found`;
  }, [loading, error, items.length]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={brand.dark} />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <View style={styles.arrow} />
          </TouchableOpacity>
          <Text style={styles.title}>All Shops</Text>
          <View style={styles.placeholder} />
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or @username"
          placeholderTextColor={brand.helperColor}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
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

      <View style={styles.sheet}>
        <Text style={styles.metaText}>{headerText}</Text>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor={brand.blue} />
          }
          renderItem={({ item }) => {
            const img = assetUrl(item.imageUrl);
            return (
              <View style={styles.card}>
                <View style={styles.logoWrap}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.logoImage} resizeMode="cover" />
                  ) : (
                    <Text style={styles.initial}>{(item.name?.[0] ?? 'S').toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.username}>@{item.username}</Text>
                  <Text style={styles.city} numberOfLines={1}>
                    {[item.city, item.state].filter(Boolean).join(', ') || 'Location unavailable'}
                  </Text>
                </View>
              </View>
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
                <Text style={styles.emptyTitle}>No approved shops found</Text>
              </View>
            )
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brand.dark },
  header: { paddingHorizontal: 20, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
  title: { color: brand.surface, fontSize: 20, fontWeight: '800' },
  placeholder: { width: 38, height: 38 },
  searchInput: {
    marginTop: 14,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: brand.surface,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionsRow: { paddingTop: 10, gap: 8 },
  suggestionChip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  suggestionText: { color: brand.surface, fontSize: 12, fontWeight: '700' },
  sheet: {
    flex: 1,
    backgroundColor: brand.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  metaText: { color: brand.helperColor, fontSize: 12, fontWeight: '700', marginBottom: 10 },
  listContent: { paddingBottom: 120 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brand.surface,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F1F7',
  },
  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: brand.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: { width: '100%', height: '100%' },
  initial: { fontSize: 20, fontWeight: '900', color: brand.cardHeading },
  name: { color: brand.cardHeading, fontSize: 15, fontWeight: '800' },
  username: { color: brand.blue, fontSize: 12, fontWeight: '700', marginTop: 2 },
  city: { color: brand.helperColor, fontSize: 12, fontWeight: '600', marginTop: 2 },
  footer: { paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { paddingVertical: 28, alignItems: 'center' },
  emptyTitle: { color: brand.cardHeading, fontSize: 14, fontWeight: '800' },
});
