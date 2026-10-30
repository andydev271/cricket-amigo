import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ApiError } from '@/src/lib/api';
import { useAuth } from '@/src/stores/auth';
import { Button, Input, Screen, Title } from '@/src/ui/primitives';

export default function LoginScreen() {
  const { t } = useTranslation();
  const login = useAuth((s) => s.login);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      router.replace('/(tabs)');
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 422
          ? t('auth.invalidCredentials')
          : (e as Error).message,
      );
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
          <Title className="text-3xl">{t('auth.login')}</Title>
          <View className="mt-8 gap-4">
            <Input
              value={identifier}
              onChangeText={setIdentifier}
              placeholder={t('auth.loginPlaceholder')}
              keyboardType="email-address"
            />
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.password')}
              secureTextEntry
            />
            {error ? <Text className="text-sm text-red-400">{error}</Text> : null}
            <Button title={t('auth.login')} onPress={submit} loading={loading} />
          </View>
          <Link href="/(auth)/register" className="mt-6 self-center">
            <Text className="text-base text-pitch-400">
              {t('auth.noAccount')} {t('auth.register')}
            </Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
