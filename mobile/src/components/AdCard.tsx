import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AdSummary } from '../types';
import { colors } from '../theme';
import { formatDate, formatPrice } from '../lib/format';

type AdCardProps = {
  ad: AdSummary;
  onPress: () => void;
};

export default function AdCard({ ad, onPress }: AdCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <LinearGradient colors={['#ffffff', '#fff7ed']} style={styles.gradient}>
        <View style={styles.topRow}>
          <View style={styles.badges}>
            {ad.isFeatured ? <Text style={[styles.badge, styles.featured]}>ویژه</Text> : null}
            {ad.isUrgent ? <Text style={[styles.badge, styles.urgent]}>فوری</Text> : null}
          </View>
          <Text style={styles.city}>{ad.city}</Text>
        </View>

        <Text style={styles.title}>{ad.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {ad.description}
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.metaGroup}>
            <Text style={styles.price}>{formatPrice(ad.price, ad.priceType, ad.currency)}</Text>
            <Text style={styles.meta}>
              {ad.category} / {ad.subcategory}
            </Text>
          </View>
          <View style={styles.metaGroupRight}>
            <Text style={styles.meta}>{formatDate(ad.createdAt)}</Text>
            <Text style={styles.meta}>{ad.views || 0} بازدید</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  gradient: {
    padding: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  featured: {
    backgroundColor: colors.primary,
  },
  urgent: {
    backgroundColor: colors.danger,
  },
  city: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  metaGroup: {
    flex: 1,
    gap: 4,
  },
  metaGroupRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  price: {
    color: colors.primaryDark,
    fontWeight: '800',
    fontSize: 16,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
