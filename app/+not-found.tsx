import { Link, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center bg-[#052e16] px-5">
        <Text className="text-xl font-bold text-slate-50">404</Text>
        <Link href="/" className="mt-4 py-3">
          <Text className="text-base text-pitch-400">{t("common.back")}</Text>
        </Link>
      </View>
    </>
  );
}
