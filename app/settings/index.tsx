import { router, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import Constants from "expo-constants";

import { api } from "@/src/lib/api";
import { AppLocale, setLocale, SUPPORTED_LOCALES } from "@/src/lib/i18n";
import { useAuth } from "@/src/stores/auth";
import { Card, Screen } from "@/src/ui/primitives";

const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  "pt-BR": "Português (Brasil)",
};

function Row({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center justify-between border-b border-slate-700/40 px-1 py-4 last:border-0"
    >
      <Text className="text-base text-slate-100">{label}</Text>
      {value ? <Text className="text-base text-slate-400">{value}</Text> : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { user, status, logout, setUser } = useAuth();

  const changeLocale = async (l: AppLocale) => {
    await setLocale(l);
    try {
      const updated = await api.me.updateLocale(l);
      setUser(updated);
    } catch {
      // guest or offline — locale saved locally
    }
  };

  const confirmLogout = () =>
    Alert.alert(t("auth.logout"), undefined, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("auth.logout"),
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/welcome");
        },
      },
    ]);

  return (
    <Screen>
      <Stack.Screen options={{ title: t("settings.title") }} />
      <ScrollView contentContainerClassName="gap-5 px-5 pb-10">
        <Card>
          <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            {t("settings.language")}
          </Text>
          <View className="flex-row gap-3">
            {SUPPORTED_LOCALES.map((l) => (
              <Pressable
                key={l}
                onPress={() => changeLocale(l)}
                className={`flex-1 rounded-xl border px-3 py-3 ${
                  i18n.language === l
                    ? "border-pitch-500 bg-pitch-900/60"
                    : "border-slate-600/40 bg-night-800"
                }`}
              >
                <Text className="text-center text-sm font-semibold text-slate-100">
                  {LOCALE_LABELS[l]}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card>
          <Row
            label={t("profile.editProfile")}
            onPress={() => router.push(`/profile/${user?.id ?? "me"}`)}
          />
          <Row
            label={t("friends.title")}
            onPress={() => router.push("/friends")}
          />
          <Row label={t("teams.title")} onPress={() => router.push("/teams")} />
          <Row
            label={t("profile.credits")}
            value={`${user?.credits ?? 0}`}
            onPress={() => router.push("/credits")}
          />
        </Card>

        <Card>
          <Row label={t("settings.privacy")} />
          <Row
            label={t("settings.version")}
            value={Constants.expoConfig?.version ?? ""}
          />
        </Card>

        {status === "authenticated" ? (
          <Pressable onPress={confirmLogout} className="items-center py-3">
            <Text className="text-base font-semibold text-red-400">
              {t("auth.logout")}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push("/(auth)/welcome")}
            className="items-center py-3"
          >
            <Text className="text-base font-semibold text-pitch-400">
              {t("auth.login")} / {t("auth.register")}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </Screen>
  );
}
