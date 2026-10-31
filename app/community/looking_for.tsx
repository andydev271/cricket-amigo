import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { api, type BoardPost } from '@/src/lib/api';
import { Button, Card, EmptyState, Input, Screen, Title } from '@/src/ui/primitives';

const KINDS = ['seeking_team', 'seeking_players', 'seeking_match', 'seeking_coach'] as const;

export default function LookingForScreen() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<BoardPost[] | null>(null);
  const [kind, setKind] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [newKind, setNewKind] = useState<(typeof KINDS)[number]>('seeking_players');
  const [city, setCity] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.community.board(kind ? { kind } : undefined).then(setPosts).catch(() => setPosts([]));
  }, [kind]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const post = async () => {
    setBusy(true);
    try {
      await api.community.post({ kind: newKind, city: city.trim() || undefined, text: text.trim() });
      setText('');
      setComposing(false);
      load();
    } finally {
      setBusy(false);
    }
  };

  const close = async (id: number) => {
    await api.community.closePost(id).catch(() => {});
    load();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t('community.lookingFor') }} />
      <View className="px-5 pt-2">
        <View className="mb-3 flex-row items-center justify-between">
          <Title>{t('community.lookingFor')}</Title>
          <Button
            title={composing ? t('common.cancel') : t('community.post')}
            onPress={() => setComposing(!composing)}
            variant={composing ? 'ghost' : 'primary'}
            className="px-4 py-2.5"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          <Pressable
            onPress={() => setKind(null)}
            className={`mr-2 rounded-full px-3 py-1.5 ${kind === null ? 'bg-pitch-500' : 'bg-night-700'}`}
          >
            <Text className={kind === null ? 'font-bold text-pitch-950' : 'text-slate-300'}>
              {t('community.all')}
            </Text>
          </Pressable>
          {KINDS.map((k) => (
            <Pressable
              key={k}
              onPress={() => setKind(kind === k ? null : k)}
              className={`mr-2 rounded-full px-3 py-1.5 ${kind === k ? 'bg-pitch-500' : 'bg-night-700'}`}
            >
              <Text className={kind === k ? 'font-bold text-pitch-950' : 'text-slate-300'}>
                {t(`community.kind.${k}`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {composing && (
          <Card className="mb-4">
            <View className="mb-3 flex-row flex-wrap">
              {KINDS.map((k) => (
                <Pressable
                  key={k}
                  onPress={() => setNewKind(k)}
                  className={`mb-2 mr-2 rounded-full px-3 py-1.5 ${newKind === k ? 'bg-pitch-500' : 'bg-night-700'}`}
                >
                  <Text className={newKind === k ? 'font-bold text-pitch-950' : 'text-slate-300'}>
                    {t(`community.kind.${k}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Input value={city} onChangeText={setCity} placeholder={t('match.city')} className="mb-3" />
            <Input
              value={text}
              onChangeText={setText}
              placeholder={t('community.postHint')}
              className="mb-3"
            />
            <Button title={t('community.publish')} onPress={post} loading={busy} disabled={!text.trim()} />
          </Card>
        )}
      </View>

      {posts === null ? null : posts.length === 0 ? (
        <EmptyState title={t('community.emptyBoard')} hint={t('community.emptyBoardHint')} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => String(p.id)}
          contentContainerClassName="px-5 pb-8"
          renderItem={({ item: p }) => (
            <Card className="mb-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold uppercase text-pitch-400">
                  {t(`community.kind.${p.kind}`)}
                </Text>
                {p.mine && (
                  <Pressable onPress={() => close(p.id)}>
                    <Text className="text-xs text-red-400">{t('community.close')}</Text>
                  </Pressable>
                )}
              </View>
              <Text className="mt-1 text-sm text-slate-100">{p.text}</Text>
              <Text className="mt-2 text-xs text-slate-500">
                {p.team?.name ?? p.user?.name ?? ''}
                {p.city ? ` · ${p.city}` : ''}
              </Text>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
