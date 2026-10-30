import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState, Screen } from '@/src/ui/primitives';

export default function RecordScreen() {
  const { t } = useTranslation();
  const { discipline } = useLocalSearchParams<{ discipline: string }>();

  return (
    <Screen>
      <Stack.Screen options={{ title: t(`train.${discipline}`) }} />
      <EmptyState
        title={t(`train.${discipline}`)}
        hint={t('common.comingSoon')}
        icon={<></>}
      />
    </Screen>
  );
}
