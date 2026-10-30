import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState, Screen } from '@/src/ui/primitives';

export default function NewMatchScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Stack.Screen options={{ title: t('score.newMatch') }} />
      <EmptyState title={t('score.newMatch')} hint={t('common.comingSoon')} />
    </Screen>
  );
}
