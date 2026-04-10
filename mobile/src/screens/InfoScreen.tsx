import { StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import { apiBaseUrl } from '../lib/config';
import { colors } from '../theme';

const steps = [
  'وب را با `npm run dev` در ریشه repo روی پورت 3000 بالا بیاور.',
  'در پوشه mobile، متغیر `EXPO_PUBLIC_API_BASE_URL` را به IP سیستم خودت بده؛ مثلا `http://192.168.1.20:3000`.',
  'اپ موبایل را با `npm run start` یا `npm run android` اجرا کن.',
  'برای خروجی APK از EAS Build استفاده کن: `npx eas-cli build --platform android --profile preview`.',
];

export default function InfoScreen() {
  return (
    <Screen scroll>
      <View style={styles.card}>
        <Text style={styles.title}>راهنمای اجرای اندروید</Text>
        <Text style={styles.subtitle}>Base URL فعلی اپ: {apiBaseUrl}</Text>
        {steps.map((step) => (
          <View key={step} style={styles.stepRow}>
            <Text style={styles.stepBullet}>•</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>وضعیت فعلی</Text>
        <Text style={styles.stepText}>
          این نسخه برای مرور آگهی‌ها، جزئیات آگهی و ثبت نام آماده است. لاگین فعلی وب بر پایه cookie/NextAuth است و برای موبایل باید token flow اختصاصی اضافه شود.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'right',
  },
  subtitle: {
    color: colors.textMuted,
    textAlign: 'right',
  },
  stepRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  stepBullet: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    color: colors.text,
    lineHeight: 24,
    textAlign: 'right',
  },
});
