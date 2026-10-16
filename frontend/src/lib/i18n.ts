import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEn from '../shared/locales/en.json';
import commonTa from '../shared/locales/ta.json';
import commonHi from '../shared/locales/hi.json';
import appEn from '../locales/en.json';
import appTa from '../locales/ta.json';
import appHi from '../locales/hi.json';

import { applyScriptFont } from './fonts';

void i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
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
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'bim_lang',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

i18next.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  applyScriptFont(lng);
});

if (i18next.resolvedLanguage) {
  document.documentElement.lang = i18next.resolvedLanguage;
  applyScriptFont(i18next.resolvedLanguage);
}

export default i18next;
