import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useAuth } from "@/src/stores/auth";
import { Card, Screen, Subtitle, Title } from "@/src/ui/primitives";

const DISCIPLINES = [
  { key: "batting", icon: "🏏", color: "#166534" },
  { key: "bowling", icon: "⚡", color: "#854d0e" },
  { key: "fielding", icon: "🧤", color: "#1e3a8a" },
  { key: "keeping", icon: "🥅", color: "#7c2d12" },
] as const;

export default function TrainScreen() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-5 pb-8">
        <View className="mt-2 flex-row items-center justify-between">
          <View className="flex-1">
            <Title>{t("train.title")}</Title>
            <Subtitle className="mt-1">{t("train.subtitle")}</Subtitle>
          </View>
          <Link href="/settings" asChild>
            <Pressable className="h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-night-800">
              {user?.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  style={{ width: 44, height: 44 }}
                />
              ) : (
                <Text className="text-lg font-bold text-pitch-400">
                  {(user?.name?.[0] ?? "?").toUpperCase()}
                </Text>
              )}
            </Pressable>
          </Link>
        </View>

        <View className="mt-6 gap-4">
          {DISCIPLINES.map((d) => (
            <Pressable
              key={d.key}
              onPress={() => router.push(`/record/${d.key}`)}
              className="overflow-hidden rounded-3xl"
            >
              <View
                className="flex-row items-center justify-between p-6"
                style={{ backgroundColor: d.color }}
              >
                <View>
                  <Text className="text-xl font-bold text-white">
                    {t(`train.${d.key}`)}
                  </Text>
                  <Text className="mt-1 text-sm text-white/70">
                    {t("train.recordSession")}
                  </Text>
                </View>
                <Text style={{ fontSize: 40 }}>{d.icon}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Card className="mt-6">
          <Text className="text-sm text-slate-400">{t("train.emptyHint")}</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}
