import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

import { api, ApiError } from "@/src/lib/api";
import { colors } from "@/src/theme";
import { Card, EmptyState, Screen } from "@/src/ui/primitives";

type FoundUser = {
  id: number;
  name: string;
  username: string | null;
  avatar_url: string | null;
  city: string | null;
};

export default function FriendsScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoundUser[]>([]);
  const [friends, setFriends] = useState<Record<string, unknown>[]>([]);
  const [requests, setRequests] = useState<Record<string, any>[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    api.friends
      .list()
      .then(setFriends)
      .catch(() => {});
    api.friends
      .requests()
      .then(setRequests)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await api.users.search(query.trim()));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const sendRequest = async (userId: number) => {
    try {
      await api.friends.send(userId);
      setSentIds((s) => new Set(s).add(userId));
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
    }
  };

  const respond = async (id: number, action: "accept" | "decline") => {
    try {
      await api.friends.respond(id, action);
      setRequests((r) => r.filter((x) => x.id !== id));
      if (action === "accept")
        setFriends(await api.friends.list().catch(() => friends));
    } catch {
      // ignore
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t("friends.title") }} />
      <View className="px-5 pt-2">
        <View className="mb-3 flex-row">
          {(
            [
              ["/community/leaderboard", "community.leaderboard"],
              ["/community/looking_for", "community.lookingFor"],
              ["/community/requests", "community.requests"],
            ] as const
          ).map(([href, label]) => (
            <Pressable
              key={href}
              onPress={() => router.push(href)}
              className="mr-2 rounded-full bg-night-700 px-3 py-1.5"
            >
              <Text className="text-xs font-semibold text-slate-300">
                {t(label)}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("friends.findFriends")}
          placeholderTextColor={colors.textMuted}
          className="rounded-2xl border border-slate-600/40 bg-night-800 px-4 py-4 text-base text-slate-50"
        />
      </View>

      <FlatList
        data={query.length >= 2 ? results : []}
        keyExtractor={(item) => String(item.id)}
        contentContainerClassName="gap-3 px-5 pb-10 pt-4"
        ListHeaderComponent={
          <View className="gap-4">
            {requests.length > 0 && (
              <Card>
                <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  {t("friends.requests")}
                </Text>
                {requests.map((r) => (
                  <View
                    key={r.id}
                    className="flex-row items-center justify-between py-2"
                  >
                    <Text className="text-base text-slate-100">
                      {r.sender?.name ?? ""}{" "}
                      {r.sender?.username ? `@${r.sender.username}` : ""}
                    </Text>
                    <View className="flex-row gap-3">
                      <Pressable onPress={() => respond(r.id, "accept")}>
                        <Text className="font-semibold text-pitch-400">
                          {t("friends.accept")}
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => respond(r.id, "decline")}>
                        <Text className="font-semibold text-red-400">
                          {t("friends.decline")}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </Card>
            )}

            {query.length < 2 && friends.length === 0 && (
              <EmptyState
                title={t("friends.title")}
                hint={t("friends.emptyHint")}
              />
            )}

            {query.length < 2 &&
              friends.map((f: any) => (
                <Card key={f.id}>
                  <Text className="text-base text-slate-100">
                    {f.name} {f.username ? `@${f.username}` : ""}
                  </Text>
                </Card>
              ))}
          </View>
        }
        renderItem={({ item }) => (
          <Card className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-semibold text-slate-100">
                {item.name}
              </Text>
              <Text className="text-sm text-slate-400">
                {item.username ? `@${item.username}` : ""}
                {item.city ? ` · ${item.city}` : ""}
              </Text>
            </View>
            <Pressable
              onPress={() => sendRequest(item.id)}
              disabled={sentIds.has(item.id)}
              className={`rounded-xl px-4 py-2 ${sentIds.has(item.id) ? "bg-night-800" : "bg-pitch-500"}`}
            >
              <Text
                className={
                  sentIds.has(item.id)
                    ? "text-slate-400"
                    : "font-bold text-pitch-950"
                }
              >
                {sentIds.has(item.id) ? "✓" : t("friends.add")}
              </Text>
            </Pressable>
          </Card>
        )}
      />
    </Screen>
  );
}
