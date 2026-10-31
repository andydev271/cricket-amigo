import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  api,
  type StandingRow,
  type Team,
  type TournamentDetail,
} from '@/src/lib/api';
import { Button, Card, Input, Screen, Subtitle, Title } from '@/src/ui/primitives';

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const tid = Number(id);

  const [tr, setTr] = useState<TournamentDetail | null>(null);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [regName, setRegName] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'standings' | 'fixtures' | 'teams'>('standings');

  const load = useCallback(() => {
    api.tournaments.get(tid).then(setTr).catch(() => {});
    api.tournaments.standings(tid).then(setStandings).catch(() => {});
    api.teams.list().then(setMyTeams).catch(() => {});
  }, [tid]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!tr) {
    return <Screen />;
  }

  const register = async (teamId?: number) => {
    setBusy(true);
    try {
      await api.tournaments.registerTeam(tid, teamId ? { team_id: teamId } : { name: regName.trim() });
      setRegName('');
      load();
    } finally {
      setBusy(false);
    }
  };

  const generate = async () => {
    setBusy(true);
    try {
      await api.tournaments.generateFixtures(tid);
      load();
    } finally {
      setBusy(false);
    }
  };

  const tabs = ['standings', 'fixtures', 'teams'] as const;

  return (
    <Screen>
      <Stack.Screen options={{ title: tr.name }} />
      <View className="px-5 pt-2">
        <Title className="mb-1">{tr.name}</Title>
        <Subtitle className="mb-3">
          {tr.city ?? ''} · {tr.overs_limit}ov · {t(`tournaments.format_${tr.format}`)}
        </Subtitle>

        <View className="mb-4 flex-row">
          {tabs.map((k) => (
            <Pressable
              key={k}
              onPress={() => setTab(k)}
              className={`mr-2 rounded-full px-4 py-2 ${tab === k ? 'bg-pitch-500' : 'bg-night-700'}`}
            >
              <Text className={tab === k ? 'font-bold text-pitch-950' : 'text-slate-300'}>
                {t(`tournaments.tab_${k}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-10">
        {tab === 'standings' && (
          <Card>
            <View className="flex-row border-b border-slate-700/60 pb-2">
              <Text className="flex-1 text-xs font-bold uppercase text-slate-400">{t('tournaments.team')}</Text>
              {['P', 'W', 'L', 'Pts', 'NRR'].map((h) => (
                <Text key={h} className="w-10 text-right text-xs font-bold uppercase text-slate-400">{h}</Text>
              ))}
            </View>
            {standings.map((r, i) => (
              <View key={r.tournament_team_id} className="flex-row border-b border-slate-800/60 py-2.5">
                <Text className="flex-1 text-sm font-semibold text-slate-100" numberOfLines={1}>
                  {i + 1}. {r.name}
                </Text>
                <Text className="w-10 text-right text-sm text-slate-300">{r.p}</Text>
                <Text className="w-10 text-right text-sm text-slate-300">{r.w}</Text>
                <Text className="w-10 text-right text-sm text-slate-300">{r.l}</Text>
                <Text className="w-10 text-right text-sm font-bold text-gold-400">{r.pts}</Text>
                <Text className={`w-10 text-right text-sm ${r.nrr >= 0 ? 'text-pitch-400' : 'text-red-400'}`}>
                  {r.nrr > 0 ? `+${r.nrr}` : r.nrr}
                </Text>
              </View>
            ))}
            {standings.length === 0 && (
              <Text className="py-4 text-center text-sm text-slate-500">{t('tournaments.noTeams')}</Text>
            )}
          </Card>
        )}

        {tab === 'fixtures' && (
          <>
            {tr.fixtures.map((f) => (
              <Pressable key={f.id} onPress={() => router.push(`/match/${f.match_id}`)} className="mb-2">
                <Card>
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 text-sm font-bold text-slate-50" numberOfLines={1}>
                      {f.team_a} vs {f.team_b}
                    </Text>
                    <Text className={`text-xs font-bold uppercase ${f.status === 'live' ? 'text-red-400' : 'text-slate-500'}`}>
                      {f.status}
                    </Text>
                  </View>
                  {f.score.length > 0 && (
                    <Text className="mt-1 text-xs text-slate-400">
                      {f.score.map((s) => `${s.runs}/${s.wickets} (${s.overs})`).join(' · ')}
                    </Text>
                  )}
                  {f.result && <Text className="mt-1 text-xs font-semibold text-gold-400">{f.result.text}</Text>}
                </Card>
              </Pressable>
            ))}
            {tr.fixtures.length === 0 && (
              <Text className="py-6 text-center text-sm text-slate-500">{t('tournaments.noFixtures')}</Text>
            )}
            {tr.is_organizer && tr.status !== 'completed' && (
              <Button title={t('tournaments.generate')} onPress={generate} loading={busy} className="mt-3" />
            )}
          </>
        )}

        {tab === 'teams' && (
          <>
            {tr.teams.map((tt) => (
              <Card key={tt.id} className="mb-2 py-3">
                <Text className="text-sm font-semibold text-slate-100">{tt.name}</Text>
              </Card>
            ))}
            {tr.status === 'open' && (
              <Card className="mt-3">
                <Text className="mb-2 text-sm font-semibold text-slate-300">{t('tournaments.register')}</Text>
                {myTeams.map((team) => (
                  <Pressable
                    key={team.id}
                    onPress={() => register(team.id)}
                    className="mb-2 rounded-2xl bg-night-700 px-4 py-3"
                  >
                    <Text className="font-semibold text-slate-100">
                      {team.name} <Text className="text-xs text-slate-500">({team.my_role})</Text>
                    </Text>
                  </Pressable>
                ))}
                <View className="mt-1 flex-row">
                  <Input
                    value={regName}
                    onChangeText={setRegName}
                    placeholder={t('tournaments.otherTeam')}
                    className="flex-1 py-3"
                  />
                  <Button
                    title="+"
                    onPress={() => register()}
                    disabled={!regName.trim() || busy}
                    className="ml-2 px-5 py-3"
                  />
                </View>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
