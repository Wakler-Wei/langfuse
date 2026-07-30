import { RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { cn } from "@/src/utils/tailwind";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const REFRESH_INTERVALS = [
  { label: null, value: null },
  { label: "30s", value: 30_000 },
  { label: "1m", value: 60_000 },
  { label: "5m", value: 300_000 },
  { label: "15m", value: 900_000 },
] as const;

export type RefreshInterval = (typeof REFRESH_INTERVALS)[number]["value"];

interface DataTableRefreshButtonProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  interval: RefreshInterval;
  setInterval: (interval: RefreshInterval) => void;
  /**
   * Space-tight variant (e.g. the mobile Filters sheet header): the split
   * control drops the "Off" label when auto-refresh is disabled and gains an
   * accent border (plus the interval label, e.g. "30s") once an interval is
   * set. Default (non-compact) is unchanged.
   */
  compact?: boolean;
}

export function DataTableRefreshButton({
  onRefresh,
  isRefreshing,
  interval,
  setInterval,
  compact = false,
}: DataTableRefreshButtonProps) {
  const tAuto = useAutoTranslations();
  const activeInterval = REFRESH_INTERVALS.find((i) => i.value === interval);
  const activeLabel = activeInterval?.label ?? tAuto("off_e3de5ab");
  // Only a real interval counts as active; null ("Off") is the resting state.
  const isActive = interval != null;

  return (
    <div className="flex items-center">
      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={isRefreshing}
        className={cn(
          "rounded-r-none border-r-0",
          compact && isActive && "border-primary",
        )}
        title={tAuto("refresh_56e3bad")}
      >
        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "w-auto rounded-l-none border-l-0 px-2",
              compact && isActive && "border-primary text-primary",
            )}
          >
            <ChevronDown className="h-4 w-4" />
            {compact ? (
              // Drop the "Off" label; surface the interval only when set.
              isActive && <span className="ml-1 text-sm">{activeLabel}</span>
            ) : (
              <span className="ml-1 text-sm">{activeLabel}</span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={String(interval)}
            onValueChange={(value) =>
              setInterval(
                value === "null" ? null : (Number(value) as RefreshInterval),
              )
            }
          >
            {REFRESH_INTERVALS.map((option) => {
              const optionLabel = option.label ?? tAuto("off_e3de5ab");
              return (
                <DropdownMenuRadioItem
                  key={String(option.value)}
                  value={String(option.value)}
                >
                  {option.value === null
                    ? tAuto("auto_refresh_off_58f15a2")
                    : tAuto("every_value0_21cf884", { value0: optionLabel })}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
