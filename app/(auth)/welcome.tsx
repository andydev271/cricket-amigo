import { Link, router } from 'expo-router';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Screen, Subtitle, Title } from '@/src/ui/primitives';

export default function WelcomeScreen() {
  const { t } = useTranslation();

  return (
    <Screen className="justify-between px-6 pb-10">
      <View className="mt-20 items-center">
        <Text style={{ fontSize: 72 }}>🏏</Text>
        <Title className="mt-6 text-center text-3xl">{t('auth.welcomeTitle')}</Title>
        <Subtitle className="mt-3 text-center">{t('auth.welcomeSubtitle')}</Subtitle>
      </View>

      <View className="gap-3">
        <Button title={t('auth.getStarted')} onPress={() => router.push('/(auth)/register')} />
        <Button
          title={t('auth.login')}
          variant="secondary"
          onPress={() => router.push('/(auth)/login')}
        />
        <Button
          title={t('auth.continueGuest')}
          variant="ghost"
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </Screen>
  );
}
