import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useTranslation } from "react-i18next";

import { colors } from "@/src/theme";

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.train"),
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "figure.cricket",
                android: "sports_cricket",
                web: "sports_cricket",
              }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: t("tabs.library"),
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "play.rectangle.on.rectangle",
                android: "video_library",
                web: "video_library",
              }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="score"
        options={{
          title: t("tabs.score"),
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "list.clipboard",
                android: "scoreboard",
                web: "scoreboard",
              }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: t("tabs.live"),
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "dot.radiowaves.left.and.right",
                android: "live_tv",
                web: "live_tv",
              }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          title: t("tabs.play"),
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "gamecontroller",
                android: "sports_esports",
                web: "sports_esports",
              }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
    </Tabs>
  );
}
