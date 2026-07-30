/**
 * LogViewToolbar - Controls for log view search and actions.
 *
 * Provides:
 * - Search input for filtering observations (hidden in JSON view)
 * - Action buttons: expand/collapse all, copy JSON, download JSON
 * - Large Trace indicator for virtualized mode
 */

import { memo, useState } from "react";
import {
  FoldVertical,
  UnfoldVertical,
  Copy,
  Download,
  Check,
  IndentIncrease,
  Timer,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Command, CommandInput } from "@/src/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/src/components/ui/hover-card";
import { cn } from "@/src/utils/tailwind";
import Spinner from "@/src/components/design-system/Spinner/Spinner";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export interface LogViewToolbarProps {
  /** Current search query */
  searchQuery: string;
  /** Callback when search query changes */
  onSearchChange: (query: string) => void;
  /** Whether virtualization is active (for large traces) */
  isVirtualized?: boolean;
  /** Total number of observations (shown in Large Trace indicator) */
  observationCount?: number;
  /** Number of observations with loaded I/O data (for cache-only mode) */
  loadedObservationCount?: number;
  /** Callback to toggle expand/collapse all (non-virtualized only) */
  onToggleExpandAll?: () => void;
  /** Whether all rows are expanded */
  allRowsExpanded?: boolean;
  /** Whether copy/download action is currently loading */
  isCopyOrDownloadLoading?: boolean;
  /** Whether copy/download uses cached I/O only (doesn't load all) */
  isCopyOrDownloadCacheOnly?: boolean;
  /** Callback to copy JSON */
  onCopyJson?: () => void;
  /** Callback to download JSON */
  onDownloadJson?: () => void;
  /** Current view type (pretty/json/json-beta) */
  currentView?: "pretty" | "json" | "json-beta";
  /** Whether indent visualization is enabled */
  indentEnabled?: boolean;
  /** Whether indent toggle is disabled (tree too deep) */
  indentDisabled?: boolean;
  /** Callback to toggle indent visualization */
  onToggleIndent?: () => void;
  /** Whether milliseconds are shown in time values */
  showMilliseconds?: boolean;
  /** Callback to toggle milliseconds display */
  onToggleMilliseconds?: () => void;
}

/**
 * Toolbar for log view controls.
 */
export const LogViewToolbar = memo(function LogViewToolbar({
  searchQuery,
  onSearchChange,
  isVirtualized = true,
  observationCount,
  loadedObservationCount,
  onToggleExpandAll,
  allRowsExpanded,
  onCopyJson,
  isCopyOrDownloadLoading = false,
  onDownloadJson,
  isCopyOrDownloadCacheOnly = false,
  currentView = "pretty",
  indentEnabled = false,
  indentDisabled = false,
  onToggleIndent,
  showMilliseconds = false,
  onToggleMilliseconds,
}: LogViewToolbarProps) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyClick = () => {
    if (isCopyOrDownloadLoading) return;

    setIsCopied(true);
    onCopyJson?.();
    setTimeout(() => setIsCopied(false), 1000);
  };

  return (
    <div className="bg-background flex h-9 shrink-0 items-center gap-1.5 border-b px-2">
      {/* Large Trace indicator - only shown for virtualized mode */}
      {isVirtualized && (
        <HoverCard openDelay={200}>
          <HoverCardTrigger asChild>
            <span className="cursor-help rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-bold text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
              {tAuto("large_trace_bf44c17")}{" "}
            </span>
          </HoverCardTrigger>
          <HoverCardContent
            align="start"
            className="w-72 text-sm"
            sideOffset={8}
          >
            <p className="font-bold">
              {tAuto("optimized_for_performance_aaebd17")}
            </p>
            <p className="text-muted-foreground mt-1.5">
              {tAutoI18n("this_trace_has_657e6cf")}{" "}
              {observationCount?.toLocaleString() ?? "many"}{" "}
              {tAutoI18n("observations_to_keep_things_smooth_440111c")}{" "}
            </p>
            <ul className="text-muted-foreground mt-1.5 list-inside list-disc space-y-0.5">
              <li>{tAuto("content_loads_as_you_scroll_e4e32c4")}</li>
              <li>{tAuto("json_view_is_disabled_2996d31")}</li>
              <li>
                {tAuto(
                  "download_copy_includes_i_o_for_cached_observations_o_b437159",
                )}
              </li>
            </ul>
          </HoverCardContent>
        </HoverCard>
      )}

      {/* Search input or spacer (hidden in JSON dump view) */}
      {currentView === "json" ? (
        <div className="flex-1" />
      ) : (
        <Command className="flex-1 rounded-none border-0 bg-transparent">
          <CommandInput
            showBorder={false}
            placeholder={tAuto("search_observations_ddc425a")}
            className="h-7 border-0 focus:ring-0"
            value={searchQuery}
            onValueChange={onSearchChange}
          />
        </Command>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-0.5">
        {/* Indent Toggle - only in table view (pretty or json-beta) */}
        {currentView !== "json" && onToggleIndent && (
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <Button
                variant={indentEnabled ? "default" : "ghost"}
                size="icon"
                className={cn(
                  "h-7 w-7",
                  indentEnabled && "bg-primary text-primary-foreground",
                  indentDisabled && "cursor-not-allowed opacity-50",
                )}
                onClick={indentDisabled ? undefined : onToggleIndent}
                disabled={indentDisabled}
                title={
                  indentDisabled
                    ? undefined
                    : indentEnabled
                      ? tAuto("hide_indentation_2fcdd65")
                      : tAuto("show_indentation_8557694")
                }
              >
                <IndentIncrease className="h-3.5 w-3.5" />
              </Button>
            </HoverCardTrigger>
            {indentDisabled && (
              <HoverCardContent className="w-56 text-sm" sideOffset={8}>
                <p className="font-bold">
                  {tAuto("indentation_unavailable_0f86499")}
                </p>
                <p className="text-muted-foreground mt-1">
                  {tAuto(
                    "disabled_for_deeply_nested_trees_to_maintain_readabi_658098e",
                  )}{" "}
                </p>
              </HoverCardContent>
            )}
          </HoverCard>
        )}

        {/* Milliseconds Toggle - only in table view (pretty or json-beta) */}
        {currentView !== "json" && onToggleMilliseconds && (
          <Button
            variant={showMilliseconds ? "default" : "ghost"}
            size="icon"
            className={cn(
              "h-7 w-7",
              showMilliseconds && "bg-primary text-primary-foreground",
            )}
            onClick={onToggleMilliseconds}
            title={
              showMilliseconds
                ? tAuto("hide_milliseconds_b35f325")
                : tAuto("show_milliseconds_44fcf9b")
            }
          >
            <Timer className="h-3.5 w-3.5" />
          </Button>
        )}

        {/* Expand/Collapse All - show disabled with tooltip when virtualized */}
        {currentView !== "json" && onToggleExpandAll && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7",
                    isVirtualized && "cursor-not-allowed opacity-50",
                  )}
                  onClick={isVirtualized ? undefined : onToggleExpandAll}
                  disabled={isVirtualized}
                >
                  {allRowsExpanded && !isVirtualized ? (
                    <FoldVertical className="h-3.5 w-3.5" />
                  ) : (
                    <UnfoldVertical className="h-3.5 w-3.5" />
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {isVirtualized
                ? tAutoI18n("disabled_for_large_traces_21a31d2")
                : allRowsExpanded
                  ? tAutoI18n("collapse_all_ec89836")
                  : tAutoI18n("expand_all_2af9d49")}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Copy JSON */}
        {onCopyJson && (
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={
                      isCopyOrDownloadLoading ? undefined : handleCopyClick
                    }
                    disabled={isCopyOrDownloadLoading}
                  >
                    {isCopyOrDownloadLoading ? (
                      <Spinner size="xs" />
                    ) : isCopied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isCopyOrDownloadLoading
                    ? tAutoI18n("loading_data_982d2e9")
                    : isCopyOrDownloadCacheOnly
                      ? tAutoI18n("copy_as_json_cache_only_6aa4ef5")
                      : tAutoI18n("copy_as_json_5bc29b2")}
                </TooltipContent>
              </Tooltip>
            </HoverCardTrigger>
            {isCopyOrDownloadCacheOnly && !isCopyOrDownloadLoading && (
              <HoverCardContent className="w-64 text-sm" sideOffset={8}>
                <p className="font-bold">{tAuto("cache_only_mode_0edb31f")}</p>
                <p className="text-muted-foreground mt-1">
                  {tAuto(
                    "for_large_traces_only_expanded_observations_include__f148346",
                  )}{" "}
                </p>
                {loadedObservationCount !== undefined &&
                  observationCount !== undefined && (
                    <p className="text-muted-foreground mt-1.5">
                      <span className="font-bold">
                        {loadedObservationCount} {tAutoI18n("of_de04fa0")}{" "}
                        {observationCount}
                      </span>{" "}
                      {tAutoI18n("observations_loaded_7f8463c")}{" "}
                    </p>
                  )}
              </HoverCardContent>
            )}
          </HoverCard>
        )}

        {/* Download JSON */}
        {onDownloadJson && (
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={
                      isCopyOrDownloadLoading ? undefined : onDownloadJson
                    }
                    disabled={isCopyOrDownloadLoading}
                  >
                    {isCopyOrDownloadLoading ? (
                      <Spinner size="xs" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isCopyOrDownloadLoading
                    ? tAutoI18n("loading_data_982d2e9")
                    : isCopyOrDownloadCacheOnly
                      ? tAutoI18n("download_as_json_cache_only_c6bb089")
                      : tAutoI18n("download_as_json_a1d2758")}
                </TooltipContent>
              </Tooltip>
            </HoverCardTrigger>
            {isCopyOrDownloadCacheOnly && !isCopyOrDownloadLoading && (
              <HoverCardContent className="w-64 text-sm" sideOffset={8}>
                <p className="font-bold">{tAuto("cache_only_mode_0edb31f")}</p>
                <p className="text-muted-foreground mt-1">
                  {tAuto(
                    "for_large_traces_only_expanded_observations_include__f148346",
                  )}{" "}
                </p>
                {loadedObservationCount !== undefined &&
                  observationCount !== undefined && (
                    <p className="text-muted-foreground mt-1.5">
                      <span className="font-bold">
                        {loadedObservationCount} {tAutoI18n("of_de04fa0")}{" "}
                        {observationCount}
                      </span>{" "}
                      {tAutoI18n("observations_loaded_7f8463c")}{" "}
                    </p>
                  )}
              </HoverCardContent>
            )}
          </HoverCard>
        )}
      </div>
    </div>
  );
});
