import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";

import { api, type MatchListItem } from "@/src/lib/api";
import { colors } from "@/src/theme";
import { Card, EmptyState, Screen, Title } from "@/src/ui/primitives";

export default function LiveScreen() {
  const { t } = useTranslation();
  const [matches, setMatches] = useState<MatchListItem[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    api.matches
      .list()
      .then((all) => setMatches(all.filter((m) => m.status === "live")))
      .catch(() => setMatches([]));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen>
      <View className="px-5 pb-3 pt-2">
        <Title>{t("live.title")}</Title>
      </View>
      {matches === null ? null : matches.length === 0 ? (
        <EmptyState title={t("live.empty")} hint={t("live.emptyHint")} />
      ) : (
        <FlatList
          data={matches}
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
                  .then((all) =>
                    setMatches(all.filter((m) => m.status === "live")),
                  );
              }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item: m }) => (
            <Pressable
              onPress={() => router.push(`/match/${m.id}/watch`)}
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
                  <Text className="text-xs font-bold text-red-400">● LIVE</Text>
                </View>
                {m.innings.length > 0 && (
                  <Text
                    className="mt-2 text-sm text-slate-300"
                    numberOfLines={1}
                  >
                    {m.innings
                      .map((i) => {
                        const name = i.batting === "a" ? m.team_a : m.team_b;
                        return `${name} ${i.runs}/${i.wickets} (${i.overs})`;
                      })
                      .join("  ·  ")}
                  </Text>
                )}
                {m.ground && (
                  <Text className="mt-1 text-xs text-slate-500">
                    {m.ground}
                  </Text>
                )}
              </Card>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
