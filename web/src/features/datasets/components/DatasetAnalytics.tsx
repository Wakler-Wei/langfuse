import { DropdownMenuItem } from "@/src/components/ui/dropdown-menu";
import { RESOURCE_METRICS } from "@/src/features/dashboard/lib/score-analytics-utils";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { MultiSelectKeyValues } from "@/src/features/scores/components/multi-select-key-values";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function DatasetAnalytics(props: {
  scoreOptions: { key: string; value: string }[];
  selectedMetrics: string[];
  setSelectedMetrics: (metrics: string[]) => void;
}) {
  const tAuto = useAutoTranslations();
  const capture = usePostHogClientCapture();
  return (
    <MultiSelectKeyValues
      className="max-w-fit focus:ring-0! focus:ring-offset-0!"
      placeholder={tAuto("search_6d7a30a")}
      title={tAuto("charts_8610e3e")}
      variant="outline"
      hideClearButton
      showSelectedValueStrings={false}
      onValueChange={(values, changedValue, selectedKeys) => {
        if (values.length === 0) props.setSelectedMetrics([]);

        if (changedValue) {
          if (selectedKeys?.has(changedValue)) {
            props.setSelectedMetrics([...props.selectedMetrics, changedValue]);
            capture("dataset_run:charts_view_added");
          } else {
            capture("dataset_run:charts_view_removed");
            props.setSelectedMetrics(
              props.selectedMetrics.filter((key) => key !== changedValue),
            );
          }
        }
      }}
      values={props.selectedMetrics}
      options={RESOURCE_METRICS}
      groupedOptions={[
        { label: tAuto("scores_126cb93"), options: props.scoreOptions },
      ]}
      controlButtons={
        <DropdownMenuItem
          onSelect={() => {
            props.setSelectedMetrics([]);
          }}
        >
          {tAuto("hide_all_charts_7805550")}{" "}
        </DropdownMenuItem>
      }
    />
  );
}
