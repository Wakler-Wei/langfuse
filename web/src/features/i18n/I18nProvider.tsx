import { type PropsWithChildren, useEffect } from "react";
import { NextIntlClientProvider } from "next-intl";
import { useRouter } from "next/router";

import { resolveAppLocale } from "./config";
import { messagesByLocale } from "./catalog";

export function I18nProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const locale = resolveAppLocale(router.locale);

  useEffect(() => {
    const previousLocale = document.documentElement.lang;
    document.documentElement.lang = locale;

    return () => {
      document.documentElement.lang = previousLocale;
    };
  }, [locale]);

  return (
    <NextIntlClientProvider
      key={locale}
      locale={locale}
      messages={messagesByLocale[locale]}
      // Fixed UTC keeps next-intl formatters deterministic across SSR and the
      // client (a browser-derived zone would cause hydration mismatches). Date
      // display in the app runs through date-fns / formatLocalIsoDate in local
      // time, so this does not affect user-visible timestamps today. Revisit
      // with a server-known user timezone before adopting next-intl formatters.
      timeZone="UTC"
    >
      {children}
    </NextIntlClientProvider>
  );
}
