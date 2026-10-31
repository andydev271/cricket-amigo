import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { api, type InvitePreview } from "@/src/lib/api";
import { Button, Card, Screen, Subtitle, Title } from "@/src/ui/primitives";

type State =
  | { status: "loading" }
  | { status: "preview"; invite: InvitePreview }
  | { status: "joined"; teamId: number; teamName: string }
  | { status: "error"; message: string };

export default function JoinScreen() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [state, setState] = useState<State>({ status: "loading" });
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    api.invites
      .preview(token)
      .then((invite) => setState({ status: "preview", invite }))
      .catch(() =>
        setState({ status: "error", message: t("join.invalid") }),
      );
  }, [token, t]);

  const accept = async () => {
    setAccepting(true);
    try {
      const res = await api.invites.accept(token);
      setState({ status: "joined", teamId: res.team_id, teamName: res.team });
    } catch (e) {
      setState({ status: "error", message: t("join.failed") });
      console.warn(e);
    }
    setAccepting(false);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t("join.title") }} />
      <View className="flex-1 justify-center px-6 pb-16">
        {state.status === "loading" && (
          <Title className="text-center">{t("common.loading")}</Title>
        )}

        {state.status === "preview" && (
          <Card>
            <Title className="text-center">{state.invite.team.name}</Title>
            <Subtitle className="mt-1 text-center">
              {[
                state.invite.team.city,
                t("teams.members", { count: state.invite.team.member_count }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </Subtitle>
            <Subtitle className="mt-3 text-center">
              {t("join.asRole", { role: t(`teams.role.${state.invite.role}`) })}
            </Subtitle>
            {state.invite.usable ? (
              <Button
                title={t("join.accept")}
                onPress={accept}
                loading={accepting}
                className="mt-5"
              />
            ) : (
              <Text className="mt-5 text-center text-sm text-red-400">
                {t("join.expired")}
              </Text>
            )}
          </Card>
        )}

        {state.status === "joined" && (
          <Card>
            <Text className="text-center text-3xl">🏏</Text>
            <Title className="mt-3 text-center">{t("join.welcome")}</Title>
            <Subtitle className="mt-1 text-center">{state.teamName}</Subtitle>
            <Button
              title={t("join.openTeam")}
              onPress={() => router.replace(`/teams/${state.teamId}`)}
              className="mt-5"
            />
          </Card>
        )}

        {state.status === "error" && (
          <Card>
            <Title className="text-center">{t("join.errorTitle")}</Title>
            <Subtitle className="mt-2 text-center">{state.message}</Subtitle>
          </Card>
        )}
      </View>
    </Screen>
  );
}
