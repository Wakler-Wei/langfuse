"use client";

import { InAppAgentToolPayload } from "./InAppAgentToolPayload";
import type { InAppAgentToolCallContent } from "./utils/utils";
import { I18nText } from "@/src/features/i18n/I18nText";

const TOOL_CALL_RESULT_PRESENTATION = {
  running: { label: <I18nText id="result_5faa59d" />, variant: "default" },
  succeeded: { label: <I18nText id="result_5faa59d" />, variant: "default" },
  failed: { label: <I18nText id="error_7f2f6a1" />, variant: "failed" },
  denied: { label: <I18nText id="denied_63b16bd" />, variant: "denied" },
} as const satisfies Record<
  InAppAgentToolCallContent["status"],
  {
    label: React.ReactNode;
    variant: "default" | "failed" | "denied";
  }
>;

export function InAppAgentToolResultPayload({
  tool,
}: {
  tool: InAppAgentToolCallContent;
}) {
  if (tool.result === undefined && tool.error === undefined) {
    return null;
  }

  const presentation = TOOL_CALL_RESULT_PRESENTATION[tool.status];

  return (
    <InAppAgentToolPayload
      label={presentation.label}
      value={tool.error ?? tool.result ?? ""}
      variant={presentation.variant}
    />
  );
}
