import { useCallback } from "react";
import { useTranslations } from "next-intl";

import autoEnMessages from "./messages/auto.en.json";

export type AutoMessageKey = keyof typeof autoEnMessages;
type AutoMessageValues = Record<string, string | number | Date>;

const AUTO_KEY_BY_ENGLISH = new Map<string, AutoMessageKey>(
  Object.entries(autoEnMessages).map(([key, value]) => [
    value,
    key as AutoMessageKey,
  ]),
);

export function useAutoTranslations() {
  return useTranslations("Auto");
}

export function useAutoText() {
  const t = useAutoTranslations();

  return useCallback(
    (englishText: string) => {
      const key = AUTO_KEY_BY_ENGLISH.get(englishText);
      return key ? t(key) : englishText;
    },
    [t],
  );
}

export type AutoTranslator = ReturnType<typeof useAutoTranslations>;

export function I18nText({
  id,
  values,
}: {
  id: AutoMessageKey;
  values?: AutoMessageValues;
}) {
  const t = useAutoTranslations();

  return t(id, values);
}
