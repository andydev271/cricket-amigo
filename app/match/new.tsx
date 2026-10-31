import { router, Stack } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import { api } from "@/src/lib/api";
import {
    Button,
    Card,
    Input,
    Screen,
    Title
} from "@/src/ui/primitives";

const OVERS_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50];
const BALL_TYPES = ["leather", "tennis", "street"] as const;

interface TeamForm {
  name: string;
  players: string[];
}

function TeamEditor({
  title,
  team,
  onChange,
  t,
}: {
  title: string;
  team: TeamForm;
  onChange: (t: TeamForm) => void;
  t: (k: string) => string;
}) {
  const setPlayer = (i: number, name: string) => {
    const players = [...team.players];
    players[i] = name;
    onChange({ ...team, players });
  };

  return (
    <Card className="mb-4">
      <Text className="mb-3 text-lg font-bold text-slate-50">{title}</Text>
      <Input
        value={team.name}
        onChangeText={(name) => onChange({ ...team, name })}
        placeholder={t("match.teamName")}
        className="mb-3"
      />
      {team.players.map((p, i) => (
        <View key={i} className="mb-2 flex-row items-center">
          <Text className="w-7 text-xs text-slate-500">{i + 1}.</Text>
          <Input
            value={p}
            onChangeText={(v) => setPlayer(i, v)}
            placeholder={`${t("match.player")} ${i + 1}`}
            className="flex-1 py-3"
          />
          {team.players.length > 2 && (
            <Pressable
              onPress={() =>
                onChange({
                  ...team,
                  players: team.players.filter((_, j) => j !== i),
                })
              }
              className="ml-2 px-2 py-1"
            >
              <Text className="text-lg text-red-400">×</Text>
            </Pressable>
          )}
        </View>
      ))}
      {team.players.length < 15 && (
        <Pressable
          onPress={() => onChange({ ...team, players: [...team.players, ""] })}
          className="mt-1 py-2"
        >
          <Text className="font-semibold text-pitch-400">
            + {t("match.addPlayer")}
          </Text>
        </Pressable>
      )}
    </Card>
  );
}

export default function NewMatchScreen() {
  const { t } = useTranslation();
  const [teamA, setTeamA] = useState<TeamForm>({ name: "", players: ["", ""] });
  const [teamB, setTeamB] = useState<TeamForm>({ name: "", players: ["", ""] });
  const [overs, setOvers] = useState(20);
  const [ballType, setBallType] =
    useState<(typeof BALL_TYPES)[number]>("tennis");
  const [ground, setGround] = useState("");
  const [city, setCity] = useState("");
  const [tossWinner, setTossWinner] = useState<"a" | "b" | null>(null);
  const [tossDecision, setTossDecision] = useState<"bat" | "bowl">("bat");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid =
    teamA.name.trim() &&
    teamB.name.trim() &&
    teamA.players.filter((p) => p.trim()).length >= 2 &&
    teamB.players.filter((p) => p.trim()).length >= 2;

  const create = async () => {
    setSaving(true);
    setError(null);
    try {
      const match = await api.matches.create({
        team_a: {
          name: teamA.name.trim(),
          players: teamA.players
            .filter((p) => p.trim())
            .map((name, i) => ({
              name: name.trim(),
              is_captain: i === 0,
            })),
        },
        team_b: {
          name: teamB.name.trim(),
          players: teamB.players
            .filter((p) => p.trim())
            .map((name, i) => ({
              name: name.trim(),
              is_captain: i === 0,
            })),
        },
        overs_limit: overs,
        ball_type: ballType,
        ground: ground.trim() || undefined,
        city: city.trim() || undefined,
        ...(tossWinner
          ? { toss_winner: tossWinner, toss_decision: tossDecision }
          : {}),
      });
      router.replace(`/match/${match.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t("match.new") }} />
      <ScrollView contentContainerClassName="px-5 pb-10">
        <Title className="mb-4">{t("match.new")}</Title>

        <TeamEditor
          title={t("match.teamA")}
          team={teamA}
          onChange={setTeamA}
          t={t}
        />
        <TeamEditor
          title={t("match.teamB")}
          team={teamB}
          onChange={setTeamB}
          t={t}
        />

        <Card className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-slate-300">
            {t("match.overs")}
          </Text>
          <View className="mb-4 flex-row flex-wrap">
            {OVERS_OPTIONS.map((o) => (
              <Pressable
                key={o}
                onPress={() => setOvers(o)}
                className={`mb-2 mr-2 rounded-full px-4 py-2 ${
                  overs === o ? "bg-pitch-500" : "bg-night-700"
                }`}
              >
                <Text
                  className={
                    overs === o ? "font-bold text-pitch-950" : "text-slate-300"
                  }
                >
                  {o}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="mb-2 text-sm font-semibold text-slate-300">
            {t("match.ballType")}
          </Text>
          <View className="mb-4 flex-row">
            {BALL_TYPES.map((b) => (
              <Pressable
                key={b}
                onPress={() => setBallType(b)}
                className={`mr-2 rounded-full px-4 py-2 ${
                  ballType === b ? "bg-pitch-500" : "bg-night-700"
                }`}
              >
                <Text
                  className={
                    ballType === b
                      ? "font-bold text-pitch-950"
                      : "text-slate-300"
                  }
                >
                  {t(`match.ball.${b}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Input
            value={ground}
            onChangeText={setGround}
            placeholder={t("match.ground")}
            className="mb-3"
          />
          <Input
            value={city}
            onChangeText={setCity}
            placeholder={t("match.city")}
          />
        </Card>

        <Card className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-slate-300">
            {t("match.toss")} ({t("common.optional")})
          </Text>
          <View className="flex-row items-center">
            {[teamA, teamB].map((team, i) => {
              const side = i === 0 ? "a" : "b";
              const sel = tossWinner === side;
              return (
                <Pressable
                  key={side}
                  onPress={() =>
                    setTossWinner(sel ? null : (side as "a" | "b"))
                  }
                  className={`mr-2 rounded-full px-4 py-2 ${sel ? "bg-pitch-500" : "bg-night-700"}`}
                >
                  <Text
                    className={
                      sel ? "font-bold text-pitch-950" : "text-slate-300"
                    }
                  >
                    {team.name ||
                      (side === "a" ? t("match.teamA") : t("match.teamB"))}
                  </Text>
                </Pressable>
              );
            })}
            {tossWinner && (
              <>
                {(["bat", "bowl"] as const).map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setTossDecision(d)}
                    className={`mr-2 rounded-full px-4 py-2 ${
                      tossDecision === d ? "bg-gold-500" : "bg-night-700"
                    }`}
                  >
                    <Text
                      className={
                        tossDecision === d
                          ? "font-bold text-night-900"
                          : "text-slate-300"
                      }
                    >
                      {t(`match.${d}`)}
                    </Text>
                  </Pressable>
                ))}
              </>
            )}
          </View>
        </Card>

        {error && (
          <Text className="mb-3 text-center text-red-400">{error}</Text>
        )}
        <Button
          title={t("match.create")}
          onPress={create}
          loading={saving}
          disabled={!valid}
        />
      </ScrollView>
    </Screen>
  );
}
