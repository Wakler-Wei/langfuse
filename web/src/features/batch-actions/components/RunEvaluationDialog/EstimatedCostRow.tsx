import { InfoIcon } from "lucide-react";
import { api } from "@/src/utils/api";
import { usdFormatter } from "@/src/utils/numbers";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type EstimatedCostRowProps = {
  projectId: string;
  evaluators: Array<{ id: string; name: string }>;
  observationCount: number;
};

function formatCostEstimate(cost: number): string {
  if (cost > 0 && cost < 0.005) return "< $0.01";
  return `~${usdFormatter(cost, 2, 2)}`;
}

export function EstimatedCostRow(props: EstimatedCostRowProps) {
  const tAuto = useAutoTranslations();
  const { projectId, evaluators, observationCount } = props;

  const evaluatorIds = evaluators.map((e) => e.id);

  const avgCostQuery = api.evals.avgCostByEvaluatorIds.useQuery(
    { projectId, evaluatorIds },
    { enabled: evaluators.length > 0 },
  );

  if (avgCostQuery.isLoading) {
    return (
      <div className="flex gap-2">
        <span className="text-muted-foreground shrink-0">
          {tAuto("est_llm_api_key_cost_7e31e7e")}{" "}
        </span>
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }

  const data = avgCostQuery.data;
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex gap-2">
        <span className="text-muted-foreground shrink-0">
          {tAuto("est_llm_api_key_cost_7e31e7e")}{" "}
        </span>
        <span className="text-muted-foreground">
          {tAuto("no_data_d802d23")}
        </span>
      </div>
    );
  }

  const evaluatorsWithData = evaluatorIds.filter((id) => id in data);
  const evaluatorsWithoutData = evaluatorIds.filter((id) => !(id in data));
  const isPartial = evaluatorsWithoutData.length > 0;

  const totalEstimate = evaluatorsWithData.reduce(
    (sum, id) => sum + data[id].avgCost * observationCount,
    0,
  );

  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground shrink-0">
        {tAuto("est_llm_api_key_cost_7e31e7e")}{" "}
      </span>
      <span className="flex items-center gap-1 font-bold">
        {formatCostEstimate(totalEstimate)}
        {isPartial ? "*" : ""}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="text-muted-foreground h-3 w-3" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs space-y-2 p-3">
              <p className="text-xs">
                {tAuto(
                  "expected_cost_on_your_linked_api_key_not_langfuse_es_d547263",
                )}{" "}
              </p>
              <div className="space-y-1">
                {evaluators.map(({ id, name }) => {
                  const entry = data[id];
                  return (
                    <div
                      key={id}
                      className="flex justify-between gap-4 text-xs"
                    >
                      <span className="truncate" title={name}>
                        {name}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {entry
                          ? formatCostEstimate(entry.avgCost * observationCount)
                          : tAuto("no_data_d802d23")}
                      </span>
                    </div>
                  );
                })}
              </div>
              {isPartial ? (
                <p className="text-muted-foreground text-xs">
                  {tAuto(
                    "partial_estimate_some_evaluators_have_no_execution_h_abe967c",
                  )}{" "}
                </p>
              ) : null}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </span>
    </div>
  );
}
