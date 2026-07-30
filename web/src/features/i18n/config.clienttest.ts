import { describe, expect, it } from "vitest";

import { createLocaleCookie, DEFAULT_LOCALE, resolveAppLocale } from "./config";

describe("i18n config", () => {
  it("resolves supported Chinese locale variants", () => {
    expect(resolveAppLocale("zh-CN")).toBe("zh-CN");
    expect(resolveAppLocale("zh-Hans")).toBe("zh-CN");
    expect(resolveAppLocale("zh")).toBe("zh-CN");
  });

  it("falls back to English for missing or unsupported locales", () => {
    expect(resolveAppLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(resolveAppLocale("de")).toBe(DEFAULT_LOCALE);
  });

  it("creates a persistent same-site locale cookie", () => {
    expect(createLocaleCookie("zh-CN")).toBe(
      "NEXT_LOCALE=zh-CN; Path=/; Max-Age=31536000; SameSite=Lax",
    );
  });
});
