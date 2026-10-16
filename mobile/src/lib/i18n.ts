import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Preferences } from '@capacitor/preferences';

import commonEn from '../shared/locales/en.json';
import commonTa from '../shared/locales/ta.json';
import commonHi from '../shared/locales/hi.json';
import appEn from '../locales/en.json';
import appTa from '../locales/ta.json';
import appHi from '../locales/hi.json';

import { applyScriptFont } from './fonts';

const LANG_KEY = 'bim_lang';

/** Async detector backed by Capacitor Preferences (native UserDefaults/SharedPreferences, not Keychain — language isn't sensitive). */
const capacitorPreferencesDetector = {
  name: 'capacitorPreferences',
  type: 'languageDetector' as const,
  async: true,
  init: () => {},
  detect: async (callback: (lng: string | undefined) => void) => {
    const { value } = await Preferences.get({ key: LANG_KEY });
    callback(value ?? undefined);
  },
  cacheUserLanguage: async (lng: string) => {
    await Preferences.set({ key: LANG_KEY, value: lng });
  },
};

export async function initI18n(): Promise<void> {
  const { value: storedLang } = await Preferences.get({ key: LANG_KEY });

  await i18next
    .use(initReactI18next)
    .init({
      lng: storedLang ?? undefined,
      resources: {
        en: { common: commonEn, app: appEn },
        ta: { common: commonTa, app: appTa },
        hi: { common: commonHi, app: appHi },
      },
      ns: ['common', 'app'],
      defaultNS: 'app',
      fallbackNS: 'common',
      fallbackLng: 'en',
      supportedLngs: ['en', 'ta', 'hi'],
      load: 'languageOnly',
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });

  i18next.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
    applyScriptFont(lng);
    void capacitorPreferencesDetector.cacheUserLanguage(lng);
  });

  if (i18next.resolvedLanguage) {
    document.documentElement.lang = i18next.resolvedLanguage;
    applyScriptFont(i18next.resolvedLanguage);
  }
}

export default i18next;
