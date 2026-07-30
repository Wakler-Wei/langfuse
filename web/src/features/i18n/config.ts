export const APP_LOCALES = ["en", "zh-CN"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export function resolveAppLocale(locale: string | undefined): AppLocale {
  if (locale === "zh" || locale === "zh-Hans" || locale === "zh-CN") {
    return "zh-CN";
  }

  return DEFAULT_LOCALE;
}

export function createLocaleCookie(locale: AppLocale): string {
  const oneYearInSeconds = 60 * 60 * 24 * 365;
  return `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=${oneYearInSeconds}; SameSite=Lax`;
}
