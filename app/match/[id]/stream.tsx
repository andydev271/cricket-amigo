import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/src/lib/api";
import {
    nitroCallback as callback,
    RtmpPublisherView as Cam,
    requestRtmpPermissions,
    type RtmpPublisherViewMethods,
} from "@/src/lib/livestream";
import {
    Button,
    Card,
    Input,
    Screen,
    Subtitle,
    Title,
} from "@/src/ui/primitives";

// Null on web — the fallback card renders instead.
const CamView = Cam as unknown as React.ComponentType<Record<string, unknown>> | null;

export default function StreamSetupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const matchId = Number(id);
  const publisher = useRef<RtmpPublisherViewMethods | null>(null);

  const [permitted, setPermitted] = useState(false);
  const [rtmpUrl, setRtmpUrl] = useState("rtmp://a.rtmp.youtube.com/live2");
  const [streamKey, setStreamKey] = useState("");
  const [watchUrl, setWatchUrl] = useState("");
  const [status, setStatus] = useState<
    "idle" | "connecting" | "live" | "failed" | "ended"
  >("idle");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    requestRtmpPermissions().then(({ granted }) => setPermitted(granted));
  }, []);

  // Stable identity required — a new callback each render re-inits the camera.
  const hybridRef = useMemo(
    () => callback((ref: RtmpPublisherViewMethods) => {
      publisher.current = ref;
      const rotation = ref.getCameraOrientation();
      ref.prepareVideo(1280, 720, 30, 2_500_000, 2, rotation);
      ref.prepareAudio(128_000, 44_100, false);
      ref.startPreview("back", 1280, 720);
      ref.setAutoReconnect(5, 3000);
      ref.setOnConnectionEvent((event) => {
        if (event === "connectionSuccess") setStatus("live");
        else if (event === "connectionFailed" || event === "authError")
          setStatus("failed");
        else if (event === "disconnect")
          setStatus((s) => (s === "live" ? "ended" : s));
        else if (event === "connectionStarted" || event === "reconnecting")
          setStatus("connecting");
      });
    }),
    [],
  );

  const canStart =
    rtmpUrl.trim() &&
    streamKey.trim() &&
    status !== "live" &&
    status !== "connecting";

  const goLive = async () => {
    if (!publisher.current || !canStart) return;
    setStatus("connecting");
    setSaving(true);
    try {
      // Persist watch URL so spectators see the embed + mark match stream live.
      // The stream key itself never leaves the device.
      await api.matches.setStream(matchId, {
        stream_url: watchUrl.trim() || undefined,
        stream_key: undefined,
        stream_status: "live",
      });
      const key = streamKey.trim();
      publisher.current.startStream(
        `${rtmpUrl.trim().replace(/\/$/, "")}/${key}`,
      );
    } catch {
      setStatus("failed");
    } finally {
      setSaving(false);
    }
  };

  const stop = () => {
    publisher.current?.stopStream();
    setStatus("ended");
    api.matches.setStream(matchId, { stream_status: "ended" }).catch(() => {});
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t("stream.title") }} />
      <View className="flex-1 px-5 pb-8">
        <Title className="mb-1">{t("stream.title")}</Title>
        <Subtitle className="mb-4">{t("stream.subtitle")}</Subtitle>

        {CamView && permitted ? (
          <View className="mb-4 aspect-[9/16] max-h-[45%] self-stretch overflow-hidden rounded-2xl bg-black">
            <CamView
              style={StyleSheet.absoluteFill}
              hybridRef={hybridRef}
              videoCodec="h264"
              audioCodec="aac"
              aspectRatioMode="adjust"
            />
            {status === "live" && (
              <View className="absolute left-3 top-3 flex-row items-center rounded-full bg-red-600 px-3 py-1">
                <View className="mr-1.5 h-2 w-2 rounded-full bg-white" />
                <Text className="text-xs font-bold text-white">LIVE</Text>
              </View>
            )}
          </View>
        ) : (
          <Card className="mb-4">
            <Text className="text-sm text-slate-300">
              {CamView ? t("stream.noPermission") : t("stream.noNative")}
            </Text>
          </Card>
        )}

        <Input
          value={rtmpUrl}
          onChangeText={setRtmpUrl}
          placeholder={t("stream.rtmpUrl")}
          className="mb-3"
        />
        <Input
          value={streamKey}
          onChangeText={setStreamKey}
          placeholder={t("stream.streamKey")}
          secureTextEntry
          className="mb-3"
        />
        <Input
          value={watchUrl}
          onChangeText={setWatchUrl}
          placeholder={t("stream.watchUrl")}
          className="mb-4"
        />

        {status === "failed" && (
          <Text className="mb-3 text-center font-semibold text-red-400">
            {t("stream.failed")}
          </Text>
        )}
        {status === "ended" && (
          <Text className="mb-3 text-center text-slate-400">
            {t("stream.ended")}
          </Text>
        )}

        {status !== "live" ? (
          <Button
            title={
              status === "connecting"
                ? t("stream.connecting")
                : t("stream.goLive")
            }
            onPress={goLive}
            loading={saving}
            disabled={!canStart || !CamView || !permitted}
          />
        ) : (
          <Button title={t("stream.stop")} variant="danger" onPress={stop} />
        )}

        <Text className="mt-4 text-center text-xs text-slate-500">
          {t("stream.fallbackHint")}
        </Text>
      </View>
    </Screen>
  );
}
