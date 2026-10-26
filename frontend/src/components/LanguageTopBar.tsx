import React from 'react';
import { useLanguage, type SupportedLanguage } from '../i18n/LanguageContext';

export const LanguageTopBar: React.FC = () => {
  const { language, setLanguage, languages, t } = useLanguage();

  return (
    <div style={styles.topBar} data-testid="language-top-bar">
      <div style={styles.leftMeta}>
        <span style={styles.projectPill}>🇪🇺 Erasmus+</span>
        <span style={styles.brandSubtitle}>Engaging Minds Platform</span>
      </div>

      <div style={styles.selectorContainer}>
        <span style={styles.globeIcon} aria-hidden="true">
          🌐
        </span>
        <label htmlFor="global-language-select" style={styles.languageLabel}>
          {t('common.language', 'Language')}:
        </label>
        <select
          id="global-language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
          style={styles.selectInput}
          aria-label={t('common.language', 'Language')}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  topBar: {
    width: '100%',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    padding: '0.4rem 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    borderBottom: '1px solid #1e293b',
    fontSize: '0.82rem',
    zIndex: 100,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  leftMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
  },
  projectPill: {
    backgroundColor: '#1e3a8a',
    color: '#bfdbfe',
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.72rem',
    fontWeight: '700',
    letterSpacing: '0.03em',
  },
  brandSubtitle: {
    color: '#94a3b8',
    fontSize: '0.78rem',
    fontWeight: '500',
  },
  selectorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  globeIcon: {
    fontSize: '1rem',
    lineHeight: 1,
  },
  languageLabel: {
    color: '#cbd5e1',
    fontWeight: '600',
    fontSize: '0.82rem',
  },
  selectInput: {
    backgroundColor: '#1e293b',
    color: '#ffffff',
    border: '1px solid #475569',
    borderRadius: '6px',
    padding: '0.25rem 0.65rem',
    fontSize: '0.82rem',
    fontWeight: '600',
    cursor: 'pointer',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  },
};
