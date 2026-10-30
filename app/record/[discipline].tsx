import {
    CameraView,
    useCameraPermissions,
    useMicrophonePermissions,
} from "expo-camera";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    Clip,
    deleteClip,
    listClips,
    saveClip,
    type Discipline,
} from "@/src/lib/clips";
import { DISCIPLINE_GUIDES, DISCIPLINES } from "@/src/lib/disciplines";
import { Button } from "@/src/ui/primitives";

type Phase = "guide" | "recording" | "saving";

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export default function RecordScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ discipline: string }>();
  const discipline = DISCIPLINES.includes(params.discipline as Discipline)
    ? (params.discipline as Discipline)
    : "batting";
  const guide = DISCIPLINE_GUIDES[discipline];

  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();

  const cameraRef = useRef<CameraView>(null);
  const sessionId = useRef(`s-${Date.now()}`);
  const recordStart = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [phase, setPhase] = useState<Phase>("guide");
  const [elapsed, setElapsed] = useState(0);
  const [reps, setReps] = useState<Clip[]>([]);
  const [error, setError] = useState<string | null>(null);

  const tips = t(guide.tipsKey, { returnObjects: true }) as string[];

  useEffect(() => {
    if (!camPerm?.granted) requestCamPerm();
    if (!micPerm?.granted) requestMicPerm();
  }, [camPerm?.granted, micPerm?.granted, requestCamPerm, requestMicPerm]);

  useEffect(() => {
    setReps(listClips().filter((c) => c.sessionId === sessionId.current));
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const granted = camPerm?.granted && micPerm?.granted;

  const startRep = async () => {
    if (!cameraRef.current || phase !== "guide") return;
    setError(null);
    try {
      setPhase("recording");
      recordStart.current = Date.now();
      setElapsed(0);
      timer.current = setInterval(
        () => setElapsed(Date.now() - recordStart.current),
        250,
      );

      // Resolves when stopRecording() fires or maxDuration is hit.
      const video = await cameraRef.current.recordAsync({
        maxDuration: guide.maxRepSeconds,
      });

      if (timer.current) clearInterval(timer.current);
      setPhase("saving");
      const durationMs = Date.now() - recordStart.current;

      if (video?.uri) {
        const clip = await saveClip({
          tempUri: video.uri,
          discipline,
          sessionId: sessionId.current,
          repNumber: reps.length + 1,
          durationMs,
        });
        setReps((prev) => [clip, ...prev]);
      }
      setPhase("guide");
    } catch (e) {
      if (timer.current) clearInterval(timer.current);
      setPhase("guide");
      setError(t("record.saveError"));
      console.warn("record failed", e);
    }
  };

  const stopRep = () => {
    cameraRef.current?.stopRecording();
  };

  const retake = (clip: Clip) => {
    deleteClip(clip.id);
    setReps((prev) => prev.filter((c) => c.id !== clip.id));
  };

  const recording = phase === "recording";
  const remaining = Math.max(0, guide.maxRepSeconds * 1000 - elapsed);

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />

      {granted ? (
        <CameraView
          ref={cameraRef}
          mode="video"
          facing="back"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-lg font-semibold text-slate-100">
            {t("record.permissionTitle")}
          </Text>
          <Text className="mt-2 text-center text-sm text-slate-400">
            {t("record.permissionHint")}
          </Text>
          <Button
            title={t("record.permissionGrant")}
            onPress={() => {
              requestCamPerm();
              requestMicPerm();
            }}
            className="mt-6 self-stretch"
          />
        </View>
      )}

      {/* Top overlay — discipline + framing hint */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="absolute left-0 right-0 top-0 px-5"
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/50"
          >
            <Text className="text-lg font-bold text-white">✕</Text>
          </Pressable>
          <View className="rounded-full bg-black/50 px-4 py-2">
            <Text className="text-sm font-bold text-white">
              {t(`train.${discipline}`)}
            </Text>
          </View>
          <View className="w-10" />
        </View>
        <View className="mt-3 self-center rounded-full bg-black/40 px-4 py-1.5">
          <Text className="text-center text-xs text-white">
            {t(guide.frameKey)}
          </Text>
        </View>
      </View>

      {/* Recording indicator */}
      {recording && (
        <View
          style={{ top: insets.top + 96 }}
          className="absolute left-0 right-0 items-center"
        >
          <View className="flex-row items-center rounded-full bg-red-600/90 px-4 py-1.5">
            <View className="mr-2 h-2.5 w-2.5 rounded-full bg-white" />
            <Text className="font-bold text-white">
              {fmt(elapsed)} · −{fmt(remaining)}
            </Text>
          </View>
        </View>
      )}

      {/* Bottom panel */}
      <View
        style={{ paddingBottom: insets.bottom + 16 }}
        className="absolute bottom-0 left-0 right-0 px-5"
      >
        {/* Session rep strip */}
        {reps.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            <View className="flex-row gap-2">
              {reps.map((rep, i) => (
                <View key={rep.id}>
                  <Pressable
                    onPress={() => router.push(`/library/${rep.id}`)}
                    className="h-16 w-16 overflow-hidden rounded-xl border border-white/20 bg-night-800"
                  >
                    {rep.thumbnailUri ? (
                      <Image
                        source={{ uri: rep.thumbnailUri }}
                        style={{ width: 64, height: 64 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="flex-1 items-center justify-center">
                        <Text className="text-xs font-bold text-pitch-400">
                          #{reps.length - i}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => retake(rep)}
                    className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-red-600"
                  >
                    <Text className="text-[10px] font-bold text-white">✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        <View className="rounded-3xl bg-black/70 p-5">
          {phase === "guide" && (
            <>
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-base font-bold text-white">
                  {t("record.rep", { count: reps.length + 1 })}
                </Text>
                <Text className="text-sm text-slate-300">
                  {t("record.maxLen", { s: guide.maxRepSeconds })}
                </Text>
              </View>
              {reps.length === 0 &&
                tips.map((tip, i) => (
                  <Text key={i} className="mb-1 text-sm text-slate-300">
                    {`• ${tip}`}
                  </Text>
                ))}
              {error && (
                <Text className="mb-2 text-sm text-red-400">{error}</Text>
              )}
            </>
          )}

          <View className="mt-2 flex-row items-center justify-center gap-6">
            {reps.length > 0 && phase === "guide" && (
              <Pressable
                onPress={() => router.replace("/(tabs)/library")}
                className="items-center"
              >
                <View className="h-12 w-12 items-center justify-center rounded-full bg-night-700">
                  <Text className="font-bold text-pitch-400">✓</Text>
                </View>
                <Text className="mt-1 text-xs text-slate-300">
                  {t("record.done")}
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={recording ? stopRep : startRep}
              disabled={!granted || phase === "saving"}
              className="items-center"
            >
              <View
                className={`h-20 w-20 items-center justify-center rounded-full border-4 border-white ${
                  recording ? "bg-red-600" : "bg-transparent"
                } ${phase === "saving" ? "opacity-50" : ""}`}
              >
                {recording ? (
                  <View className="h-7 w-7 rounded-md bg-white" />
                ) : (
                  <View className="h-16 w-16 rounded-full bg-red-600" />
                )}
              </View>
              <Text className="mt-2 text-sm font-semibold text-white">
                {phase === "saving"
                  ? t("record.saving")
                  : recording
                    ? t("record.stop")
                    : reps.length === 0
                      ? t("record.start")
                      : t("record.nextRep")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
