import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import { apiRequest } from '../lib/api';
import { formatDate, formatPrice } from '../lib/format';
import { colors } from '../theme';
import { AdDetailsResponse, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AdDetails'>;

export default function AdDetailsScreen({ route, navigation }: Props) {
  const { adId, title } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<AdDetailsResponse['ad'] | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: title || 'جزئیات آگهی' });
  }, [navigation, title]);

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const response = await apiRequest<AdDetailsResponse>(`/api/ads/${adId}`);
        setData(response.ad);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطا در دریافت آگهی');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [adId]);

  const phone = data?.showPhone ? data?.phone || data?.userId?.phone : undefined;
  const email = data?.showEmail ? data?.email || data?.userId?.email : undefined;

  return (
    <Screen scroll>
      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.stateText}>در حال دریافت جزئیات...</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {data ? (
        <>
          <View style={styles.heroCard}>
            <Text style={styles.title}>{data.title}</Text>
            <Text style={styles.price}>{formatPrice(data.price, data.priceType, data.currency)}</Text>
            <Text style={styles.meta}>
              {data.city} • {formatDate(data.createdAt)} • {data.views || 0} بازدید
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>توضیحات</Text>
            <Text style={styles.paragraph}>{data.description}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>اطلاعات تماس</Text>
            <Text style={styles.paragraph}>فروشنده: {data.userId?.name || 'نامشخص'}</Text>
            <Text style={styles.paragraph}>شهر: {data.userId?.city || data.city}</Text>
            {phone ? (
              <Pressable onPress={() => Linking.openURL(`tel:${phone}`)} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>تماس: {phone}</Text>
              </Pressable>
            ) : null}
            {email ? (
              <Pressable onPress={() => Linking.openURL(`mailto:${email}`)} style={styles.secondaryActionButton}>
                <Text style={styles.secondaryActionButtonText}>ایمیل: {email}</Text>
              </Pressable>
            ) : null}
          </View>

          {data.housing ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>جزئیات ملک</Text>
              <Text style={styles.paragraph}>ودیعه: {formatPrice(data.housing.deposit, 'fixed', data.currency)}</Text>
              <Text style={styles.paragraph}>
                اقامت: {data.housing.residenceEligible ? 'مناسب برای اقامت' : 'بدون وضعیت اقامت'}
              </Text>
              {data.housing.address ? <Text style={styles.paragraph}>آدرس: {data.housing.address}</Text> : null}
              {data.housing.preferredUniversity ? (
                <Text style={styles.paragraph}>دانشگاه ترجیحی: {data.housing.preferredUniversity}</Text>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: 28,
    padding: 20,
    gap: 8,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'right',
  },
  price: {
    color: '#ffedd5',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
  meta: {
    color: '#fed7aa',
    textAlign: 'right',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderColor: colors.border,
    borderWidth: 1,
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
  },
  paragraph: {
    color: colors.text,
    lineHeight: 24,
    textAlign: 'right',
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  secondaryActionButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryActionButtonText: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  stateBox: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  stateText: {
    color: colors.text,
  },
  errorBox: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 20,
    padding: 18,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'right',
    fontWeight: '700',
  },
});
