import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import ur from './locales/ur.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', dir: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', dir: 'ltr' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl' }
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

const getSavedLanguage = (): SupportedLanguageCode => {
  try {
    const savedLang = localStorage.getItem('thermaltrace-language');
    if (savedLang && SUPPORTED_LANGUAGES.some((l) => l.code === savedLang)) {
      return savedLang as SupportedLanguageCode;
    }

    const settingsJson = localStorage.getItem('thermaltrace_settings');
    if (settingsJson) {
      const parsed = JSON.parse(settingsJson);
      if (parsed.language && SUPPORTED_LANGUAGES.some((l) => l.code === parsed.language)) {
        return parsed.language as SupportedLanguageCode;
      }
    }
  } catch (e) {
    console.error('Failed to read saved language:', e);
  }
  return 'en';
};

const initialLang = getSavedLanguage();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    ta: { translation: ta },
    te: { translation: te },
    ur: { translation: ur }
  },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  },
  react: {
    useSuspense: false
  }
});

export const updateDocumentLanguageAndDir = (lang: string) => {
  const isUrdu = lang === 'ur';
  document.documentElement.dir = isUrdu ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};

export const changeAppLanguage = (langCode: SupportedLanguageCode) => {
  if (!SUPPORTED_LANGUAGES.some((l) => l.code === langCode)) return;

  i18n.changeLanguage(langCode);
  localStorage.setItem('thermaltrace-language', langCode);

  try {
    const settingsJson = localStorage.getItem('thermaltrace_settings');
    const settings = settingsJson ? JSON.parse(settingsJson) : {};
    settings.language = langCode;
    localStorage.setItem('thermaltrace_settings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to update thermaltrace_settings language:', e);
  }

  updateDocumentLanguageAndDir(langCode);
};

// Set initial document language and direction
updateDocumentLanguageAndDir(initialLang);

export default i18n;
