import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import enTranslations from './locales/en.json';
import daTranslations from './locales/da.json';
import fiTranslations from './locales/fi.json';
import svTranslations from './locales/sv.json';

export type SupportedLanguage = 'en' | 'da' | 'fi' | 'sv';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string; // "English", "Danish", "Finnish", "Swedish"
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'da', label: 'Danish' },
  { code: 'fi', label: 'Finnish' },
  { code: 'sv', label: 'Swedish' },
];

const BUNDLED_TRANSLATIONS: Record<SupportedLanguage, Record<string, any>> = {
  en: enTranslations,
  da: daTranslations,
  fi: fiTranslations,
  sv: svTranslations,
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (
    key: string,
    fallbackOrOptions?: string | Record<string, any>,
    options?: Record<string, any>
  ) => string;
  languages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function resolvePath(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(text: string, options?: Record<string, any>): string {
  if (!options) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
    return options[paramName] !== undefined && options[paramName] !== null
      ? String(options[paramName])
      : match;
  });
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('app_language');
    if (saved && (saved === 'en' || saved === 'da' || saved === 'fi' || saved === 'sv')) {
      return saved as SupportedLanguage;
    }
    // Also check standard 2-letter browser languages
    const browserLang = navigator.language?.substring(0, 2).toLowerCase();
    if (browserLang === 'da' || browserLang === 'fi' || browserLang === 'sv') {
      return browserLang as SupportedLanguage;
    }
    return 'en';
  });

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('app_language', lang);
      document.documentElement.lang = lang;
    } catch {
      // localStorage may be disabled in some environments
    }
  }, []);

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch {
      // ignore
    }
  }, [language]);

  const t = useCallback(
    (
      key: string,
      fallbackOrOptions?: string | Record<string, any>,
      optionsArg?: Record<string, any>
    ): string => {
      let fallback: string | undefined;
      let options: Record<string, any> | undefined;

      if (typeof fallbackOrOptions === 'string') {
        fallback = fallbackOrOptions;
        options = optionsArg;
      } else if (typeof fallbackOrOptions === 'object' && fallbackOrOptions !== null) {
        options = fallbackOrOptions;
        fallback = undefined;
      } else {
        options = optionsArg;
      }

      const activeDict = BUNDLED_TRANSLATIONS[language];
      const enDict = BUNDLED_TRANSLATIONS.en;

      let result: string | undefined;

      // 1. Try resolving in active language
      const resolved = resolvePath(activeDict, key);
      if (resolved !== undefined) {
        result = interpolate(resolved, options);
      } else if (language !== 'en') {
        // 2. Try English
        const enResolved = resolvePath(enDict, key);
        if (enResolved !== undefined) {
          result = interpolate(enResolved, options);
        }
      }

      // Check if result has no unreplaced {{param}} placeholders
      if (result !== undefined && !/\{\{\w+\}\}/.test(result)) {
        return result;
      }

      // 3. Fall back to supplied fallback string if available
      if (fallback !== undefined) {
        const interpolatedFallback = interpolate(fallback, options);
        if (!/\{\{\w+\}\}/.test(interpolatedFallback) || result === undefined) {
          return interpolatedFallback;
        }
      }

      // 4. Return result if found, otherwise key
      return result ?? key;
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      languages: SUPPORTED_LANGUAGES,
    }),
    [language, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
