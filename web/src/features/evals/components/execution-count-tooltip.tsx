import { type EvalFormType } from "@/src/features/evals/utils/evaluator-form-utils";
import { api } from "@/src/utils/api";
import { compactNumberFormatter } from "@/src/utils/numbers";
import { useEvalTargetCount } from "@/src/features/evals/hooks/useEvalTargetCount";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type ExecutionCountTooltipProps = {
  projectId: string;
  item: string;
  filter: EvalFormType["filter"];
};

export const ExecutionCountTooltip = ({
  projectId,
  item,
  filter,
}: ExecutionCountTooltipProps) => {
  const tAuto = useAutoTranslations();
  const globalConfig = api.evals.globalJobConfigs.useQuery({
    projectId,
  });

  const { isLoading, totalCount, isTraceTarget } = useEvalTargetCount({
    projectId,
    item,
    filter,
    enabled: true,
  });

  return (
    <>
      <span className="text-sm leading-none font-bold peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        (
        {isLoading ? (
          <span className="inline-block font-mono">...</span>
        ) : (
          compactNumberFormatter(
            !globalConfig.data || (totalCount && totalCount < globalConfig.data)
              ? totalCount
              : globalConfig.data,
          )
        )}
        {isTraceTarget
          ? tAuto("traces_b0f4f28")
          : tAuto("dataset_run_items_08d1d3e")}
        )
      </span>
    </>
  );
};
