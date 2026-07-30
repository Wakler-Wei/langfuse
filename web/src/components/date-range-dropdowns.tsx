import * as React from "react";
import { addMinutes } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

import {
  dashboardDateRangeAggregationSettings,
  DASHBOARD_AGGREGATION_PLACEHOLDER,
  type DashboardDateRangeOptions,
  DASHBOARD_AGGREGATION_OPTIONS,
  type DashboardDateRange,
  isDashboardDateRangeOptionAvailable,
  getAbbreviatedTimeRange,
  getTimeRangeLabel,
} from "@/src/utils/date-range-utils";
import { useEntitlementLimit } from "@/src/features/entitlements/hooks";
import { useCallback, useMemo } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  HoverCardPortal,
} from "@/src/components/ui/hover-card";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";
import { useTranslations } from "next-intl";

const TIME_RANGE_TRANSLATION_KEYS = {
  last5Minutes: "last5Minutes",
  last30Minutes: "last30Minutes",
  last1Hour: "last1Hour",
  last3Hours: "last3Hours",
  last6Hours: "last6Hours",
  last1Day: "last1Day",
  last3Days: "last3Days",
  last7Days: "last7Days",
  last14Days: "last14Days",
  last30Days: "last30Days",
  last90Days: "last90Days",
  last1Year: "last1Year",
  allTime: "allTime",
  custom: "custom",
} as const;

export function useTimeRangeLabel() {
  const tTimeRanges = useTranslations("TimeRanges");

  return useCallback(
    (option: string) => {
      const key =
        TIME_RANGE_TRANSLATION_KEYS[
          option as keyof typeof TIME_RANGE_TRANSLATION_KEYS
        ];
      return key ? tTimeRanges(key) : getTimeRangeLabel(option);
    },
    [tTimeRanges],
  );
}

type BaseDateRangeDropdownProps<T> = {
  selectedOption: T;
  options: readonly T[];
  limitedOptions?: readonly T[];
  onSelectionChange: (value: T) => void;
};

const BaseDateRangeDropdown = <T extends string>({
  selectedOption,
  options,
  limitedOptions,
  onSelectionChange,
}: BaseDateRangeDropdownProps<T>) => {
  const tAuto = useAutoTranslations();
  const localizedLabel = useTimeRangeLabel();
  return (
    <Select value={selectedOption} onValueChange={onSelectionChange}>
      <SelectTrigger className="hover:bg-accent hover:text-accent-foreground w-fit font-bold focus:ring-0 focus:ring-offset-0">
        <SelectValue placeholder={tAuto("select_8598222")}>
          <div className="flex items-center gap-2">
            <span className="bg-muted w-10 rounded px-1.5 py-0.5 text-center text-xs">
              {getAbbreviatedTimeRange(selectedOption)}
            </span>
            <span>{localizedLabel(selectedOption)}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        position="popper"
        defaultValue={60}
        className="**:data-checkmark:hidden"
      >
        {options.map((item) => {
          const itemObj = (
            <SelectItem
              key={item}
              value={item}
              disabled={limitedOptions?.includes(item)}
              className="pl-2"
            >
              <div className="flex items-center gap-2">
                <span className="bg-muted w-10 rounded px-1.5 py-0.5 text-center text-xs">
                  {getAbbreviatedTimeRange(item)}
                </span>
                <span>{localizedLabel(item)}</span>
              </div>
            </SelectItem>
          );
          const isLimited = limitedOptions?.includes(item);

          return isLimited ? (
            <HoverCard openDelay={200} key={item}>
              <HoverCardTrigger asChild>
                <span>{itemObj}</span>
              </HoverCardTrigger>
              <HoverCardPortal>
                <HoverCardContent className="w-60 text-sm" side="right">
                  {tAuto(
                    "this_time_range_is_not_available_in_your_current_pla_34cb980",
                  )}{" "}
                </HoverCardContent>
              </HoverCardPortal>
            </HoverCard>
          ) : (
            itemObj
          );
        })}
      </SelectContent>
    </Select>
  );
};

type DashboardDateRangeDropdownProps = {
  selectedOption: DashboardDateRangeOptions;
  setDateRangeAndOption: (
    option: DashboardDateRangeOptions,
    date?: DashboardDateRange,
  ) => void;
};

export const DashboardDateRangeDropdown: React.FC<
  DashboardDateRangeDropdownProps
> = ({ selectedOption, setDateRangeAndOption }) => {
  const lookbackLimit = useEntitlementLimit("data-access-days");
  const disabledOptions = useMemo(() => {
    return DASHBOARD_AGGREGATION_OPTIONS.filter(
      (option) =>
        !isDashboardDateRangeOptionAvailable({
          option,
          limitDays: lookbackLimit,
        }),
    );
  }, [lookbackLimit]);

  const onDropDownSelection = (value: DashboardDateRangeOptions) => {
    if (value === DASHBOARD_AGGREGATION_PLACEHOLDER) {
      setDateRangeAndOption(DASHBOARD_AGGREGATION_PLACEHOLDER, undefined);
      return;
    }
    const setting =
      dashboardDateRangeAggregationSettings[
        value as keyof typeof dashboardDateRangeAggregationSettings
      ];
    setDateRangeAndOption(value, {
      from: addMinutes(new Date(), -setting!.minutes!),
      to: new Date(),
    });
  };

  const options =
    selectedOption === DASHBOARD_AGGREGATION_PLACEHOLDER
      ? [...DASHBOARD_AGGREGATION_OPTIONS, DASHBOARD_AGGREGATION_PLACEHOLDER]
      : [...DASHBOARD_AGGREGATION_OPTIONS];
  return (
    <BaseDateRangeDropdown
      selectedOption={selectedOption}
      options={options}
      limitedOptions={disabledOptions}
      onSelectionChange={onDropDownSelection}
    />
  );
};
