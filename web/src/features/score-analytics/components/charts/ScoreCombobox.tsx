/* eslint-disable @repo/no-style-props */
import { useMemo } from "react";
import {
  Combobox,
  type ComboboxOptionGroup,
} from "@/src/components/ui/combobox";
import { Button } from "@/src/components/ui/button";
import { X } from "lucide-react";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export interface ScoreOption {
  value: string; // "name-dataType-source"
  name: string;
  dataType: string; // "NUMERIC" | "BOOLEAN" | "CATEGORICAL"
  source: string;
}

interface ScoreComboboxProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  options: ScoreOption[];
  placeholder?: string;
  filterByDataType?: string | string[];
  disabled?: boolean;
  className?: string;
}

export function ScoreCombobox({
  value,
  onChange,
  options,
  placeholder = "Select score",
  filterByDataType,
  disabled = false,
  className,
}: ScoreComboboxProps) {
  const tAuto = useAutoTranslations();
  // 1. Filter options by dataType
  const filteredOptions = useMemo(() => {
    if (!filterByDataType) return options;

    return options.filter((opt) => {
      if (Array.isArray(filterByDataType)) {
        return filterByDataType.includes(opt.dataType);
      }
      return opt.dataType === filterByDataType;
    });
  }, [options, filterByDataType]);

  // 2. Group by dataType
  const groupedOptions: ComboboxOptionGroup<string>[] = useMemo(() => {
    const grouped = filteredOptions.reduce(
      (acc, opt) => {
        if (!acc[opt.dataType]) acc[opt.dataType] = [];
        acc[opt.dataType].push(opt);
        return acc;
      },
      {} as Record<string, ScoreOption[]>,
    );

    const typeLabels: Record<string, string> = {
      BOOLEAN: "Boolean",
      CATEGORICAL: "Categorical",
      NUMERIC: "Numeric",
    };
    const typeOrder = ["BOOLEAN", "CATEGORICAL", "NUMERIC"];

    return typeOrder
      .filter((type) => grouped[type]?.length > 0)
      .map((type) => ({
        heading: typeLabels[type],
        options: grouped[type].map((opt) => ({
          value: opt.value,
          label: tAuto("value0_value1_f00b006", {
            value0: opt.name,
            value1: opt.source,
          }),
        })),
      }));
  }, [filteredOptions, tAuto]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  const handleValueChange = (newValue: string) => {
    onChange(newValue);
  };

  return (
    <div className="flex items-center gap-2">
      <Combobox
        value={value ?? ""}
        onValueChange={handleValueChange}
        options={groupedOptions}
        placeholder={placeholder}
        searchPlaceholder={tAuto("search_scores_003a035")}
        emptyText="No scores found."
        disabled={disabled}
        className={className}
      />

      {value && !disabled && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          title={tAuto("clear_selection_247fd63")}
          className="h-6 w-6 shrink-0"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
