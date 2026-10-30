import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import * as SecureStore from 'expo-secure-store';

import en from '@/src/i18n/en.json';
import ptBR from '@/src/i18n/pt-BR.json';

const LOCALE_KEY = 'app.locale';

export const SUPPORTED_LOCALES = ['en', 'pt-BR'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

function detectLocale(): AppLocale {
  const device = getLocales()[0]?.languageTag ?? 'en';
  if (device.toLowerCase().startsWith('pt')) return 'pt-BR';
  return 'en';
}

export async function initI18n(): Promise<void> {
  let locale: AppLocale = detectLocale();
  try {
    const saved = await SecureStore.getItemAsync(LOCALE_KEY);
    if (saved && (SUPPORTED_LOCALES as readonly string[]).includes(saved)) {
      locale = saved as AppLocale;
    }
  } catch {
    // secure store unavailable (web) — use detected locale
  }

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      'pt-BR': { translation: ptBR },
    },
    lng: locale,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });
}

export async function setLocale(locale: AppLocale): Promise<void> {
  await i18n.changeLanguage(locale);
  try {
    await SecureStore.setItemAsync(LOCALE_KEY, locale);
  } catch {
    // ignore persistence failures
  }
}

export { i18n };
