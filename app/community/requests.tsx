import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { api, type MatchRequestItem } from '@/src/lib/api';
import { Button, Card, EmptyState, Screen, Title } from '@/src/ui/primitives';

export default function MatchRequestsScreen() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<MatchRequestItem[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(() => {
    api.community.requests().then(setRequests).catch(() => setRequests([]));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const respond = async (id: number, action: 'accept' | 'decline' | 'cancel') => {
    setBusy(id);
    try {
      const res = await api.community.respond(id, action);
      if (res.match_id) {
        router.push(`/match/${res.match_id}`);
        return;
      }
      load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t('community.requests') }} />
      <View className="px-5 pb-3 pt-2">
        <Title>{t('community.requests')}</Title>
      </View>
      {requests === null ? null : requests.length === 0 ? (
        <EmptyState title={t('community.emptyRequests')} hint={t('community.emptyRequestsHint')} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(r) => String(r.id)}
          contentContainerClassName="px-5 pb-8"
          renderItem={({ item: r }) => (
            <Card className="mb-3">
              <Text className="text-base font-bold text-slate-50">
                {r.from?.name} → {r.to?.name}
              </Text>
              {r.message && <Text className="mt-1 text-sm text-slate-300">{r.message}</Text>}
              <Text className="mt-1 text-xs uppercase text-slate-500">{r.status}</Text>
              {r.can_respond && (
                <View className="mt-3 flex-row">
                  <Button
                    title={t('community.accept')}
                    onPress={() => respond(r.id, 'accept')}
                    loading={busy === r.id}
                    className="mr-2 flex-1 py-2.5"
                  />
                  <Button
                    title={t('community.decline')}
                    variant="secondary"
                    onPress={() => respond(r.id, 'decline')}
                    disabled={busy === r.id}
                    className="flex-1 py-2.5"
                  />
                </View>
              )}
              {r.match_id && (
                <Button
                  title={t('match.watch')}
                  variant="ghost"
                  onPress={() => router.push(`/match/${r.match_id}`)}
                  className="mt-2"
                />
              )}
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
