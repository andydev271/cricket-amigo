import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { deleteClip, getClip, trimClip, type Clip } from "@/src/lib/clips";
import { Button, Screen, Subtitle, Title } from "@/src/ui/primitives";

const fmtS = (s: number) => `${s.toFixed(1)}s`;

export default function ClipDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [clip, setClip] = useState<Clip | null>(() => getClip(id));
  const [markIn, setMarkIn] = useState<number | null>(null);
  const [markOut, setMarkOut] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const player = useVideoPlayer(clip?.uri ?? null);

  if (!clip) {
    return (
      <Screen>
        <Title className="mt-8 px-5">{t("clip.missing")}</Title>
      </Screen>
    );
  }

  const durationS = clip.durationMs / 1000;
  const canTrim =
    markIn !== null &&
    markOut !== null &&
    markOut > markIn &&
    markOut <= durationS + 0.1;

  const share = async () => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(clip.uri, { mimeType: "video/mp4" });
    }
  };

  const saveToGallery = async () => {
    const perm = await MediaLibrary.requestPermissionsAsync(true);
    if (!perm.granted) return;
    await MediaLibrary.createAssetAsync(clip.uri);
    Alert.alert(t("clip.savedToGallery"));
  };

  const doTrim = async () => {
    if (!canTrim) return;
    setBusy(true);
    try {
      const trimmed = await trimClip(clip, markIn!, markOut!);
      router.replace(`/library/${trimmed.id}`);
    } catch (e) {
      console.warn("trim failed", e);
      Alert.alert(t("clip.trimError"));
    }
    setBusy(false);
  };

  const confirmDelete = () => {
    Alert.alert(t("clip.deleteTitle"), t("clip.deleteHint"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("clip.deleteConfirm"),
        style: "destructive",
        onPress: () => {
          deleteClip(clip.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t(`train.${clip.discipline}`) }} />
      <ScrollView contentContainerClassName="px-5 pb-8">
        <View className="mt-3 overflow-hidden rounded-3xl bg-black">
          <VideoView
            player={player}
            style={{ width: "100%", aspectRatio: 16 / 9 }}
            contentFit="contain"
            nativeControls
          />
        </View>

        <Title className="mt-4">{t(`train.${clip.discipline}`)}</Title>
        <Subtitle className="mt-1">
          {t("library.rep", { n: clip.repNumber })} ·{" "}
          {new Date(clip.createdAt).toLocaleString()} · {fmtS(durationS)}
        </Subtitle>

        {/* Trim */}
        <View className="mt-6 rounded-3xl bg-night-800/80 p-5">
          <Text className="text-base font-bold text-slate-100">
            {t("clip.trimTitle")}
          </Text>
          <Text className="mt-1 text-sm text-slate-400">
            {t("clip.trimHint")}
          </Text>
          <View className="mt-4 flex-row gap-3">
            <Pressable
              onPress={() => setMarkIn(player.currentTime)}
              className={`flex-1 items-center rounded-2xl border py-3 ${
                markIn !== null ? "border-pitch-500 bg-pitch-900/60" : "border-slate-600/40"
              }`}
            >
              <Text className="text-xs text-slate-400">{t("clip.markIn")}</Text>
              <Text className="text-base font-bold text-slate-100">
                {markIn !== null ? fmtS(markIn) : "—"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMarkOut(player.currentTime)}
              className={`flex-1 items-center rounded-2xl border py-3 ${
                markOut !== null ? "border-pitch-500 bg-pitch-900/60" : "border-slate-600/40"
              }`}
            >
              <Text className="text-xs text-slate-400">{t("clip.markOut")}</Text>
              <Text className="text-base font-bold text-slate-100">
                {markOut !== null ? fmtS(markOut) : "—"}
              </Text>
            </Pressable>
          </View>
          {canTrim && (
            <Button
              title={t("clip.saveTrim")}
              onPress={doTrim}
              loading={busy}
              variant="secondary"
              className="mt-4"
            />
          )}
        </View>

        {/* Actions */}
        <View className="mt-4 gap-3">
          <Button title={t("clip.share")} onPress={share} />
          <Button
            title={t("clip.saveGallery")}
            onPress={saveToGallery}
            variant="secondary"
          />
          <Button
            title={t("clip.delete")}
            onPress={confirmDelete}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
