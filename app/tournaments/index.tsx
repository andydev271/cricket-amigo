import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { api, type TournamentListItem } from '@/src/lib/api';
import { Button, Card, EmptyState, Screen, Title } from '@/src/ui/primitives';

export default function TournamentsScreen() {
  const { t } = useTranslation();
  const [list, setList] = useState<TournamentListItem[] | null>(null);

  const load = useCallback(() => {
    api.tournaments.list().then(setList).catch(() => setList([]));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: t('tournaments.title') }} />
      <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
        <Title>{t('tournaments.title')}</Title>
        <Button
          title={t('tournaments.new')}
          onPress={() => router.push('/tournaments/new')}
          className="px-4 py-2.5"
        />
      </View>
      {list === null ? null : list.length === 0 ? (
        <EmptyState title={t('tournaments.empty')} hint={t('tournaments.emptyHint')} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(x) => String(x.id)}
          contentContainerClassName="px-5 pb-8"
          renderItem={({ item: tr }) => (
            <Pressable onPress={() => router.push(`/tournaments/${tr.id}`)} className="mb-3">
              <Card>
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 text-base font-bold text-slate-50" numberOfLines={1}>
                    {tr.name}
                  </Text>
                  <Text
                    className={`text-xs font-bold uppercase ${
                      tr.status === 'live' ? 'text-red-400' : 'text-slate-500'
                    }`}
                  >
                    {tr.status}
                  </Text>
                </View>
                <Text className="mt-1 text-sm text-slate-400">
                  {tr.teams_count}/{tr.max_teams} {t('tournaments.teams')} · {tr.overs_limit}ov
                  {tr.city ? ` · ${tr.city}` : ''}
                </Text>
              </Card>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
