import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, Share, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { api, type Team } from "@/src/lib/api";
import { useAuth } from "@/src/stores/auth";
import { Button, Card, Screen, Subtitle, Title } from "@/src/ui/primitives";

export default function TeamDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useAuth((s) => s.user);
  const [team, setTeam] = useState<Team | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setTeam(await api.teams.get(Number(id)));
    } catch {
      // offline / forbidden
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const isManager = team?.my_role === "owner" || team?.my_role === "admin";

  const makeInvite = async () => {
    if (!team) return;
    setBusy(true);
    try {
      const inv = await api.teams.createInvite(team.id, { role: "player" });
      setInviteUrl(`cricketamigo://join/${inv.token}`);
    } catch (e) {
      console.warn(e);
    }
    setBusy(false);
  };

  const [following, setFollowing] = useState(false);
  const [myTeams, setMyTeams] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    api.teams
      .list()
      .then(setMyTeams)
      .catch(() => {});
  }, []);

  const toggleFollow = async () => {
    if (!team) return;
    try {
      const res = await api.community.follow("team", team.id);
      setFollowing(res.following);
    } catch {}
  };

  /** Challenge: pick which of MY teams sends it. */
  const challenge = () => {
    if (!team) return;
    const others = myTeams.filter((mt) => mt.id !== team.id);
    if (others.length === 0) {
      Alert.alert(t("community.challenge"), t("community.needTeam"));
      return;
    }
    Alert.alert(
      t("community.challengeTitle"),
      t("community.challengePick", { team: team.name }),
      [
        ...others.map((mt) => ({
          text: mt.name,
          onPress: async () => {
            setBusy(true);
            try {
              await api.community.challenge(mt.id, { to_team_id: team.id });
              Alert.alert(
                t("community.challenge"),
                t("community.challengeSent"),
              );
            } finally {
              setBusy(false);
            }
          },
        })),
        { text: t("common.cancel"), style: "cancel" as const },
      ],
    );
  };

  const shareInvite = async () => {
    if (!inviteUrl || !team) return;
    await Share.share({
      message: t("teams.inviteShare", { team: team.name, url: inviteUrl }),
    });
  };

  const removeMember = (userId: number, name: string) => {
    if (!team) return;
    Alert.alert(t("teams.removeTitle"), name, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("teams.removeConfirm"),
        style: "destructive",
        onPress: async () => {
          await api.teams.removeMember(team.id, userId).catch(() => {});
          void load();
        },
      },
    ]);
  };

  const leave = () => {
    if (!team) return;
    Alert.alert(t("teams.leaveTitle"), team.name, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("teams.leaveConfirm"),
        style: "destructive",
        onPress: async () => {
          await api.teams.leave(team.id).catch(() => {});
          router.back();
        },
      },
    ]);
  };

  if (!team) {
    return (
      <Screen>
        <Title className="mt-8 px-5">{t("common.loading")}</Title>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: team.name }} />
      <ScrollView contentContainerClassName="px-5 pb-10">
        <Title className="mt-2">{team.name}</Title>
        <Subtitle className="mt-1">
          {[team.city, t("teams.members", { count: team.member_count })]
            .filter(Boolean)
            .join(" · ")}
        </Subtitle>

        {isManager && (
          <Card className="mt-5">
            {!inviteUrl ? (
              <Button
                title={t("teams.invite")}
                onPress={makeInvite}
                loading={busy}
                variant="secondary"
              />
            ) : (
              <View className="items-center">
                <Text className="mb-3 text-sm font-semibold text-slate-300">
                  {t("teams.inviteHint")}
                </Text>
                <View className="rounded-2xl bg-white p-4">
                  <QRCode value={inviteUrl} size={180} />
                </View>
                <Text className="mt-3 break-all text-center text-xs text-slate-500">
                  {inviteUrl}
                </Text>
                <Button
                  title={t("teams.shareInvite")}
                  onPress={shareInvite}
                  className="mt-4 self-stretch"
                />
              </View>
            )}
          </Card>
        )}

        <View className="mt-5 flex-row gap-3">
          <Button
            title={following ? t("community.following") : t("community.follow")}
            variant="secondary"
            onPress={toggleFollow}
            className="flex-1 py-3"
          />
          <Button
            title={t("community.challenge")}
            variant="secondary"
            onPress={challenge}
            loading={busy}
            className="flex-1 py-3"
          />
        </View>

        <Text className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-slate-400">
          {t("teams.roster")}
        </Text>
        <Card>
          {(team.members ?? []).map((m) => (
            <View
              key={m.id}
              className="flex-row items-center justify-between border-b border-slate-700/40 py-3 last:border-0"
            >
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-night-700">
                  {m.avatar_url ? (
                    <Image
                      source={{ uri: m.avatar_url }}
                      style={{ width: 40, height: 40 }}
                    />
                  ) : (
                    <Text className="font-bold text-pitch-400">
                      {(m.name?.[0] ?? "?").toUpperCase()}
                    </Text>
                  )}
                </View>
                <View>
                  <Text className="font-semibold text-slate-100">
                    {m.name}
                    {m.id === me?.id ? ` ${t("teams.you")}` : ""}
                  </Text>
                  {m.username && (
                    <Text className="text-xs text-slate-400">
                      @{m.username}
                    </Text>
                  )}
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-xs font-semibold text-slate-400">
                  {t(`teams.role.${m.role}`)}
                </Text>
                {isManager && m.role !== "owner" && m.id !== me?.id && (
                  <Pressable onPress={() => removeMember(m.id, m.name)}>
                    <Text className="text-sm font-bold text-red-400">✕</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </Card>

        {team.my_role !== "owner" && (
          <Button
            title={t("teams.leave")}
            onPress={leave}
            variant="ghost"
            className="mt-6"
          />
        )}
      </ScrollView>
    </Screen>
  );
}
