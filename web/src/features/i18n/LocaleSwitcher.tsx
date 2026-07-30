import { Languages } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { APP_LOCALES, type AppLocale } from "./config";
import { useLocaleSwitcher } from "./useLocaleSwitcher";

export function LocaleSwitcher() {
  const t = useTranslations("Language");
  const { locale, changeLocale } = useLocaleSwitcher();

  return (
    <Select
      value={locale}
      onValueChange={(value) => changeLocale(value as AppLocale)}
    >
      <SelectTrigger className="w-40" aria-label={t("label")}>
        <Languages className="h-4 w-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {APP_LOCALES.map((availableLocale) => (
          <SelectItem key={availableLocale} value={availableLocale}>
            {availableLocale === "en" ? t("english") : t("simplifiedChinese")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
