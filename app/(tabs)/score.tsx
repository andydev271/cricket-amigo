import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";

import { AdBanner } from '@/src/ads/Banner';
import { api, type MatchListItem } from "@/src/lib/api";
import { colors } from "@/src/theme";
import { Button, Card, EmptyState, Screen, Title } from "@/src/ui/primitives";

function inningsLine(m: MatchListItem): string {
  return m.innings
    .map((i) => {
      const name = i.batting === "a" ? m.team_a : m.team_b;
      return `${name} ${i.runs}/${i.wickets} (${i.overs})`;
    })
    .join("  ·  ");
}

function StatusPill({ status }: { status: MatchListItem["status"] }) {
  const live = status === "live";
  return (
    <View
      className={`rounded-full px-3 py-1 ${live ? "bg-red-500/20" : "bg-night-700"}`}
    >
      <Text
        className={`text-xs font-bold uppercase ${live ? "text-red-400" : "text-slate-400"}`}
      >
        {live ? "● LIVE" : status}
      </Text>
    </View>
  );
}

export default function ScoreScreen() {
  const { t } = useTranslation();
  const [matches, setMatches] = useState<MatchListItem[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    api.matches
      .list()
      .then(setMatches)
      .catch(() => setMatches([]));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const live = matches?.filter((m) => m.status === "live") ?? [];
  const rest = matches?.filter((m) => m.status !== "live") ?? [];
  const sorted = [...live, ...rest];

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
        <Title>{t("score.title")}</Title>
        <Button
          title={t("score.newMatch")}
          onPress={() => router.push("/match/new")}
          className="px-4 py-2.5"
        />
      </View>
      {matches === null ? null : sorted.length === 0 ? (
        <EmptyState title={t("score.empty")} hint={t("score.emptyHint")} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(m) => String(m.id)}
          contentContainerClassName="px-5 pb-8"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                api.matches
                  .list()
                  .finally(() => setRefreshing(false))
                  .then(setMatches);
              }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item: m }) => (
            <Pressable
              onPress={() => router.push(`/match/${m.id}`)}
              className="mb-3"
            >
              <Card>
                <View className="flex-row items-center justify-between">
                  <Text
                    className="flex-1 text-base font-bold text-slate-50"
                    numberOfLines={1}
                  >
                    {m.team_a} vs {m.team_b}
                  </Text>
                  <StatusPill status={m.status} />
                </View>
                {m.innings.length > 0 && (
                  <Text
                    className="mt-2 text-sm text-slate-300"
                    numberOfLines={1}
                  >
                    {inningsLine(m)}
                  </Text>
                )}
                <Text className="mt-1 text-xs text-slate-500">
                  {m.ground ? `${m.ground} · ` : ""}
                  {m.overs_limit} {t("score.overs")}
                  {m.result ? ` · ${m.result.text}` : ""}
                </Text>
              </Card>
            </Pressable>
          )}
        />
      )}
      <AdBanner position="bottom" />
    </Screen>
  );
}
