import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { api } from '@/src/lib/api';
import { Button, Card, Input, Screen, Title } from '@/src/ui/primitives';

const FORMATS = ['league', 'knockout'] as const;
const OVERS = [5, 10, 15, 20];

export default function NewTournamentScreen() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [format, setFormat] = useState<(typeof FORMATS)[number]>('league');
  const [overs, setOvers] = useState(10);
  const [maxTeams, setMaxTeams] = useState('8');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setSaving(true);
    setError(null);
    try {
      const tr = await api.tournaments.create({
        name: name.trim(),
        city: city.trim() || undefined,
        format,
        overs_limit: overs,
        max_teams: Math.max(2, Math.min(64, parseInt(maxTeams) || 8)),
      });
      router.replace(`/tournaments/${tr.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t('tournaments.new') }} />
      <ScrollView contentContainerClassName="px-5 pb-10">
        <Title className="mb-4">{t('tournaments.new')}</Title>
        <Card className="mb-5">
          <Input value={name} onChangeText={setName} placeholder={t('tournaments.name')} className="mb-3" />
          <Input value={city} onChangeText={setCity} placeholder={t('match.city')} className="mb-4" />

          <Text className="mb-2 text-sm font-semibold text-slate-300">{t('tournaments.format')}</Text>
          <View className="mb-4 flex-row">
            {FORMATS.map((f) => (
              <Pressable
                key={f}
                onPress={() => setFormat(f)}
                className={`mr-2 rounded-full px-4 py-2 ${format === f ? 'bg-pitch-500' : 'bg-night-700'}`}
              >
                <Text className={format === f ? 'font-bold text-pitch-950' : 'text-slate-300'}>
                  {t(`tournaments.format_${f}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="mb-2 text-sm font-semibold text-slate-300">{t('match.overs')}</Text>
          <View className="mb-4 flex-row">
            {OVERS.map((o) => (
              <Pressable
                key={o}
                onPress={() => setOvers(o)}
                className={`mr-2 rounded-full px-4 py-2 ${overs === o ? 'bg-pitch-500' : 'bg-night-700'}`}
              >
                <Text className={overs === o ? 'font-bold text-pitch-950' : 'text-slate-300'}>{o}</Text>
              </Pressable>
            ))}
          </View>

          <Text className="mb-2 text-sm font-semibold text-slate-300">{t('tournaments.maxTeams')}</Text>
          <Input value={maxTeams} onChangeText={setMaxTeams} keyboardType="default" placeholder="8" />
        </Card>

        {error && <Text className="mb-3 text-center text-red-400">{error}</Text>}
        <Button
          title={t('tournaments.create')}
          onPress={create}
          loading={saving}
          disabled={!name.trim()}
        />
      </ScrollView>
    </Screen>
  );
}
