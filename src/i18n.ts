import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { detectLanguage } from './utils/languageDetection';
import enTranslations from './locales/en.json';
import deTranslations from './locales/de.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  de: {
    translation: deTranslations,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectLanguage(), // Automatically detect language
    fallbackLng: 'en', // Fallback to English if detection fails
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    // Enable debug mode in development
    debug: import.meta.env.DEV,
    
    // Configure keySeparator and nsSeparator
    keySeparator: '.',
    nsSeparator: false,
    
    // Prevent translation of unknown keys (user input like names)
    returnEmptyString: false,
    returnNull: false,
    returnObjects: false,
    
    // Only translate explicit translation keys, not arbitrary strings
    parseMissingKeyHandler: (key: string) => key,
    
    // Disable suspicious translation attempts
    missingKeyHandler: false,
    saveMissing: false,
  });

export default i18n;