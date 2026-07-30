import { Button } from "@/src/components/ui/button";
import { Combobox } from "@/src/components/ui/combobox";
import { X } from "lucide-react";
import { useExperimentNames } from "@/src/features/experiments/hooks/useExperimentNames";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type ExperimentBaselineControlsProps = {
  projectId: string;
  baselineId?: string;
  baselineName?: string;
  onBaselineChange: (id: string) => void;
  onBaselineClear: () => void;
  canClearBaseline?: boolean;
};

export function ExperimentBaselineControls({
  projectId,
  baselineId,
  baselineName,
  onBaselineChange,
  onBaselineClear,
  canClearBaseline = true,
}: ExperimentBaselineControlsProps) {
  const tAuto = useAutoTranslations();
  const { experimentNames, isLoading } = useExperimentNames({
    projectId,
  });
  const baselineOptions = experimentNames.map((exp) => ({
    value: exp.experimentId,
    label: exp.experimentName,
  }));

  return (
    <div className="flex items-center gap-2">
      <div className="w-full">
        <Combobox
          options={baselineOptions}
          value={baselineId}
          onValueChange={onBaselineChange}
          placeholder={
            baselineName ?? baselineId ?? tAuto("select_baseline_32ed427")
          }
          emptyText="No experiments found"
          searchPlaceholder={tAuto("search_experiments_437f238")}
          disabled={isLoading}
          className="h-9"
        />
      </div>

      {baselineId && canClearBaseline && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBaselineClear}
          disabled={isLoading}
          title={tAuto("clear_baseline_31a196e")}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
