import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";

import { AdBanner } from "@/src/ads/Banner";
import { api } from "@/src/lib/api";
import { Card, Screen, Title } from "@/src/ui/primitives";

export default function PlayScreen() {
  const { t } = useTranslation();

  const catchIt = useQuery({
    queryKey: ["scores", "catch_it"],
    queryFn: () => api.games.topScores("catch_it"),
  });

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-5 pb-10">
        <Title className="mb-4">{t("play.title")}</Title>

        <Card className="mb-3">
          <Text className="font-bold text-slate-100">
            🧠 {t("play.trivia")}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-slate-400">
            {t("play.triviaDesc")}
          </Text>
          <Link
            href="/games/trivia"
            className="mt-2.5 font-bold text-pitch-400"
          >
            {t("play.play")}
          </Link>
        </Card>

        <Card className="mb-3">
          <Text className="font-bold text-slate-100">
            🎯 {t("play.catchIt")}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-slate-400">
            {t("play.catchItDesc")}
            {catchIt.data?.my_best
              ? ` ${t("play.yourBest", { score: catchIt.data.my_best })}`
              : ""}
          </Text>
          <Link
            href="/games/catch-it"
            className="mt-2.5 font-bold text-pitch-400"
          >
            {t("play.play")}
          </Link>
        </Card>

        <Card className="mb-3">
          <Text className="font-bold text-slate-100">📊 {t("play.picks")}</Text>
          <Text className="mt-1 text-sm leading-5 text-slate-400">
            {t("play.picksDesc")}
          </Text>
          <Link
            href="/(tabs)/score"
            className="mt-2.5 font-bold text-pitch-400"
          >
            {t("play.viewMatches")}
          </Link>
        </Card>

        <Text className="mb-2 mt-2 font-bold text-slate-100">
          {t("play.leaderboard")}
        </Text>
        <Card>
          {(catchIt.data?.top ?? []).slice(0, 8).map((r, i) => (
            <View
              key={r.user.id}
              className="flex-row items-center gap-2.5 py-1"
            >
              <Text className="w-8 font-bold text-gold-400">#{i + 1}</Text>
              <Text className="flex-1 text-sm text-slate-300">
                {r.user.name}
              </Text>
              <Text className="font-bold text-pitch-400">{r.best}</Text>
            </View>
          ))}
          {(catchIt.data?.top ?? []).length === 0 && (
            <Text className="text-sm text-slate-400">{t("play.noScores")}</Text>
          )}
        </Card>
      </ScrollView>
      <AdBanner position="bottom" />
    </Screen>
  );
}
