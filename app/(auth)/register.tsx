import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ApiError } from '@/src/lib/api';
import { i18n } from '@/src/lib/i18n';
import { useAuth } from '@/src/stores/auth';
import { Button, Input, Screen, Title } from '@/src/ui/primitives';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const register = useAuth((s) => s.register);
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        password_confirmation: form.confirm,
        locale: i18n.language,
      });
      router.replace('/(tabs)');
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        const first = Object.values(e.errors)[0]?.[0];
        setError(first ?? e.message);
      } else {
        setError((e as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="flex-1 justify-center px-6">
          <Title className="text-3xl">{t('auth.register')}</Title>
          <View className="mt-8 gap-4">
            <Input value={form.name} onChangeText={set('name')} placeholder={t('auth.name')} autoCapitalize="words" />
            <Input value={form.username} onChangeText={set('username')} placeholder={t('auth.username')} />
            <Input value={form.email} onChangeText={set('email')} placeholder={t('auth.email')} keyboardType="email-address" />
            <Input value={form.password} onChangeText={set('password')} placeholder={t('auth.password')} secureTextEntry />
            <Input value={form.confirm} onChangeText={set('confirm')} placeholder={t('auth.confirmPassword')} secureTextEntry />
            {error ? <Text className="text-sm text-red-400">{error}</Text> : null}
            <Button title={t('auth.register')} onPress={submit} loading={loading} />
          </View>
          <Link href="/(auth)/login" className="mt-6 self-center">
            <Text className="text-base text-pitch-400">
              {t('auth.haveAccount')} {t('auth.login')}
            </Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
