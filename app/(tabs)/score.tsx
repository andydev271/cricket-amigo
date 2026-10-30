import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, EmptyState, Screen } from '@/src/ui/primitives';

export default function ScoreScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <EmptyState title={t('score.title')} hint={t('score.emptyHint')} />
      <View className="px-5 pb-6">
        <Button title={t('score.newMatch')} onPress={() => router.push('/match/new')} />
      </View>
    </Screen>
  );
}
