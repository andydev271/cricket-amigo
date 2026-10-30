import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState, Screen } from '@/src/ui/primitives';

export default function NewStreamScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Stack.Screen options={{ title: t('live.goLive') }} />
      <EmptyState title={t('live.goLive')} hint={t('common.comingSoon')} />
    </Screen>
  );
}
