import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import {
    api,
    type BallInput,
    type MatchDetail,
    type MatchPlayer,
    type ScoreSummary,
} from "@/src/lib/api";
import { Button, Card, Screen } from "@/src/ui/primitives";

const WICKET_TYPES = [
  "bowled",
  "caught",
  "lbw",
  "run_out",
  "stumped",
  "hit_wicket",
] as const;
const FIELDER_WICKETS = ["caught", "run_out", "stumped"];

function PlayerPicker({
  label,
  players,
  selected,
  onSelect,
}: {
  label: string;
  players: MatchPlayer[];
  selected: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-xs font-semibold uppercase text-slate-400">
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {players.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => onSelect(p.id)}
            className={`mr-2 rounded-full px-3 py-2 ${
              selected === p.id ? "bg-pitch-500" : "bg-night-700"
            }`}
          >
            <Text
              className={
                selected === p.id
                  ? "font-bold text-pitch-950"
                  : "text-slate-300"
              }
            >
              {p.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function Pad({
  keys,
  onKey,
  label,
}: {
  keys: string[];
  onKey: (k: string) => void;
  label: string;
}) {
  return (
    <View className="mb-2">
      <Text className="mb-1 text-xs font-semibold uppercase text-slate-400">
        {label}
      </Text>
      <View className="flex-row flex-wrap">
        {keys.map((k) => (
          <Pressable
            key={k}
            onPress={() => onKey(k)}
            className="mb-2 mr-2 h-14 min-w-[52] items-center justify-center rounded-2xl bg-night-700 px-4"
          >
            <Text className="text-lg font-bold text-slate-50">{k}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function ScorerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const matchId = Number(id);

  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [score, setScore] = useState<ScoreSummary | null>(null);
  const [striker, setStriker] = useState<number | null>(null);
  const [nonStriker, setNonStriker] = useState<number | null>(null);
  const [bowler, setBowler] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [wicketModal, setWicketModal] = useState(false);
  const [wicketPick, setWicketPick] = useState<{
    type: (typeof WICKET_TYPES)[number] | null;
    out: number | null;
    fielder: number | null | undefined;
  }>({ type: null, out: null, fielder: undefined });
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const [m, s] = await Promise.all([
      api.matches.get(matchId),
      api.matches.score(matchId),
    ]);
    setMatch(m);
    setScore(s);
  };

  useEffect(() => {
    load();
  }, [matchId]);

  // Sync participant selections from the server-derived "next" state.
  useEffect(() => {
    if (!score?.current) return;
    if (score.current.striker) setStriker(score.current.striker.id);
    if (score.current.non_striker) setNonStriker(score.current.non_striker.id);
    if (score.current.bowler) setBowler(score.current.bowler.id);
  }, [
    score?.current?.striker?.id,
    score?.current?.non_striker?.id,
    score?.current?.bowler?.id,
  ]);

  const liveInnings = useMemo(
    () => match?.innings.find((i) => i.status === "in_progress") ?? null,
    [match],
  );
  const battingSide = liveInnings?.batting ?? "a";
  const battingXi = match?.players.filter((p) => p.side === battingSide) ?? [];
  const bowlingXi = match?.players.filter((p) => p.side !== battingSide) ?? [];
  const liveScore = score?.innings.find((i) => i.status === "in_progress");

  const sendBall = async (ball: Partial<BallInput>) => {
    if (!liveInnings || !striker || !nonStriker || !bowler || pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await api.matches.ball(matchId, liveInnings.id, {
        striker_id: striker,
        non_striker_id: nonStriker,
        bowler_id: bowler,
        ...ball,
      });
      setScore(res.score);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setPending(false);
    }
  };

  const undo = async () => {
    setPending(true);
    try {
      const res = await api.matches.undo(matchId);
      setScore(res.score);
      await load(); // innings may have reopened
    } finally {
      setPending(false);
    }
  };

  if (!match || !score || !liveInnings) {
    return <Screen />;
  }

  const participantsReady = striker && nonStriker && bowler;

  return (
    <Screen>
      <Stack.Screen
        options={{ title: `${match.team_a.name} v ${match.team_b.name}` }}
      />
      <ScrollView contentContainerClassName="px-5 pb-10">
        {/* Live score header */}
        <Card className="mb-4">
          <View className="flex-row items-end justify-between">
            <View>
              <Text className="text-xs uppercase text-slate-400">
                {battingSide === "a" ? match.team_a.name : match.team_b.name}
              </Text>
              <Text className="text-4xl font-bold text-slate-50">
                {liveScore?.runs ?? 0}
                <Text className="text-2xl text-slate-400">
                  /{liveScore?.wickets ?? 0}
                </Text>
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-lg text-slate-300">
                {liveScore?.overs} ov
              </Text>
              {score.current?.required && (
                <Text className="text-sm font-semibold text-gold-400">
                  {t("scorer.need", {
                    runs: score.current.required.runs,
                    balls: score.current.required.balls,
                  })}
                </Text>
              )}
            </View>
          </View>
          {score.current && score.current.last_balls.length > 0 && (
            <View className="mt-3 flex-row">
              {score.current.last_balls.map((b, i) => (
                <View
                  key={i}
                  className={`mr-1.5 h-7 w-7 items-center justify-center rounded-full ${
                    b === "W"
                      ? "bg-red-500/30"
                      : b === "4" || b === "6"
                        ? "bg-pitch-500/30"
                        : "bg-night-700"
                  }`}
                >
                  <Text className="text-xs font-bold text-slate-100">{b}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Participants */}
        <PlayerPicker
          label={`${t("scorer.striker")}${score.current?.striker ? ` — ${score.current.striker.runs}(${score.current.striker.balls})` : ""}`}
          players={battingXi}
          selected={striker}
          onSelect={setStriker}
        />
        <PlayerPicker
          label={t("scorer.nonStriker")}
          players={battingXi.filter((p) => p.id !== striker)}
          selected={nonStriker}
          onSelect={setNonStriker}
        />
        <PlayerPicker
          label={`${t("scorer.bowler")}${score.current?.bowler ? ` — ${score.current.bowler.overs}ov ${score.current.bowler.runs}/${score.current.bowler.wickets}w` : ""}`}
          players={bowlingXi}
          selected={bowler}
          onSelect={setBowler}
        />

        {/* Run pad */}
        <Pad
          label={t("scorer.runs")}
          keys={["0", "1", "2", "3", "4", "5", "6"]}
          onKey={(k) => sendBall({ bat_runs: Number(k) })}
        />
        <Pad
          label={t("scorer.extras")}
          keys={["wd", "nb", "bye", "lb"]}
          onKey={(k) => {
            if (k === "wd") sendBall({ extra_type: "wide" });
            else if (k === "nb") sendBall({ extra_type: "no_ball" });
            else if (k === "bye")
              sendBall({ extra_type: "bye", extra_runs: 1 });
            else sendBall({ extra_type: "leg_bye", extra_runs: 1 });
          }}
        />
        {/* Bye/leg-bye runs beyond 1 and nb+runs need the detail pad */}
        <Pad
          label={t("scorer.extraRuns")}
          keys={["nb+1", "nb+4", "nb+6", "b 2", "b 4", "lb 2", "lb 4", "wd+4"]}
          onKey={(k) => {
            if (k.startsWith("nb+"))
              sendBall({ extra_type: "no_ball", bat_runs: Number(k.slice(3)) });
            else if (k.startsWith("b "))
              sendBall({ extra_type: "bye", extra_runs: Number(k.slice(2)) });
            else if (k.startsWith("lb "))
              sendBall({
                extra_type: "leg_bye",
                extra_runs: Number(k.slice(3)),
              });
            else sendBall({ extra_type: "wide", extra_runs: 4 });
          }}
        />

        <View className="mb-4 mt-2 flex-row">
          <Button
            title={t("scorer.wicket")}
            variant="danger"
            onPress={() => setWicketModal(true)}
            disabled={!participantsReady || pending}
            className="mr-3 flex-1"
          />
          <Button
            title={t("scorer.undo")}
            variant="secondary"
            onPress={undo}
            disabled={pending}
            className="flex-1"
          />
        </View>

        {error && <Text className="text-center text-red-400">{error}</Text>}
        {pending && <Text className="text-center text-slate-500">…</Text>}
      </ScrollView>

      {/* Wicket modal: type → who's out → fielder */}
      <Modal visible={wicketModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/70">
          <View className="rounded-t-3xl bg-night-800 p-5 pb-10">
            {!wicketPick.type && (
              <>
                <Text className="mb-4 text-lg font-bold text-slate-50">
                  {t("scorer.howOut")}
                </Text>
                {WICKET_TYPES.map((w) => (
                  <Pressable
                    key={w}
                    className="mb-2 rounded-2xl bg-night-700 py-4"
                    onPress={() =>
                      setWicketPick({
                        type: w,
                        out: w === "run_out" ? null : striker,
                        fielder: undefined,
                      })
                    }
                  >
                    <Text className="text-center font-semibold text-slate-100">
                      {t(`scorer.wicketType.${w}`)}
                    </Text>
                  </Pressable>
                ))}
              </>
            )}
            {wicketPick.type && !wicketPick.out && (
              <>
                <Text className="mb-4 text-lg font-bold text-slate-50">
                  {t("scorer.whoOut")}
                </Text>
                {battingXi
                  .filter((p) => p.id === striker || p.id === nonStriker)
                  .map((p) => (
                    <Pressable
                      key={p.id}
                      className="mb-2 rounded-2xl bg-night-700 py-4"
                      onPress={() =>
                        setWicketPick({ ...wicketPick, out: p.id })
                      }
                    >
                      <Text className="text-center font-semibold text-slate-100">
                        {p.name}
                      </Text>
                    </Pressable>
                  ))}
              </>
            )}
            {wicketPick.type &&
              wicketPick.out &&
              FIELDER_WICKETS.includes(wicketPick.type) &&
              wicketPick.fielder === undefined && (
                <>
                  <Text className="mb-4 text-lg font-bold text-slate-50">
                    {t("scorer.fielder")}
                  </Text>
                  <ScrollView className="max-h-72">
                    {bowlingXi.map((p) => (
                      <Pressable
                        key={p.id}
                        className="mb-2 rounded-2xl bg-night-700 py-3"
                        onPress={() =>
                          setWicketPick({ ...wicketPick, fielder: p.id })
                        }
                      >
                        <Text className="text-center font-semibold text-slate-100">
                          {p.name}
                        </Text>
                      </Pressable>
                    ))}
                    <Pressable
                      className="mb-2 rounded-2xl border border-slate-600 py-3"
                      onPress={() =>
                        setWicketPick({ ...wicketPick, fielder: null })
                      }
                    >
                      <Text className="text-center text-slate-400">
                        {t("common.skip")}
                      </Text>
                    </Pressable>
                  </ScrollView>
                </>
              )}
            {wicketPick.type &&
              wicketPick.out &&
              (wicketPick.fielder !== undefined ||
                !FIELDER_WICKETS.includes(wicketPick.type)) && (
                <Button
                  title={t("scorer.confirmWicket")}
                  variant="danger"
                  onPress={() => {
                    sendBall({
                      wicket_type: wicketPick.type,
                      out_player_id: wicketPick.out,
                      fielder_id: wicketPick.fielder ?? undefined,
                      bat_runs: 0,
                    });
                    setWicketPick({
                      type: null,
                      out: null,
                      fielder: undefined,
                    });
                    setWicketModal(false);
                  }}
                  className="mt-2"
                />
              )}
            <Button
              title={t("common.cancel")}
              variant="ghost"
              onPress={() => {
                setWicketPick({ type: null, out: null, fielder: undefined });
                setWicketModal(false);
              }}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
