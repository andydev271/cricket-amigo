import * as MediaLibrary from "expo-media-library";
import { router, Stack, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { useVideoPlayer, VideoView } from "expo-video";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

import { analyzeClip } from "@/src/analysis/analyze";
import type { AnalysisResult } from "@/src/analysis/types";
import {
    deleteClip,
    getAnalysis,
    getClip,
    saveAnalysis,
    trimClip,
    type Clip,
} from "@/src/lib/clips";
import { Button, Screen, Subtitle, Title } from "@/src/ui/primitives";

const fmtS = (s: number) => `${s.toFixed(1)}s`;

export default function ClipDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [clip, setClip] = useState<Clip | null>(() => getClip(id));
  const [markIn, setMarkIn] = useState<number | null>(null);
  const [markOut, setMarkOut] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(() =>
    getAnalysis<AnalysisResult>(id),
  );
  const [aiProgress, setAiProgress] = useState<number | null>(null);

  const player = useVideoPlayer(clip?.uri ?? null);

  const runAnalysis = async () => {
    if (!clip || aiProgress !== null) return;
    setAiProgress(0);
    try {
      const result = await analyzeClip(clip, (p) => setAiProgress(p.progress));
      saveAnalysis(clip.id, result);
      setAnalysis(result);
    } catch (e) {
      console.warn("analysis failed", e);
      Alert.alert(t("analysis.error"));
    }
    setAiProgress(null);
  };

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
                markIn !== null
                  ? "border-pitch-500 bg-pitch-900/60"
                  : "border-slate-600/40"
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
                markOut !== null
                  ? "border-pitch-500 bg-pitch-900/60"
                  : "border-slate-600/40"
              }`}
            >
              <Text className="text-xs text-slate-400">
                {t("clip.markOut")}
              </Text>
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

        {/* AI analysis */}
        <View className="mt-4 rounded-3xl bg-night-800/80 p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-slate-100">
              {t("analysis.title")}
            </Text>
            {analysis && (
              <View className="rounded-full bg-pitch-900/70 px-3 py-1">
                <Text className="text-xs font-semibold text-pitch-300">
                  {Math.round(analysis.poseCoverage * 100)}
                  {t("analysis.coverageSuffix")}
                </Text>
              </View>
            )}
          </View>

          {!analysis && aiProgress === null && (
            <>
              <Text className="mt-1 text-sm text-slate-400">
                {t("analysis.hint")}
              </Text>
              <Button
                title={t("analysis.run")}
                onPress={runAnalysis}
                className="mt-4"
              />
            </>
          )}

          {aiProgress !== null && (
            <View className="mt-4">
              <View className="h-2 overflow-hidden rounded-full bg-night-700">
                <View
                  className="h-2 rounded-full bg-pitch-500"
                  style={{ width: `${Math.round(aiProgress * 100)}%` }}
                />
              </View>
              <View className="mt-2 flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#4ade80" />
                <Text className="text-sm text-slate-400">
                  {t("analysis.running", {
                    pct: Math.round(aiProgress * 100),
                  })}
                </Text>
              </View>
            </View>
          )}

          {analysis && (
            <View className="mt-4">
              {analysis.feedback.length === 0 ? (
                <Text className="text-sm text-pitch-300">
                  {t("analysis.clean")}
                </Text>
              ) : (
                analysis.feedback.map((f) => (
                  <View
                    key={f.code}
                    className="mb-2 flex-row items-start gap-2"
                  >
                    <Text className="text-base">
                      {f.severity === "warn" ? "⚠️" : "💡"}
                    </Text>
                    <Text className="flex-1 text-sm text-slate-200">
                      {t(`analysis.feedback.${f.code}`)}
                    </Text>
                  </View>
                ))
              )}

              <View className="mt-4 border-t border-slate-700/40 pt-3">
                <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("analysis.metrics")}
                </Text>
                {analysis.metrics.map((m) => (
                  <View
                    key={m.key}
                    className="flex-row items-center justify-between py-1"
                  >
                    <Text className="text-sm text-slate-400">
                      {t(`analysis.metric.${m.key}`)}
                    </Text>
                    <Text className="text-sm font-semibold text-slate-200">
                      {m.value === null
                        ? "—"
                        : m.unit === "deg"
                          ? `${m.value.toFixed(0)}°`
                          : m.value.toFixed(3)}
                    </Text>
                  </View>
                ))}
              </View>

              <Button
                title={t("analysis.rerun")}
                onPress={runAnalysis}
                variant="ghost"
                className="mt-3"
              />
            </View>
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
