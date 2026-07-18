import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import es from '../locales/es.json';
import it from '../locales/it.json';
import fr from '../locales/fr.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  it: { translation: it },
  fr: { translation: fr },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['en', 'es', 'it', 'fr'],
    detection: {
      order: ['navigator', 'htmlTag', 'localStorage', 'path'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
