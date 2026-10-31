import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { useAdPolicy } from "./policy";

/**
 * Policy-aware banner slot. Renders nothing when ads are disabled or
 * free_mode is on. Until an AdMob account exists this renders a slim
 * sponsor card so slots are already laid out and policy-tested; swapping
 * the card for <BannerAd> is a one-line change + SDK install.
 */
export function AdBanner({
  position = "bottom",
}: {
  position?: "top" | "bottom";
}) {
  const { t } = useTranslation();
  const policy = useAdPolicy();

  if (!policy.enabled) return null;
  if (position === "top" && !policy.bannerTop) return null;
  if (position === "bottom" && !policy.bannerBottom) return null;

  return (
    <View className="min-h-[50px] items-center justify-center border-t border-night-800 px-4 py-2">
      <Text className="text-[10px] uppercase tracking-widest text-slate-500">
        {t("ads.sponsored")}
      </Text>
      <Text className="mt-0.5 text-xs text-slate-400">
        {t("ads.bannerMessage")}
      </Text>
    </View>
  );
}
