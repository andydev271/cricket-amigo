import { useTranslation } from 'react-i18next';

import { EmptyState, Screen } from '@/src/ui/primitives';

export default function LibraryScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <EmptyState title={t('library.emptyTitle')} hint={t('library.emptyHint')} />
    </Screen>
  );
}
