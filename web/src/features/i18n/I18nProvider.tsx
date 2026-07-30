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
      timeZone="UTC"
    >
      {children}
    </NextIntlClientProvider>
  );
}
