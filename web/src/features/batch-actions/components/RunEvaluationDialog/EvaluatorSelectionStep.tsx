import { useMemo } from "react";
import { observationVariableMappingList } from "@langfuse/shared";
import { type RouterOutputs } from "@/src/utils/api";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/design-system/Checkbox/Checkbox";
import { Input } from "@/src/components/ui/input";
import { EvaluatorPromptPreview } from "./EvaluatorPromptPreview";
import { renderPromptPreviewFromObservation } from "./utils";
import { Eye, Plus, X } from "lucide-react";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type Evaluator = RouterOutputs["evals"]["jobConfigsByTarget"][number];
type ObservationPreview = RouterOutputs["observations"]["byId"];
type EventPreview = RouterOutputs["events"]["batchIO"][number];

type EvaluatorSelectionStepProps = {
  eligibleEvaluators: Evaluator[];
  selectedEvaluators: Evaluator[];
  isQueryLoading: boolean;
  isQueryError: boolean;
  queryErrorMessage: string | undefined;
  previewObservation: ObservationPreview | EventPreview | undefined;
  isPreviewLoading: boolean;
  evaluatorScopeLabel: "observation" | "experiment";
  selectedEvaluatorIds: string[];
  evaluatorSearchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onToggleEvaluator: (evaluatorId: string) => void;
  onCreateEvaluator: () => void;
};

export function EvaluatorSelectionStep(props: EvaluatorSelectionStepProps) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const {
    eligibleEvaluators,
    selectedEvaluators,
    isQueryLoading,
    isQueryError,
    queryErrorMessage,
    previewObservation,
    isPreviewLoading,
    evaluatorScopeLabel,
    selectedEvaluatorIds,
    evaluatorSearchQuery,
    onSearchQueryChange,
    onToggleEvaluator,
    onCreateEvaluator,
  } = props;

  const filteredEvaluators = useMemo(() => {
    const normalizedSearch = evaluatorSearchQuery.trim().toLowerCase();
    const filtered = normalizedSearch
      ? eligibleEvaluators.filter((evaluator) => {
          const templateName = evaluator.evalTemplate?.name ?? "";

          return (
            evaluator.scoreName.toLowerCase().includes(normalizedSearch) ||
            templateName.toLowerCase().includes(normalizedSearch)
          );
        })
      : eligibleEvaluators;

    return [...filtered].sort((a, b) =>
      a.scoreName.localeCompare(b.scoreName, undefined, {
        sensitivity: "base",
      }),
    );
  }, [eligibleEvaluators, evaluatorSearchQuery]);

  const getPromptPreview = (evaluator: Evaluator) => {
    if (isPreviewLoading) {
      return "Loading preview...";
    }

    if (!previewObservation) {
      return "Preview unavailable for the current selection.";
    }

    const mappingResult = observationVariableMappingList.safeParse(
      evaluator.variableMapping,
    );

    if (!mappingResult.success) {
      return "Evaluator mapping is not valid for observation preview.";
    }

    return renderPromptPreviewFromObservation({
      prompt: evaluator.evalTemplate?.prompt,
      variableMapping: mappingResult.data,
      observation: previewObservation,
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex min-h-0 flex-1 flex-col">
        {isQueryLoading ? (
          <p className="text-muted-foreground text-sm">
            {tAuto("loading_evaluators_0a87a47")}
          </p>
        ) : isQueryError ? (
          <Card>
            <CardContent className="text-destructive p-4 text-sm">
              {tAutoI18n("failed_to_load_evaluators_001c3cd")}{" "}
              {queryErrorMessage}
            </CardContent>
          </Card>
        ) : eligibleEvaluators.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground p-4 text-sm">
              {tAutoI18n("no_816c52f")} {evaluatorScopeLabel}
              {tAutoI18n("scoped_evaluators_found_create_a_new_3999a8d")}{" "}
              {evaluatorScopeLabel}
              {tAutoI18n(
                "scoped_evaluator_and_it_will_appear_here_96578f7",
              )}{" "}
            </CardContent>
          </Card>
        ) : (
          <div className="flex h-full min-h-0 flex-col gap-2">
            <div className="relative">
              <Input
                autoFocus
                className="pr-10"
                placeholder={tAuto("search_evaluators_f35afa0")}
                value={evaluatorSearchQuery}
                onChange={(event) =>
                  onSearchQueryChange(event.currentTarget.value)
                }
              />
              {evaluatorSearchQuery.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1/2 right-1.5 h-7 w-7 -translate-y-1/2"
                  onClick={() => onSearchQueryChange("")}
                  aria-label={tAuto("clear_evaluator_search_ebed769")}
                >
                  <X className="h-3 w-3" />
                </Button>
              ) : null}
            </div>

            <div className="px-1 pb-1">
              <div className="flex min-h-6 flex-wrap items-center gap-2">
                {selectedEvaluators.length > 0 ? (
                  selectedEvaluators.map((evaluator) => (
                    <EvaluatorPromptPreview
                      key={evaluator.id}
                      previewContent={getPromptPreview(evaluator)}
                      trigger={
                        <div>
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1 pr-1"
                          >
                            <span>{evaluator.scoreName}</span>
                            <button
                              type="button"
                              aria-label={tAuto("remove_value0_a2d40d3", {
                                value0: evaluator.scoreName,
                              })}
                              className="hover:bg-muted rounded p-0.5"
                              onClick={() => onToggleEvaluator(evaluator.id)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        </div>
                      }
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground text-xs">
                    {tAuto("no_evaluators_selected_af8d8de")}{" "}
                  </p>
                )}
              </div>
            </div>

            {filteredEvaluators.length === 0 ? (
              <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border">
                <p className="text-muted-foreground p-4 text-sm">
                  {tAuto("no_evaluators_match_your_search_19fdb6d")}{" "}
                </p>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto rounded-md border">
                {filteredEvaluators.map((item, index, array) => {
                  const templateLabel = `Template: ${item.evalTemplate?.name ?? "Deleted template"}`;

                  return (
                    <div key={item.id}>
                      <div
                        className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 px-2 py-1.5 transition-colors"
                        onClick={() => onToggleEvaluator(item.id)}
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-sm font-bold"
                            title={item.scoreName}
                          >
                            {item.scoreName}
                          </p>
                          <p
                            className="text-muted-foreground truncate text-[11px]"
                            title={templateLabel}
                          >
                            {templateLabel}
                          </p>
                        </div>
                        <EvaluatorPromptPreview
                          previewContent={getPromptPreview(item)}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-7 w-7"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                              }}
                              onClick={(event) => event.stopPropagation()}
                              aria-label={tAuto("preview_value0_091141c", {
                                value0: item.scoreName,
                              })}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <span className="mr-1">
                          <Checkbox
                            checked={selectedEvaluatorIds.includes(item.id)}
                            aria-label={tAuto("select_value0_a9ef046", {
                              value0: item.scoreName,
                            })}
                            onClick={(event) => event.stopPropagation()}
                            onCheckedChange={() => onToggleEvaluator(item.id)}
                          />
                        </span>
                      </div>
                      {index < array.length - 1 ? (
                        <div className="border-border/50 border-b" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <Button
        variant="outline"
        size="default"
        className="h-9 w-full"
        onClick={onCreateEvaluator}
      >
        <Plus className="mr-1 h-4 w-4" />
        {tAuto("create_new_evaluator_b237f1a")}{" "}
      </Button>
    </div>
  );
}
