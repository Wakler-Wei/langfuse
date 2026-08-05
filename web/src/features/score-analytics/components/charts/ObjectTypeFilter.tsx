/* eslint-disable @repo/no-style-props */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { type ObjectType } from "@/src/features/score-analytics/lib/analytics-url-state";
import {
  type AutoMessageKey,
  useAutoTranslations,
} from "@/src/features/i18n/I18nText";

const OBJECT_TYPE_OPTIONS: Array<{
  value: ObjectType;
  labelKey: AutoMessageKey;
}> = [
  { value: "all", labelKey: "all_objects_c6a6b81" },
  { value: "trace", labelKey: "traces_194e807" },
  { value: "session", labelKey: "sessions_e11e37a" },
  { value: "observation", labelKey: "observations_461ebaa" },
  { value: "dataset_run", labelKey: "dataset_runs_378ebb5" },
];

interface ObjectTypeFilterProps {
  value: ObjectType;
  onChange: (value: ObjectType) => void;
  className?: string;
}

export function ObjectTypeFilter({
  value,
  onChange,
  className,
}: ObjectTypeFilterProps) {
  const tAuto = useAutoTranslations();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={className}
        aria-label={tAuto("object_type_b19ba49")}
      >
        <SelectValue placeholder={tAuto("object_type_b19ba49")} />
      </SelectTrigger>
      <SelectContent>
        {OBJECT_TYPE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {tAuto(option.labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
