import { useTranslation } from 'react-i18next';

import { EmptyState, Screen } from '@/src/ui/primitives';

export default function PlayScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <EmptyState title={t('play.title')} hint={t('play.emptyHint')} />
    </Screen>
  );
}
