import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Screen from '../components/Screen';
import { apiRequest } from '../lib/api';
import { colors } from '../theme';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, phone, city }),
      });

      setMessage('ثبت نام با موفقیت انجام شد. برای ورود موبایلی باید auth اختصاصی token-based اضافه شود.');
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setCity('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ثبت نام انجام نشد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.card}>
        <Text style={styles.title}>ثبت نام کاربر جدید</Text>
        <Text style={styles.subtitle}>
          این فرم مستقیم به `POST /api/auth/register` وصل است و کاربر را در همان دیتابیس فعلی می‌سازد.
        </Text>

        <TextInput style={styles.input} placeholder="نام" value={name} onChangeText={setName} textAlign="right" />
        <TextInput
          style={styles.input}
          placeholder="ایمیل"
          value={email}
          onChangeText={setEmail}
          textAlign="right"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="رمز عبور"
          value={password}
          onChangeText={setPassword}
          textAlign="right"
          secureTextEntry
        />
        <TextInput style={styles.input} placeholder="تلفن" value={phone} onChangeText={setPhone} textAlign="right" />
        <TextInput style={styles.input} placeholder="شهر" value={city} onChangeText={setCity} textAlign="right" />

        <Pressable onPress={submit} disabled={loading} style={styles.button}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>ثبت نام</Text>}
        </Pressable>

        {message ? <Text style={styles.successText}>{message}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 18,
    gap: 12,
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
    lineHeight: 22,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
  },
  successText: {
    color: colors.success,
    textAlign: 'right',
    lineHeight: 22,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'right',
    lineHeight: 22,
  },
});
