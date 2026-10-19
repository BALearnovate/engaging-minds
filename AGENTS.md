# Workspace Development Guidelines
## 1. Internationalization & Localization (i18n)
- **String Management:** Do not hardcode user-facing strings directly in components or views.
- **Translation Files:** Always extract raw strings into the primary localization/translation files before committing changes:
  - Teacher and Student Portal: `frontend/public/locales/en-GB/translation.json`
- **Hook Usage:** Use `useTranslation()` hook and `t('key', 'Fallback String')` pattern consistently across applications and shared UI components.