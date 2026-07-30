import type { AppLocale } from "./config";
import autoEnMessages from "./messages/auto.en.json";
import autoZhCNMessages from "./messages/auto.zh-CN.json";
import enMessages from "./messages/en.json";
import zhCNMessages from "./messages/zh-CN.json";

export const enCatalog = {
  ...enMessages,
  Auto: autoEnMessages,
};

export type AppMessages = typeof enCatalog;

export const messagesByLocale = {
  en: enCatalog,
  "zh-CN": {
    ...zhCNMessages,
    Auto: autoZhCNMessages,
  },
} satisfies Record<AppLocale, AppMessages>;
