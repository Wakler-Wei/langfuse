/**
 * CopyButton - Copy value to clipboard
 *
 * Appears on hover, copies the JSON value to clipboard.
 * Uses existing clipboard utility from project.
 */

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { type JSONTheme } from "../types";
import { safeStringify } from "../utils/jsonTypes";
import { cn } from "@/src/utils/tailwind";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

interface CopyButtonProps {
  value: unknown;
  theme: JSONTheme;
  className?: string;
}

export function CopyButton({ value, theme, className }: CopyButtonProps) {
  const tAuto = useAutoTranslations();
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const text = safeStringify(value, 2);
      await navigator.clipboard.writeText(text);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const Icon = copied ? Check : Copy;

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center justify-center transition-opacity hover:opacity-100",
        className,
      )}
      style={{
        width: "12px",
        height: "12px",
        color: theme.copyButtonColor,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
        marginLeft: "4px",
        opacity: 0.3,
      }}
      aria-label={
        copied ? tAuto("copied_b7c3ca0") : tAuto("copy_value_4c924dc")
      }
      title={copied ? tAuto("copied_b7c3ca0") : tAuto("copy_value_4c924dc")}
    >
      <Icon size={9} />
    </button>
  );
}
