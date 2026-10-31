import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";

import { api, type CreditTx } from "@/src/lib/api";
import { Button, Card, Screen, Subtitle, Title } from "@/src/ui/primitives";

export default function CreditsScreen() {
  const { t } = useTranslation();
  const [balance, setBalance] = useState<number | null>(null);
  const [txs, setTxs] = useState<CreditTx[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await api.credits.get();
      setBalance(res.balance);
      setTxs(res.recent);
    } catch {
      // offline
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const earn = async (kind: "rewarded_ad" | "daily_bonus") => {
    setBusy(true);
    try {
      const res = await api.credits.earn(kind, `${kind}-${Date.now()}`);
      setBalance(res.balance);
      await refresh();
    } catch {
      // already claimed / offline
    }
    setBusy(false);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t("credits.title") }} />
      <ScrollView contentContainerClassName="px-5 pb-10">
        <Card className="mt-2 items-center py-8">
          <Text className="text-5xl font-bold text-pitch-400">
            {balance ?? "—"}
          </Text>
          <Text className="mt-1 text-sm text-slate-400">
            {t("credits.balance")}
          </Text>
        </Card>

        <Card className="mt-4">
          <Subtitle>{t("credits.earnHint")}</Subtitle>
          <View className="mt-4 gap-3">
            <Button
              title={t("credits.watchAd")}
              onPress={() => earn("rewarded_ad")}
              loading={busy}
            />
            <Button
              title={t("credits.dailyBonus")}
              onPress={() => earn("daily_bonus")}
              loading={busy}
              variant="secondary"
            />
          </View>
        </Card>

        <Text className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-slate-400">
          {t("credits.history")}
        </Text>
        <Card>
          {txs.length === 0 ? (
            <Text className="text-sm text-slate-400">{t("credits.empty")}</Text>
          ) : (
            txs.map((tx) => (
              <View
                key={tx.id}
                className="flex-row items-center justify-between border-b border-slate-700/40 py-3 last:border-0"
              >
                <View>
                  <Text className="font-semibold text-slate-100">
                    {t(`credits.kind.${tx.kind}`, {
                      defaultValue: tx.kind,
                    })}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    {new Date(tx.created_at).toLocaleString()}
                  </Text>
                </View>
                <Text
                  className={`text-base font-bold ${
                    tx.amount > 0 ? "text-pitch-400" : "text-red-400"
                  }`}
                >
                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                </Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}
