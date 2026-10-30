import "@/global.css";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";

import { i18n, initI18n } from "@/src/lib/i18n";
import { useAuth } from "@/src/stores/auth";
import { colors } from "@/src/theme";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const appTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.surface,
    primary: colors.primary,
    text: colors.text,
    border: colors.border,
  },
};

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const bootstrap = useAuth((s) => s.bootstrap);

  useEffect(() => {
    (async () => {
      await initI18n();
      await bootstrap(i18n.language);
      setReady(true);
      await SplashScreen.hideAsync();
    })();
  }, [bootstrap]);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={appTheme}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="settings/index" options={{ title: "" }} />
          <Stack.Screen name="friends/index" options={{ title: "" }} />
          <Stack.Screen name="profile/[id]" options={{ title: "" }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
