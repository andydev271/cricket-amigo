import { Stack, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { api } from "@/src/lib/api";
import { ApiVideoLiveStreamView as Cam } from "@/src/lib/livestream";
import {
    Button,
    Card,
    Input,
    Screen,
    Subtitle,
    Title,
} from "@/src/ui/primitives";

export default function StreamSetupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const matchId = Number(id);
  const camRef = useRef<any>(null);

  const [rtmpUrl, setRtmpUrl] = useState("rtmp://a.rtmp.youtube.com/live2");
  const [streamKey, setStreamKey] = useState("");
  const [watchUrl, setWatchUrl] = useState("");
  const [status, setStatus] = useState<
    "idle" | "connecting" | "live" | "failed" | "ended"
  >("idle");
  const [saving, setSaving] = useState(false);

  const canStart =
    rtmpUrl.trim() &&
    streamKey.trim() &&
    status !== "live" &&
    status !== "connecting";

  const goLive = async () => {
    if (!camRef.current || !canStart) return;
    setStatus("connecting");
    setSaving(true);
    try {
      // Persist watch URL so spectators see the embed + mark match stream live.
      await api.matches.setStream(matchId, {
        stream_url: watchUrl.trim() || undefined,
        stream_key: undefined,
        stream_status: "live",
      });
      await camRef.current.startStreaming(streamKey.trim(), rtmpUrl.trim());
      // onConnectionSuccess flips status to live
    } catch {
      setStatus("failed");
    } finally {
      setSaving(false);
    }
  };

  const stop = () => {
    camRef.current?.stopStreaming();
    setStatus("ended");
    api.matches.setStream(matchId, { stream_status: "ended" }).catch(() => {});
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t("stream.title") }} />
      <View className="flex-1 px-5 pb-8">
        <Title className="mb-1">{t("stream.title")}</Title>
        <Subtitle className="mb-4">{t("stream.subtitle")}</Subtitle>

        {Cam ? (
          <View className="mb-4 aspect-[9/16] max-h-[45%] self-stretch overflow-hidden rounded-2xl bg-black">
            <Cam
              ref={camRef}
              style={{ flex: 1 }}
              camera="back"
              video={{ bitrate: 2_500_000, fps: 30, resolution: "720p" }}
              audio={{ bitrate: 128_000, isStereo: false }}
              onConnectionSuccess={() => setStatus("live")}
              onConnectionFailed={() => setStatus("failed")}
              onDisconnect={() =>
                setStatus((s) => (s === "live" ? "ended" : s))
              }
              onPermissionsDenied={() => setStatus("failed")}
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
              {t("stream.noNative")}
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
            disabled={!canStart || !Cam}
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
