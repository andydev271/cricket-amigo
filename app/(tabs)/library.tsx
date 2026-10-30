import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Clip, listClips } from "@/src/lib/clips";
import { Card, EmptyState, Screen, Title } from "@/src/ui/primitives";

const DISCIPLINE_COLORS: Record<Clip["discipline"], string> = {
  batting: "#166534",
  bowling: "#854d0e",
  fielding: "#1e3a8a",
  keeping: "#7c2d12",
};

const fmt = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export default function LibraryScreen() {
  const { t } = useTranslation();
  const [clips, setClips] = useState<Clip[]>([]);

  useFocusEffect(
    useCallback(() => {
      setClips(listClips());
    }, []),
  );

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-5 pb-8">
        <Title className="mt-2">{t("library.title")}</Title>

        {clips.length === 0 ? (
          <Card className="mt-6">
            <EmptyState
              title={t("library.emptyTitle")}
              hint={t("library.emptyHint")}
            />
            <Pressable
              onPress={() => router.push("/record/batting")}
              className="mt-4 items-center rounded-2xl bg-pitch-500 py-3"
            >
              <Text className="font-bold text-pitch-950">
                {t("library.recordFirst")}
              </Text>
            </Pressable>
          </Card>
        ) : (
          <View className="mt-5 flex-row flex-wrap gap-3">
            {clips.map((clip) => (
              <Pressable
                key={clip.id}
                onPress={() => router.push(`/library/${clip.id}`)}
                style={{ width: "47.5%" }}
                className="overflow-hidden rounded-2xl bg-night-800"
              >
                <View className="aspect-video bg-night-700">
                  {clip.thumbnailUri ? (
                    <Image
                      source={{ uri: clip.thumbnailUri }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Text className="text-2xl">🏏</Text>
                    </View>
                  )}
                  <View className="absolute bottom-1 right-1 rounded-md bg-black/70 px-1.5 py-0.5">
                    <Text className="text-[10px] font-semibold text-white">
                      {fmt(clip.durationMs)}
                    </Text>
                  </View>
                  <View
                    className="absolute left-1 top-1 rounded-md px-1.5 py-0.5"
                    style={{
                      backgroundColor: DISCIPLINE_COLORS[clip.discipline],
                    }}
                  >
                    <Text className="text-[10px] font-bold text-white">
                      {t(`train.${clip.discipline}`)}
                    </Text>
                  </View>
                </View>
                <View className="px-3 py-2">
                  <Text className="text-xs text-slate-400">
                    {t("library.rep", { n: clip.repNumber })} ·{" "}
                    {new Date(clip.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
