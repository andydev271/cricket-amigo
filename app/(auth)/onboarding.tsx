import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { api } from '@/src/lib/api';
import { AppLocale, setLocale, SUPPORTED_LOCALES } from '@/src/lib/i18n';
import { useAuth } from '@/src/stores/auth';
import { Button, Screen, Subtitle, Title } from '@/src/ui/primitives';

const LOCALE_LABELS: Record<AppLocale, string> = {
  en: 'English',
  'pt-BR': 'Português (Brasil)',
};

const INTERESTS = ['batting', 'bowling', 'fielding', 'keeping'] as const;
const ROLES = ['player', 'coach', 'scorer', 'fan'] as const;

export default function OnboardingScreen() {
  const { t, i18n } = useTranslation();
  const setUser = useAuth((s) => s.setUser);
  const [step, setStep] = useState(0);
  const [locale, setLocaleState] = useState<AppLocale>(
    (SUPPORTED_LOCALES as readonly string[]).includes(i18n.language)
      ? (i18n.language as AppLocale)
      : 'en',
  );
  const [interests, setInterests] = useState<string[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleInterest = (key: string) =>
    setInterests((prev) =>
      prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key],
    );

  const finish = async () => {
    setSaving(true);
    try {
      const user = await api.me.update({ roles: role ? [role] : [], interests });
      setUser(user);
    } catch {
      // guest/offline — continue anyway
    }
    setSaving(false);
    router.replace('/(tabs)');
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="flex-1 justify-center px-6 pb-10">
        {step === 0 && (
          <View>
            <Title>{t('onboarding.languageTitle')}</Title>
            <View className="mt-6 gap-3">
              {SUPPORTED_LOCALES.map((l) => (
                <Pressable
                  key={l}
                  onPress={() => {
                    setLocaleState(l);
                    setLocale(l);
                  }}
                  className={`rounded-2xl border px-5 py-4 ${
                    locale === l ? 'border-pitch-500 bg-pitch-900/60' : 'border-slate-600/40 bg-night-800'
                  }`}
                >
                  <Text className="text-base font-semibold text-slate-50">{LOCALE_LABELS[l]}</Text>
                </Pressable>
              ))}
            </View>
            <Button title={t('common.continue')} onPress={() => setStep(1)} className="mt-8" />
          </View>
        )}

        {step === 1 && (
          <View>
            <Title>{t('onboarding.interestsTitle')}</Title>
            <View className="mt-6 flex-row flex-wrap gap-3">
              {INTERESTS.map((key) => {
                const active = interests.includes(key);
                return (
                  <Pressable
                    key={key}
                    onPress={() => toggleInterest(key)}
                    className={`rounded-2xl border px-5 py-4 ${
                      active ? 'border-pitch-500 bg-pitch-900/60' : 'border-slate-600/40 bg-night-800'
                    }`}
                  >
                    <Text className="text-base font-semibold text-slate-50">{t(`train.${key}`)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Button title={t('common.continue')} onPress={() => setStep(2)} className="mt-8" />
            <Button title={t('common.skip')} variant="ghost" onPress={() => setStep(2)} />
          </View>
        )}

        {step === 2 && (
          <View>
            <Title>{t('onboarding.roleTitle')}</Title>
            <View className="mt-6 gap-3">
              {ROLES.map((key) => (
                <Pressable
                  key={key}
                  onPress={() => setRole(key)}
                  className={`rounded-2xl border px-5 py-4 ${
                    role === key ? 'border-pitch-500 bg-pitch-900/60' : 'border-slate-600/40 bg-night-800'
                  }`}
                >
                  <Text className="text-base font-semibold text-slate-50">{t(`onboarding.${key}`)}</Text>
                </Pressable>
              ))}
            </View>
            <Button title={t('common.done')} onPress={finish} loading={saving} className="mt-8" />
          </View>
        )}

        <Subtitle className="mt-6 text-center">{`${step + 1} / 3`}</Subtitle>
      </ScrollView>
    </Screen>
  );
}
