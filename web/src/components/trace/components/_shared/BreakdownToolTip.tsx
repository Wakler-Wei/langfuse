import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { useState } from "react";
import Decimal from "decimal.js";
import { getMaxDecimals } from "@/src/features/models/utils";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

interface Details {
  [key: string]: number | undefined;
}

/**
 * Aggregates usage or cost details by summing values based on key patterns.
 * Used to calculate input/output/total values from detailed breakdowns.
 */
export const calculateAggregatedUsage = (
  details: Details | Details[],
): {
  input: number;
  output: number;
  total: number;
} => {
  const aggregatedDetails = Array.isArray(details)
    ? details.reduce<Details>((acc, curr) => {
        Object.entries(curr).forEach(([key, value]) => {
          acc[key] = new Decimal(acc[key] || 0)
            .plus(new Decimal(value || 0))
            .toNumber();
        });
        return acc;
      }, {})
    : details;

  // Sum all keys containing "input"
  const input = Object.entries(aggregatedDetails)
    .filter(([key]) => key.includes("input"))
    .reduce(
      (sum, [_, value]) =>
        new Decimal(sum).plus(new Decimal(value ?? 0)).toNumber(),
      0,
    );

  // Sum all keys containing "output"
  const output = Object.entries(aggregatedDetails)
    .filter(([key]) => key.includes("output"))
    .reduce(
      (sum, [_, value]) =>
        new Decimal(sum).plus(new Decimal(value ?? 0)).toNumber(),
      0,
    );

  // Get total or calculate from input + output
  const total = aggregatedDetails.total ?? input + output;

  return { input, output, total };
};

interface BreakdownTooltipProps {
  details: Details | Details[];
  children: React.ReactNode;
  isCost?: boolean;
  pricingTierName?: string;
}

export const BreakdownTooltip = ({
  details,
  children,
  isCost = false,
  pricingTierName,
}: BreakdownTooltipProps) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const [isOpen, setIsOpen] = useState(false);

  // Aggregate details if array is provided
  const aggregatedDetails = Array.isArray(details)
    ? details.reduce<Details>((acc, curr) => {
        Object.entries(curr).forEach(([key, value]) => {
          acc[key] = new Decimal(acc[key] || 0)
            .plus(new Decimal(value || 0))
            .toNumber();
        });
        return acc;
      }, {})
    : details;

  const formatValueWithPadding = (value: number, maxDecimals: number) => {
    return !value
      ? "0"
      : isCost
        ? `$${value.toFixed(maxDecimals)}`
        : value.toLocaleString();
  };

  const maxDecimals = isCost
    ? Math.max(
        ...Object.values(aggregatedDetails).map((v) => getMaxDecimals(v)),
      )
    : 0;

  return (
    <TooltipProvider>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger
          className="flex cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent className="w-64 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-bold">
                {isCost
                  ? tAutoI18n("cost_breakdown_e233f3f")
                  : tAutoI18n("usage_breakdown_8312e8f")}
              </span>
              {Array.isArray(details) && details.length > 0 && (
                <span className="text-muted-foreground text-xs italic">
                  {tAutoI18n("aggregate_across_5060c02")} {details.length}{" "}
                  {details.length === 1
                    ? tAutoI18n("generation_cd738eb")
                    : tAutoI18n("generations_f20cc44")}
                </span>
              )}
              {pricingTierName && (
                <div className="text-muted-foreground flex justify-between text-xs">
                  <span>{tAuto("pricing_tier_83bca84")}</span>
                  <span className="font-mono">{pricingTierName}</span>
                </div>
              )}
            </div>

            {/* Input Section */}
            <Section
              title={
                isCost
                  ? tAuto("input_cost_5545619")
                  : tAuto("input_usage_c17f6a6")
              }
              details={aggregatedDetails}
              filterFn={(key) => key.includes("input")}
              formatValue={(v) => formatValueWithPadding(v, maxDecimals)}
            />

            {/* Output Section */}
            <Section
              title={
                isCost
                  ? tAuto("output_cost_3ca4df8")
                  : tAuto("output_usage_a6cf86c")
              }
              details={aggregatedDetails}
              filterFn={(key) => key.includes("output")}
              formatValue={(v) => formatValueWithPadding(v, maxDecimals)}
            />

            {/* Other Section */}
            <OtherSection
              details={aggregatedDetails}
              isCost={isCost}
              formatValue={(v) => formatValueWithPadding(v, maxDecimals)}
            />

            {/* Total */}
            <div className="flex justify-between border-t border-b-4 border-double py-1">
              <span className="text-xs font-bold">
                {isCost
                  ? tAutoI18n("total_cost_2f69970")
                  : tAutoI18n("total_usage_af341c8")}
              </span>
              <span className="font-mono text-xs font-bold">
                {formatValueWithPadding(
                  aggregatedDetails.total ?? 0,
                  maxDecimals,
                )}
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface SectionProps {
  title: string;
  details: Details;
  filterFn: (key: string) => boolean;
  formatValue: (value: number) => string;
}

const Section = ({ title, details, filterFn, formatValue }: SectionProps) => {
  const filteredEntries = Object.entries(details)
    .filter(([key]) => filterFn(key))
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));

  const sectionTotal = filteredEntries.reduce(
    (sum, [_, value]) =>
      new Decimal(sum).plus(new Decimal(value ?? 0)).toNumber(),
    0,
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between border-b pb-1">
        <span className="text-xs font-bold">{title}</span>
        <span className="text-right font-mono text-xs font-bold">
          {formatValue(sectionTotal)}
        </span>
      </div>
      {filteredEntries.map(([key, value]) => (
        <div
          key={key}
          className="text-muted-foreground flex justify-between text-xs"
        >
          <span className="mr-4">{key}</span>
          <span className="font-mono">{formatValue(value ?? 0)}</span>
        </div>
      ))}
    </div>
  );
};

interface OtherSectionProps {
  details: Details;
  isCost: boolean;
  formatValue: (value: number) => string;
}

const OtherSection = ({ details, isCost, formatValue }: OtherSectionProps) => {
  const tAuto = useAutoTranslations();
  const otherEntries = Object.entries(details)
    .filter(
      ([key]) =>
        !key.includes("input") && !key.includes("output") && key !== "total",
    )
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));

  if (otherEntries.length === 0) return null;

  const otherTotal = otherEntries.reduce((acc, val) => {
    if (typeof val[1] !== "number") return acc;

    return acc + (val[1] ?? 0);
  }, 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between border-b pb-2">
        <span className="text-xs font-bold">
          {isCost ? tAuto("other_cost_e2d62d9") : tAuto("other_usage_f5cb879")}
        </span>
        <span className="text-right font-mono text-xs font-bold">
          {formatValue(otherTotal)}
        </span>
      </div>
      {otherEntries.map(([key, value]) => (
        <div
          key={key}
          className="text-muted-foreground flex justify-between text-xs"
        >
          <span className="mr-4">{key}</span>
          <span className="font-mono">{formatValue(value ?? 0)}</span>
        </div>
      ))}
    </div>
  );
};
