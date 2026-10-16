import { useCallback } from 'react';

/**
 * Lightweight translation hook conforming to AGENTS.md rule:
 * `useTranslation()` hook and `t('key', 'Fallback String')` pattern.
 */
export function useTranslation() {
  const t = useCallback((key: string, fallback?: string): string => {
    // Return fallback if provided, otherwise the key itself
    return fallback !== undefined ? fallback : key;
  }, []);

  return { t };
}
