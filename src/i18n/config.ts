export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale =
  (process.env.DEFAULT_LOCALE as Locale) || 'zh';

export const localeNames: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
};
