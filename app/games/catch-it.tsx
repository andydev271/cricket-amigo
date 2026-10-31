import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, Pressable, Text, View } from "react-native";

import { api } from "@/src/lib/api";
import { Button, Screen } from "@/src/ui/primitives";

const ROUND_MS = 30_000;
const MIN_SHOW_MS = 450;
const MAX_SHOW_MS = 1200;

/**
 * Catch It — a ball drops at a random spot; tap it before it disappears.
 * Faster reactions = more chances in 30s. Best score posts to /games/scores.
 */
export default function CatchItScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { width, height } = Dimensions.get("window");
  const fieldW = width - 32;
  const fieldH = Math.min(height - 280, 460);

  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_MS / 1000);
  const [score, setScore] = useState(0);
  const [ball, setBall] = useState<{ x: number; y: number; id: number } | null>(
    null,
  );
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);

  const top = useQuery({
    queryKey: ["scores", "catch_it"],
    queryFn: () => api.games.topScores("catch_it"),
  });

  const post = useMutation({
    mutationFn: (s: number) => api.games.postScore("catch_it", s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scores", "catch_it"] }),
  });

  const clearTimers = () => {
    if (timer.current) clearTimeout(timer.current);
    if (ticker.current) clearInterval(ticker.current);
    timer.current = null;
    ticker.current = null;
  };

  const spawn = () => {
    const size = 56;
    setBall({
      x: Math.random() * (fieldW - size),
      y: Math.random() * (fieldH - size),
      id: Date.now(),
    });
    const show = MIN_SHOW_MS + Math.random() * (MAX_SHOW_MS - MIN_SHOW_MS);
    timer.current = setTimeout(spawn, show);
  };

  const end = () => {
    clearTimers();
    setRunning(false);
    setBall(null);
    setDone(true);
  };

  const start = () => {
    setScore(0);
    setDone(false);
    setRunning(true);
    setTimeLeft(ROUND_MS / 1000);
    spawn();
    ticker.current = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          end();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const tap = () => {
    setScore((s) => s + 1);
    if (timer.current) clearTimeout(timer.current);
    setBall(null);
    timer.current = setTimeout(spawn, 120);
  };

  useEffect(() => {
    if (done && score > 0) post.mutate(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  useEffect(() => clearTimers, []);

  return (
    <Screen>
      <Stack.Screen options={{ title: t("catchIt.title") }} />
      <View className="mb-3 flex-row gap-2 px-4">
        <Text className="rounded-full bg-night-800 px-3 py-1 text-xs text-slate-300">
          ⏱ {timeLeft}s
        </Text>
        <Text className="rounded-full bg-night-800 px-3 py-1 text-xs text-gold-400">
          🎯 {score}
        </Text>
        {top.data?.my_best ? (
          <Text className="rounded-full bg-night-800 px-3 py-1 text-xs text-pitch-400">
            {t("catchIt.best", { score: top.data.my_best })}
          </Text>
        ) : null}
      </View>

      <View
        style={{ height: fieldH, width: fieldW }}
        className="self-center overflow-hidden rounded-2xl border border-night-800 bg-night-900"
      >
        {!running && !done && (
          <View className="flex-1 items-center justify-center gap-3.5 p-6">
            <Text className="text-center text-sm text-slate-400">
              {t("catchIt.how")}
            </Text>
            <Button title={t("catchIt.start")} onPress={start} />
          </View>
        )}
        {done && (
          <View className="flex-1 items-center justify-center gap-3.5 p-6">
            <Text className="text-4xl font-extrabold text-slate-50">
              🧤 {score}
            </Text>
            <Text className="text-sm text-slate-400">
              {post.data?.best === score && score > 0
                ? t("catchIt.newBest")
                : t("catchIt.again")}
            </Text>
            <Button title={t("catchIt.start")} onPress={start} />
          </View>
        )}
        {ball && (
          <Pressable
            onPress={tap}
            style={{ left: ball.x, top: ball.y }}
            className="absolute h-14 w-14 items-center justify-center rounded-full border-[1.5px] border-pitch-400 bg-pitch-950"
          >
            <Text className="text-2xl">🏏</Text>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}
