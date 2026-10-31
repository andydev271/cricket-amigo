import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { WebView } from 'react-native-webview';

import { api, type ScoreSummary } from '@/src/lib/api';
import { subscribeMatch } from '@/src/lib/reverb';
import { Card, Screen } from '@/src/ui/primitives';

function ytEmbed(url: string): string | null {
  const m =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([\w-]{6,})/) ??
    url.match(/youtube\.com\/channel\/([\w-]+)/);
  if (!m) return null;
  return `https://www.youtube.com/embed/${m[1]}?autoplay=0&rel=0`;
}

export default function WatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const matchId = Number(id);
  const [score, setScore] = useState<ScoreSummary | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    api.matches.score(matchId).then(setScore).catch(() => {});
    const unsub = subscribeMatch(matchId, (s) => {
      setConnected(true);
      setScore(s as ScoreSummary);
    });
    return unsub;
  }, [matchId]);

  if (!score) {
    return <Screen />;
  }

  const live = score.innings.find((i) => i.status === 'in_progress');
  const embed = score.stream_url ? ytEmbed(score.stream_url) : null;

  return (
    <Screen>
      <Stack.Screen options={{ title: `${score.team_a} v ${score.team_b}` }} />
      <ScrollView contentContainerClassName="px-5 pb-10">
        {embed && (
          <View className="mb-4 aspect-video overflow-hidden rounded-2xl bg-black">
            <WebView
              source={{ uri: embed }}
              allowsFullscreenVideo
              style={{ flex: 1, backgroundColor: 'black' }}
            />
          </View>
        )}

        <Card className="mb-4">
          <View className="flex-row items-center justify-between">
            <Text
              className={`text-xs font-bold uppercase ${
                score.status === 'live' ? 'text-red-400' : 'text-slate-500'
              }`}
            >
              {score.status === 'live' ? `● ${t('match.live')}` : score.status}
            </Text>
            {connected && score.status === 'live' && (
              <Text className="text-xs text-slate-500">{t('match.realtime')}</Text>
            )}
          </View>

          {score.innings.map((i) => (
            <View key={i.number} className="mt-3">
              <View className="flex-row items-end justify-between">
                <View className="flex-1">
                  <Text className="text-sm text-slate-400">{i.batting}</Text>
                  <Text className="text-3xl font-bold text-slate-50">
                    {i.runs}
                    <Text className="text-xl text-slate-400">/{i.wickets}</Text>
                  </Text>
                </View>
                <Text className="text-base text-slate-400">{i.overs} ov</Text>
              </View>
              <Text className="mt-1 text-xs text-slate-500">
                {t('match.extras')}: {i.extras.wides}wd {i.extras.no_balls}nb {i.extras.byes}b{' '}
                {i.extras.leg_byes}lb
                {i.target ? ` · ${t('match.target')} ${i.target}` : ''}
              </Text>
            </View>
          ))}

          {score.result && (
            <Text className="mt-4 text-lg font-bold text-gold-400">{score.result.text}</Text>
          )}
        </Card>

        {/* At the crease */}
        {score.current && live && (
          <Card className="mb-4">
            <Text className="mb-3 text-xs font-bold uppercase text-slate-400">
              {t('match.atTheCrease')}
            </Text>
            {score.current.striker && (
              <View className="mb-1 flex-row justify-between">
                <Text className="text-base font-bold text-slate-50">
                  {score.current.striker.name} *
                </Text>
                <Text className="text-base text-slate-300">
                  {score.current.striker.runs} ({score.current.striker.balls})
                </Text>
              </View>
            )}
            {score.current.non_striker && (
              <View className="mb-3 flex-row justify-between">
                <Text className="text-base text-slate-200">
                  {score.current.non_striker.name}
                </Text>
                <Text className="text-base text-slate-300">
                  {score.current.non_striker.runs} ({score.current.non_striker.balls})
                </Text>
              </View>
            )}
            {score.current.bowler && (
              <View className="flex-row justify-between border-t border-slate-700/50 pt-3">
                <Text className="text-base text-slate-200">⚾ {score.current.bowler.name}</Text>
                <Text className="text-base text-slate-300">
                  {score.current.bowler.overs}-{score.current.bowler.runs}-
                  {score.current.bowler.wickets}
                </Text>
              </View>
            )}
            {score.current.required && (
              <Text className="mt-3 text-center font-bold text-gold-400">
                {t('scorer.need', {
                  runs: score.current.required.runs,
                  balls: score.current.required.balls,
                })}
              </Text>
            )}
            {score.current.last_balls.length > 0 && (
              <View className="mt-3 flex-row">
                {score.current.last_balls.map((b, i) => (
                  <View
                    key={i}
                    className={`mr-1.5 h-7 w-7 items-center justify-center rounded-full ${
                      b === 'W'
                        ? 'bg-red-500/30'
                        : b === '4' || b === '6'
                          ? 'bg-pitch-500/30'
                          : 'bg-night-700'
                    }`}
                  >
                    <Text className="text-xs font-bold text-slate-100">{b}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}
