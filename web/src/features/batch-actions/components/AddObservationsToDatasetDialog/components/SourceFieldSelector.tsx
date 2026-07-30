import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import type { SourceField } from "../types";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type SourceFieldSelectorProps = {
  value: SourceField;
  onChange: (field: SourceField) => void;
  disabled?: boolean;
};

export function SourceFieldSelector({
  value,
  onChange,
  disabled = false,
}: SourceFieldSelectorProps) {
  const tAuto = useAutoTranslations();
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as SourceField)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="input">{tAuto("input_b568d47")}</SelectItem>
        <SelectItem value="output">{tAuto("output_4bed336")}</SelectItem>
        <SelectItem value="metadata">{tAuto("metadata_251edc0")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
