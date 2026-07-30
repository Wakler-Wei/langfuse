import { useRouter } from "next/router";

import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { createLocaleCookie, resolveAppLocale, type AppLocale } from "./config";

export function useLocaleSwitcher() {
  const router = useRouter();
  const capture = usePostHogClientCapture();
  const locale = resolveAppLocale(router.locale);

  const changeLocale = async (nextLocale: AppLocale) => {
    if (nextLocale === locale) return;

    document.cookie = createLocaleCookie(nextLocale);
    document.documentElement.lang = nextLocale;
    capture("user_settings:language_changed", {
      fromLocale: locale,
      toLocale: nextLocale,
    });

    await router.push(router.asPath, undefined, { locale: nextLocale });
  };

  return { locale, changeLocale };
}
