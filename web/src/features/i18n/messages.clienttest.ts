import { describe, expect, it } from "vitest";

import enMessages from "./messages/en.json";
import zhCNMessages from "./messages/zh-CN.json";
import autoEnMessages from "./messages/auto.en.json";
import autoZhCNMessages from "./messages/auto.zh-CN.json";

function getMessageKeys(value: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === "object" && child !== null
      ? getMessageKeys(child as Record<string, unknown>, path)
      : [path];
  });
}

describe("translation catalogs", () => {
  it("keeps Simplified Chinese keys in sync with English", () => {
    expect(getMessageKeys(zhCNMessages).sort()).toEqual(
      getMessageKeys(enMessages).sort(),
    );
  });

  it("keeps extracted static UI messages in sync", () => {
    expect(getMessageKeys(autoZhCNMessages).sort()).toEqual(
      getMessageKeys(autoEnMessages).sort(),
    );
  });
});
