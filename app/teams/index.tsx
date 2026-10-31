import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import { api, type Team } from "@/src/lib/api";
import { Button, Card, Input, Screen, Subtitle, Title } from "@/src/ui/primitives";

const ROLE_BADGE: Record<string, string> = {
  owner: "#a16207",
  admin: "#1d4ed8",
  coach: "#7c3aed",
  scorer: "#0d9488",
  player: "#166534",
  viewer: "#475569",
};

export default function TeamsScreen() {
  const { t } = useTranslation();
  const [teams, setTeams] = useState<Team[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setTeams(await api.teams.list());
    } catch {
      // offline
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const team = await api.teams.create({ name: name.trim(), city: city.trim() || undefined });
      router.push(`/teams/${team.id}`);
    } catch (e) {
      setError(t("teams.createError"));
      console.warn(e);
    }
    setSaving(false);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t("teams.title") }} />
      <ScrollView contentContainerClassName="px-5 pb-10">
        <View className="mt-2 flex-row items-center justify-between">
          <Title>{t("teams.title")}</Title>
          <Pressable
            onPress={() => setShowCreate((v) => !v)}
            className="rounded-full bg-pitch-500 px-4 py-2"
          >
            <Text className="text-sm font-bold text-pitch-950">
              {showCreate ? t("common.cancel") : `+ ${t("teams.new")}`}
            </Text>
          </Pressable>
        </View>

        {showCreate && (
          <Card className="mt-4">
            <Input value={name} onChangeText={setName} placeholder={t("teams.namePlaceholder")} autoCapitalize="words" />
            <Input value={city} onChangeText={setCity} placeholder={t("teams.cityPlaceholder")} autoCapitalize="words" className="mt-3" />
            {error && <Text className="mt-2 text-sm text-red-400">{error}</Text>}
            <Button title={t("teams.create")} onPress={create} loading={saving} className="mt-4" />
          </Card>
        )}

        {teams.length === 0 && !showCreate ? (
          <Card className="mt-6">
            <Subtitle>{t("teams.empty")}</Subtitle>
            <Subtitle className="mt-1">{t("teams.emptyHint")}</Subtitle>
          </Card>
        ) : (
          <View className="mt-4 gap-3">
            {teams.map((team) => (
              <Pressable key={team.id} onPress={() => router.push(`/teams/${team.id}`)}>
                <Card>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-slate-100">{team.name}</Text>
                      <Text className="mt-0.5 text-sm text-slate-400">
                        {[team.city, t("teams.members", { count: team.member_count })]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    </View>
                    <View
                      className="rounded-full px-3 py-1"
                      style={{ backgroundColor: ROLE_BADGE[team.my_role] ?? "#334155" }}
                    >
                      <Text className="text-xs font-bold text-white">
                        {t(`teams.role.${team.my_role}`)}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
