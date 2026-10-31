import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import { api } from "@/src/lib/api";
import { Button, EmptyState, Screen } from "@/src/ui/primitives";

interface Q {
  id: number;
  question: string;
  options: string[];
  difficulty: string;
}

export default function TriviaScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [reveal, setReveal] = useState<{
    correct: boolean;
    answer_index: number;
  } | null>(null);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  const data = useQuery({ queryKey: ["trivia"], queryFn: api.games.trivia });
  const questions = (data.data?.questions ?? []) as Q[];

  const answer = useMutation({
    mutationFn: (args: { qid: number; choice: number }) =>
      api.games.answerTrivia(args.qid, args.choice),
    onSuccess: (res) => {
      if (res.already_answered || res.correct === null) {
        next();
        return;
      }
      setReveal({ correct: res.correct, answer_index: res.answer_index ?? -1 });
      setScore(res.score);
      if (res.finished) setFinished(true);
    },
  });

  const next = () => {
    setPicked(null);
    setReveal(null);
    setIdx((i) => i + 1);
  };

  if (data.isLoading) return <Screen />;
  if (data.error || questions.length === 0)
    return (
      <Screen>
        <EmptyState title={t("trivia.title")} hint={t("trivia.empty")} />
      </Screen>
    );

  const q = questions[idx];
  const done = finished || idx >= questions.length;

  return (
    <Screen>
      <Stack.Screen options={{ title: t("trivia.title") }} />
      {done ? (
        <View className="mt-10 items-center gap-3 px-5">
          <Text className="text-5xl">🎉</Text>
          <Text className="text-xl font-bold text-slate-50">
            {t("trivia.result", { score, total: questions.length })}
          </Text>
          <Text className="text-center text-sm text-slate-400">
            {t("trivia.creditsNote")}
          </Text>
          <Button
            title={t("common.done")}
            onPress={() => {
              qc.invalidateQueries({ queryKey: ["trivia"] });
              qc.invalidateQueries({ queryKey: ["credits"] });
            }}
          />
        </View>
      ) : (
        <ScrollView contentContainerClassName="px-5 pb-10">
          <View className="mb-3 flex-row gap-2">
            <Text className="rounded-full bg-night-800 px-3 py-1 text-xs text-slate-400">
              {idx + 1}/{questions.length}
            </Text>
            <Text className="rounded-full bg-night-800 px-3 py-1 text-xs capitalize text-gold-400">
              {q.difficulty}
            </Text>
          </View>
          <Text className="mb-4 text-lg font-bold leading-6 text-slate-50">
            {q.question}
          </Text>
          <View className="gap-2.5">
            {q.options.map((opt, i) => {
              const isPicked = picked === i;
              const isRight = reveal && i === reveal.answer_index;
              const isWrongPick = reveal && isPicked && !reveal.correct;
              return (
                <Pressable
                  key={i}
                  disabled={!!reveal || answer.isPending}
                  onPress={() => {
                    setPicked(i);
                    answer.mutate({ qid: q.id, choice: i });
                  }}
                  className={`flex-row items-center justify-between rounded-xl border p-3.5 ${
                    isRight
                      ? "border-pitch-500 bg-pitch-950"
                      : isWrongPick
                        ? "border-red-500"
                        : isPicked
                          ? "border-pitch-400"
                          : "border-night-800 bg-night-900"
                  }`}
                >
                  <Text
                    className={`text-[15px] ${isRight || isWrongPick ? "font-bold text-slate-100" : "text-slate-300"}`}
                  >
                    {opt}
                  </Text>
                  {isRight ? <Text className="text-pitch-400">✓</Text> : null}
                  {isWrongPick ? <Text className="text-red-400">✗</Text> : null}
                </Pressable>
              );
            })}
          </View>
          {reveal && (
            <Button title={t("trivia.next")} onPress={next} className="mt-4" />
          )}
        </ScrollView>
      )}
    </Screen>
  );
}
