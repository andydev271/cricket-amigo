import {
    router,
    Stack,
    useFocusEffect,
    useLocalSearchParams,
} from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Share, Text, View } from "react-native";

import { api, type MatchDetail, type MatchPlayer } from "@/src/lib/api";
import { Button, Card, Screen, Subtitle, Title } from "@/src/ui/primitives";

function PredictCard({ match }: { match: MatchDetail }) {
  const { t } = useTranslation();
  const [pick, setPick] = useState<{
    pick: "a" | "b" | null;
    correct: boolean | null;
    count_a: number;
    count_b: number;
  } | null>(null);
  const [busyPick, setBusyPick] = useState(false);

  const loadPick = useCallback(() => {
    api.games
      .myPick(match.id)
      .then(setPick)
      .catch(() => {});
  }, [match.id]);

  useFocusEffect(
    useCallback(() => {
      loadPick();
    }, [loadPick]),
  );

  const vote = async (side: "a" | "b") => {
    setBusyPick(true);
    try {
      await api.games.predict(match.id, side);
      loadPick();
    } finally {
      setBusyPick(false);
    }
  };

  if (!pick) return null;
  const total = pick.count_a + pick.count_b;
  const finished = match.status === "completed";

  return (
    <Card className="mb-4">
      <Text className="mb-2 font-bold text-slate-200">{t("picks.title")}</Text>
      {pick.correct !== null ? (
        <Text className="mb-2 text-sm font-semibold text-gold-400">
          {pick.correct ? t("picks.won") : t("picks.lost")}
        </Text>
      ) : null}
      <View className="flex-row gap-2">
        {(["a", "b"] as const).map((side) => {
          const name = side === "a" ? match.team_a.name : match.team_b.name;
          const mine = pick.pick === side;
          const disabled = finished || pick.correct !== null || busyPick;
          return (
            <Button
              key={side}
              title={`${mine ? "✓ " : ""}${name}${total ? ` · ${side === "a" ? pick.count_a : pick.count_b}` : ""}`}
              variant={mine ? "primary" : "secondary"}
              disabled={disabled}
              onPress={() => vote(side)}
              className="flex-1"
            />
          );
        })}
      </View>
      <Text className="mt-2 text-xs text-slate-500">
        {t("picks.reward", { count: total })}
      </Text>
    </Card>
  );
}

function XiList({
  title,
  players,
  side,
}: {
  title: string;
  players: MatchPlayer[];
  side: "a" | "b";
}) {
  const xi = players.filter((p) => p.side === side);
  return (
    <Card className="mb-3">
      <Text className="mb-2 font-bold text-slate-200">{title}</Text>
      <View className="flex-row flex-wrap">
        {xi.map((p) => (
          <Text key={p.id} className="mb-1 mr-3 text-sm text-slate-400">
            {p.batting_order}. {p.name}
            {p.is_captain ? " (c)" : ""}
            {p.is_keeper ? " †" : ""}
          </Text>
        ))}
      </View>
    </Card>
  );
}

export default function MatchHubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.matches
      .get(Number(id))
      .then(setMatch)
      .catch(() => {});
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!match) {
    return <Screen />;
  }

  const canScore = match.can_score;

  const startMatch = async () => {
    setBusy(true);
    try {
      await api.matches.start(match.id);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const innings = match.innings;

  return (
    <Screen>
      <Stack.Screen
        options={{ title: `${match.team_a.name} v ${match.team_b.name}` }}
      />
      <ScrollView contentContainerClassName="px-5 pb-10">
        <Title className="mb-1">
          {match.team_a.name} vs {match.team_b.name}
        </Title>
        <Subtitle className="mb-4">
          {match.overs_limit} {t("score.overs")} ·{" "}
          {t(`match.ball.${match.ball_type}`)}
          {match.ground ? ` · ${match.ground}` : ""}
          {match.city ? `, ${match.city}` : ""}
        </Subtitle>

        {/* Live score card */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between">
            <Text
              className={`text-xs font-bold uppercase ${
                match.status === "live" ? "text-red-400" : "text-slate-500"
              }`}
            >
              {match.status === "live" ? "● LIVE" : match.status}
            </Text>
            {match.toss_winner && (
              <Text className="text-xs text-slate-500">
                {t("match.tossWon", {
                  team:
                    match.toss_winner === "a"
                      ? match.team_a.name
                      : match.team_b.name,
                  decision: t(`match.${match.toss_decision}`),
                })}
              </Text>
            )}
          </View>
          {innings.map((i) => (
            <View key={i.id} className="mt-3">
              <Text className="text-sm text-slate-400">
                {t("match.innings")} {i.number} —{" "}
                {i.batting === "a" ? match.team_a.name : match.team_b.name}
                {i.target ? ` · ${t("match.need", { runs: i.target })}` : ""}
              </Text>
              <Text className="text-2xl font-bold text-slate-50">
                {i.runs}/{i.wickets}{" "}
                <Text className="text-base font-normal text-slate-400">
                  ({i.overs} ov)
                </Text>
              </Text>
            </View>
          ))}
          {match.result && (
            <Text className="mt-3 text-base font-bold text-gold-400">
              {match.result.text}
            </Text>
          )}
        </Card>

        {/* Fan pick */}
        <PredictCard match={match} />

        {/* Actions */}
        {match.status === "scheduled" && canScore && (
          <Button
            title={t("match.start")}
            onPress={startMatch}
            loading={busy}
            className="mb-3"
          />
        )}
        {match.status === "live" && canScore && (
          <Button
            title={t("match.openScorer")}
            onPress={() => router.push(`/match/${match.id}/scorer`)}
            className="mb-3"
          />
        )}
        <Button
          title={t("match.watch")}
          variant="secondary"
          onPress={() => router.push(`/match/${match.id}/watch`)}
          className="mb-3"
        />
        {canScore && (
          <Button
            title={t("match.streamSetup")}
            variant="secondary"
            onPress={() => router.push(`/match/${match.id}/stream`)}
            className="mb-3"
          />
        )}
        <Button
          title={t("common.share")}
          variant="ghost"
          onPress={() =>
            Share.share({
              message: `${match.team_a.name} vs ${match.team_b.name} — cricketamigo://match/${match.id}`,
            })
          }
        />

        {/* Playing XIs */}
        <XiList
          title={`${match.team_a.name} XI`}
          players={match.players}
          side="a"
        />
        <XiList
          title={`${match.team_b.name} XI`}
          players={match.players}
          side="b"
        />
      </ScrollView>
    </Screen>
  );
}
