"use client";

import {
  ChevronDown,
  ChevronUp,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/utils/tailwind";

import { useMessageSearch } from "./context";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function MessageSearchToolbar({ className }: { className?: string }) {
  const tAuto = useAutoTranslations();
  const {
    isOpen,
    openRequestCount,
    queryInput,
    matches,
    activeMatchIndex,
    openSearch,
    closeSearch,
    setQueryInput,
    blurQueryInput,
    nextMatch,
    previousMatch,
  } = useMessageSearch();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isOpen, openRequestCount]);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn("h-8 gap-2", className)}
        onClick={openSearch}
        aria-label={tAuto("find_in_messages_e138cb2")}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">{tAuto("find_df251b0")}</span>
      </Button>
    );
  }

  const activeCountText =
    matches.length === 0 || activeMatchIndex < 0
      ? "0 / 0"
      : `${activeMatchIndex + 1} / ${matches.length}`;

  return (
    <div
      className={cn(
        "bg-background flex items-center gap-1 rounded-md border p-1",
        className,
      )}
    >
      <Search className="text-muted-foreground ml-1 h-3.5 w-3.5 shrink-0" />
      <Input
        ref={inputRef}
        value={queryInput}
        onChange={(event) => setQueryInput(event.target.value)}
        onBlur={blurQueryInput}
        placeholder={tAuto("find_in_messages_e138cb2")}
        className="h-6 min-w-40 border-0 px-1 text-xs shadow-none focus-visible:ring-0 sm:min-w-56"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (event.shiftKey) {
              previousMatch();
            } else {
              nextMatch();
            }
          }

          if (event.key === "Escape") {
            event.preventDefault();
            if (queryInput) {
              setQueryInput("");
            } else {
              closeSearch();
            }
          }
        }}
      />
      <div className="text-muted-foreground min-w-16 px-1 text-right text-xs">
        {activeCountText}
      </div>
      <IconButton
        icon={ChevronUp}
        label={tAuto("previous_result_1e1f77c")}
        onClick={previousMatch}
        disabled={matches.length === 0}
      />
      <IconButton
        icon={ChevronDown}
        label={tAuto("next_result_d2f0cc5")}
        onClick={nextMatch}
        disabled={matches.length === 0}
      />
      <IconButton
        icon={X}
        label={tAuto("close_search_0906f92")}
        onClick={closeSearch}
      />
    </div>
  );
}

function IconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );
}
