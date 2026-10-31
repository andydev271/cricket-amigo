import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { api, type LeaderboardEntry } from '@/src/lib/api';
import { Card, EmptyState, Screen, Title } from '@/src/ui/primitives';

export default function LeaderboardScreen() {
  const { t } = useTranslation();
  const [data, setData] = useState<{ batting: LeaderboardEntry[]; bowling: LeaderboardEntry[] } | null>(null);
  const [kind, setKind] = useState<'batting' | 'bowling'>('batting');

  useEffect(() => {
    api.community.leaderboards().then(setData).catch(() => setData({ batting: [], bowling: [] }));
  }, []);

  const rows = data?.[kind] ?? [];

  return (
    <Screen>
      <Stack.Screen options={{ title: t('community.leaderboard') }} />
      <View className="px-5 pt-2">
        <Title className="mb-3">{t('community.leaderboard')}</Title>
        <View className="mb-4 flex-row">
          {(['batting', 'bowling'] as const).map((k) => (
            <Pressable
              key={k}
              onPress={() => setKind(k)}
              className={`mr-2 rounded-full px-4 py-2 ${kind === k ? 'bg-pitch-500' : 'bg-night-700'}`}
            >
              <Text className={kind === k ? 'font-bold text-pitch-950' : 'text-slate-300'}>
                {t(`community.${k}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {data === null ? null : rows.length === 0 ? (
        <EmptyState title={t('community.emptyLb')} hint={t('community.emptyLbHint')} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r, i) => `${r.user.id}-${i}`}
          contentContainerClassName="px-5 pb-8"
          renderItem={({ item: r, index }) => (
            <Card className="mb-2 py-3">
              <View className="flex-row items-center">
                <Text className="w-8 text-base font-bold text-gold-400">#{index + 1}</Text>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-50">{r.user.name}</Text>
                  <Text className="text-xs text-slate-500">
                    {r.user.username ? `@${r.user.username}` : ''}
                    {r.user.city ? ` · ${r.user.city}` : ''}
                  </Text>
                </View>
                <Text className="text-base font-bold text-pitch-400">
                  {kind === 'batting' ? `${r.runs} ${t('community.runsAbbr')}` : `${r.wickets} ${t('community.wktsAbbr')}`}
                </Text>
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
