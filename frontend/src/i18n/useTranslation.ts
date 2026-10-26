import { useLanguage } from './LanguageContext';

/**
 * Standard translation hook conforming to AGENTS.md rule:
 * `useTranslation()` hook and `t('key', 'Fallback String', options)` pattern.
 */
export function useTranslation() {
  const { t, language, setLanguage, languages } = useLanguage();

  return {
    t,
    language,
    setLanguage,
    languages,
    i18n: {
      language,
      changeLanguage: setLanguage,
    },
  };
}
