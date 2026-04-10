import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AdCard from '../components/AdCard';
import Screen from '../components/Screen';
import { apiRequest } from '../lib/api';
import { apiBaseUrl } from '../lib/config';
import { colors } from '../theme';
import { AdListResponse, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [ads, setAds] = useState<AdListResponse['ads']>([]);

  const loadAds = useCallback(async (search = '') => {
    try {
      setError('');
      const response = await apiRequest<AdListResponse>('/api/ads', {
        query: { limit: 20, q: search || undefined, status: 'approved' },
      });
      setAds(response.ads);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت آگهی‌ها');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.content}
        data={ads}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true);
          loadAds();
        }} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>بازارینو روی موبایل</Text>
              <Text style={styles.heroText}>
                این نسخه React Native به API فعلی Next.js وصل است. Base URL فعلی: {apiBaseUrl}
              </Text>
            </View>

            <View style={styles.searchBox}>
              <TextInput
                placeholder="جستجو در آگهی‌ها"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => {
                  setLoading(true);
                  loadAds(query);
                }}
                returnKeyType="search"
                textAlign="right"
              />
              <Pressable
                onPress={() => {
                  setLoading(true);
                  loadAds(query);
                }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>جستجو</Text>
              </Pressable>
            </View>

            <View style={styles.quickActions}>
              <Pressable onPress={() => navigation.navigate('Register')} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>ثبت نام</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Info')} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>راهنمای Build</Text>
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.stateBox}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.stateText}>در حال دریافت آگهی‌ها...</Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.stateHint}>
                  اگر روی موبایل واقعی تست می‌کنید، `EXPO_PUBLIC_API_BASE_URL` را روی IP سیستم‌تان بگذارید.
                </Text>
              </View>
            ) : null}

            {!loading && !error ? <Text style={styles.sectionTitle}>آخرین آگهی‌ها</Text> : null}
          </View>
        }
        renderItem={({ item }) => (
          <AdCard ad={item} onPress={() => navigation.navigate('AdDetails', { adId: item._id, title: item.title })} />
        )}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateText}>آگهی‌ای پیدا نشد.</Text>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 14,
  },
  header: {
    gap: 14,
    marginBottom: 6,
  },
  hero: {
    backgroundColor: colors.primaryDark,
    borderRadius: 28,
    padding: 18,
    gap: 8,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'right',
  },
  heroText: {
    color: '#ffedd5',
    lineHeight: 22,
    textAlign: 'right',
  },
  searchBox: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  input: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.background,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
  },
  stateBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  stateText: {
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  stateHint: {
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 8,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'right',
    fontWeight: '700',
  },
});
