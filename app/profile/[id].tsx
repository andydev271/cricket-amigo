import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { api, ApiUser } from '@/src/lib/api';
import { useAuth } from '@/src/stores/auth';
import { Card, Screen, Title } from '@/src/ui/primitives';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useAuth((s) => s.user);
  const [user, setUser] = useState<ApiUser | null>(id === 'me' ? me : null);

  useEffect(() => {
    if (id && id !== 'me') {
      api.users.show(Number(id)).then(setUser).catch(() => setUser(null));
    }
  }, [id]);

  const display = user ?? me;

  return (
    <Screen>
      <Stack.Screen options={{ title: t('profile.title') }} />
      <ScrollView contentContainerClassName="items-center px-5 pb-10 pt-6">
        <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-night-800">
          {display?.avatar_url ? (
            <Image source={{ uri: display.avatar_url }} style={{ width: 96, height: 96 }} />
          ) : (
            <Text className="text-3xl font-bold text-pitch-400">
              {(display?.name?.[0] ?? '?').toUpperCase()}
            </Text>
          )}
        </View>
        <Title className="mt-4">{display?.name ?? ''}</Title>
        {display?.username ? (
          <Text className="mt-1 text-base text-slate-400">@{display.username}</Text>
        ) : null}
        {display?.city ? (
          <Text className="mt-1 text-sm text-slate-500">
            {display.city}{display.country ? `, ${display.country}` : ''}
          </Text>
        ) : null}

        <View className="mt-8 w-full flex-row gap-3">
          <Card className="flex-1 items-center">
            <Text className="text-2xl font-bold text-pitch-400">{display?.credits ?? 0}</Text>
            <Text className="mt-1 text-xs text-slate-400">{t('profile.credits')}</Text>
          </Card>
          <Card className="flex-1 items-center">
            <Text className="text-2xl font-bold text-pitch-400">{display?.friend_count ?? 0}</Text>
            <Text className="mt-1 text-xs text-slate-400">{t('profile.friends')}</Text>
          </Card>
          <Card className="flex-1 items-center">
            <Text className="text-2xl font-bold text-pitch-400">—</Text>
            <Text className="mt-1 text-xs text-slate-400">{t('profile.stats')}</Text>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}
