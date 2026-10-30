import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, EmptyState, Screen } from '@/src/ui/primitives';

export default function LiveScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <EmptyState title={t('live.title')} hint={t('live.emptyHint')} />
      <View className="px-5 pb-6">
        <Button title={t('live.goLive')} onPress={() => router.push('/stream/new')} />
      </View>
    </Screen>
  );
}
