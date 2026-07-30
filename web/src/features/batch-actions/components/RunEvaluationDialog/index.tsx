import { useMemo, useState } from "react";
import {
  type BatchActionQuery,
  type BatchEvalSourceTable,
  EvalTargetObject,
  BatchEvalSourceTable as SourceTable,
  getEvalTargetObjectFromSourceTable,
} from "@langfuse/shared";
import { api, sendAsPostOption } from "@/src/utils/api";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { ChevronLeft } from "lucide-react";
import { EvaluatorSelectionStep } from "./EvaluatorSelectionStep";
import { ConfirmationStep } from "./ConfirmationStep";
import { CreateEvaluatorDialog } from "./CreateEvaluatorDialog";
import { buildQueryWithSelectedIds } from "./utils";
import { useV4Beta } from "@/src/features/events/hooks/useV4Beta";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type RunEvaluationDialogProps = {
  projectId: string;
  selectedObservationIds: string[];
  query: BatchActionQuery;
  selectAll: boolean;
  totalCount: number;
  onClose: () => void;
  experimentCount?: number;
  exampleObservation?: {
    id: string;
    traceId: string;
    startTime?: Date;
  };
  sourceTable?: BatchEvalSourceTable;
};

type DialogStep = "select-evaluator" | "confirm";

export function RunEvaluationDialog(props: RunEvaluationDialogProps) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const { isBetaEnabled } = useV4Beta();
  const {
    projectId,
    selectedObservationIds,
    query,
    selectAll,
    totalCount,
    sourceTable = SourceTable.EVENTS,
  } = props;

  const [step, setStep] = useState<DialogStep>("select-evaluator");
  const [selectedEvaluatorIds, setSelectedEvaluatorIds] = useState<string[]>(
    [],
  );
  const [evaluatorSearchQuery, setEvaluatorSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Derive targetObject from sourceTable
  const targetObject = getEvalTargetObjectFromSourceTable(sourceTable);

  const evaluatorsQuery = api.evals.jobConfigsByTarget.useQuery({
    projectId,
    targetObject,
  });

  const runEvaluationMutation =
    api.batchAction.runEvaluation.create.useMutation({
      onError: (error) => {
        showErrorToast(
          tAutoI18n("failed_to_schedule_evaluation_2697bc3"),
          error.message,
        );
      },
    });

  const displayCount = selectAll ? totalCount : selectedObservationIds.length;
  // For experiments source, displayCount is experiment count, not item count
  const isExperimentsSource = sourceTable === SourceTable.EXPERIMENTS;
  const scopeLabel =
    sourceTable === SourceTable.EVENTS
      ? tAutoI18n("observation_7c02c7e")
      : tAutoI18n("experiment_item_fad3025");
  const evaluatorScopeLabel =
    targetObject === EvalTargetObject.EVENT
      ? tAutoI18n("observation_7c02c7e")
      : tAutoI18n("experiment_f45f2bc");
  const evaluatorScope =
    targetObject === EvalTargetObject.EVENT ? "observation" : "experiment";
  const experimentItemsExperimentCount =
    sourceTable === SourceTable.EXPERIMENT_ITEMS
      ? (props.experimentCount ?? 0)
      : 0;

  const previewObservationQuery = api.observations.byId.useQuery(
    {
      projectId,
      observationId: props.exampleObservation?.id as string,
      traceId: props.exampleObservation?.traceId as string,
      startTime: props.exampleObservation?.startTime ?? null,
    },
    {
      enabled:
        !isBetaEnabled &&
        Boolean(
          props.exampleObservation?.id && props.exampleObservation?.traceId,
        ),
    },
  );

  const previewEventQuery = api.events.batchIO.useQuery(
    {
      projectId,
      observations: [
        {
          id: props.exampleObservation?.id as string,
          traceId: props.exampleObservation?.traceId as string,
        },
      ],
      minStartTime: props.exampleObservation?.startTime as Date,
      maxStartTime: props.exampleObservation?.startTime as Date,
      truncated: false,
      includeToolCalls: true,
    },
    {
      ...sendAsPostOption,
      enabled:
        isBetaEnabled &&
        Boolean(
          props.exampleObservation?.id &&
          props.exampleObservation?.traceId &&
          props.exampleObservation?.startTime,
        ),
    },
  );

  const eligibleEvaluators = useMemo(() => {
    return (evaluatorsQuery.data ?? []).filter(
      (evaluator) => evaluator.targetObject === targetObject,
    );
  }, [evaluatorsQuery.data, targetObject]);

  const selectedEvaluators = useMemo(
    () =>
      eligibleEvaluators.filter((evaluator) =>
        selectedEvaluatorIds.includes(evaluator.id),
      ),
    [eligibleEvaluators, selectedEvaluatorIds],
  );

  const toggleEvaluatorSelection = (evaluatorId: string) => {
    setSelectedEvaluatorIds((previous) =>
      previous.includes(evaluatorId)
        ? previous.filter((id) => id !== evaluatorId)
        : [...previous, evaluatorId],
    );
  };

  const onSubmit = async () => {
    if (selectedEvaluators.length === 0) {
      return;
    }

    const finalQuery = buildQueryWithSelectedIds({
      query,
      selectAll,
      selectedObservationIds,
    });

    try {
      await runEvaluationMutation.mutateAsync({
        projectId,
        query: finalQuery,
        evaluatorIds: selectedEvaluators.map((evaluator) => evaluator.id),
        sourceTable,
      });
    } catch {
      return;
    }

    showSuccessToast({
      title: tAuto("evaluation_queued_fece902"),
      description: isExperimentsSource
        ? tAuto(
            "scheduled_evaluation_for_items_from_value0_selected__0647285",
            {
              value0: displayCount,
              value1: displayCount === 1 ? "" : "s",
              value2: selectedEvaluators.length,
              value3:
                selectedEvaluators.length === 1 ? "evaluator" : "evaluators",
            },
          )
        : sourceTable === SourceTable.EXPERIMENT_ITEMS
          ? tAuto(
              "scheduled_evaluation_for_up_to_value0_experiment_ite_b2064e5",
              {
                value0: displayCount,
                value1: displayCount === 1 ? "" : "s",
                value2: experimentItemsExperimentCount,
                value3: experimentItemsExperimentCount === 1 ? "" : "s",
                value4: selectedEvaluators.length,
                value5:
                  selectedEvaluators.length === 1 ? "evaluator" : "evaluators",
              },
            )
          : tAuto(
              "scheduled_evaluation_for_value0_selected_value1_valu_9f9217f",
              {
                value0: displayCount,
                value1: scopeLabel,
                value2: displayCount === 1 ? "" : "s",
                value3: selectedEvaluators.length,
                value4:
                  selectedEvaluators.length === 1 ? "evaluator" : "evaluators",
              },
            ),
      link: {
        href: `/project/${projectId}/settings/batch-actions`,
        text: "View batch actions",
      },
    });

    props.onClose();
  };

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && props.onClose()}>
        <DialogContent className="flex max-h-[62vh] min-h-[38vh] max-w-2xl flex-col">
          <DialogHeader>
            <DialogTitle>
              {isExperimentsSource
                ? tAutoI18n(
                    "evaluate_items_from_value0_experiment_value1_f32fcba",
                    {
                      value0: String(displayCount),
                      value1: displayCount === 1 ? "" : "s",
                    },
                  )
                : sourceTable === SourceTable.EXPERIMENT_ITEMS
                  ? tAutoI18n(
                      "evaluate_up_to_value0_experiment_item_value1_across__fd022d1",
                      {
                        value0: String(displayCount),
                        value1: displayCount === 1 ? "" : "s",
                        value2: String(experimentItemsExperimentCount),
                        value3: experimentItemsExperimentCount === 1 ? "" : "s",
                      },
                    )
                  : tAutoI18n("evaluate_value0_value1_value2_53c30c2", {
                      value0: String(displayCount),
                      value1: String(scopeLabel),
                      value2: displayCount === 1 ? "" : "s",
                    })}
            </DialogTitle>
            <DialogDescription>
              {step === "confirm"
                ? tAutoI18n(
                    "review_your_evaluation_configuration_before_running_0ef0631",
                  )
                : tAutoI18n(
                    "select_one_or_more_value0_scoped_evaluators_8bf7863",
                    { value0: String((evaluatorScopeLabel as unknown) ?? "") },
                  )}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="flex-1 overflow-hidden">
            {step === "select-evaluator" ? (
              <EvaluatorSelectionStep
                eligibleEvaluators={eligibleEvaluators}
                selectedEvaluators={selectedEvaluators}
                isQueryLoading={evaluatorsQuery.isLoading}
                isQueryError={evaluatorsQuery.isError}
                queryErrorMessage={evaluatorsQuery.error?.message}
                previewObservation={
                  isBetaEnabled
                    ? previewEventQuery.data?.[0]
                    : previewObservationQuery.data
                }
                isPreviewLoading={
                  previewObservationQuery.isLoading ||
                  previewEventQuery.isLoading
                }
                evaluatorScopeLabel={evaluatorScope}
                selectedEvaluatorIds={selectedEvaluatorIds}
                evaluatorSearchQuery={evaluatorSearchQuery}
                onSearchQueryChange={setEvaluatorSearchQuery}
                onToggleEvaluator={toggleEvaluatorSelection}
                onCreateEvaluator={() => setShowCreateDialog(true)}
              />
            ) : (
              <ConfirmationStep
                projectId={projectId}
                displayCount={displayCount}
                evaluators={selectedEvaluators.map((e) => ({
                  id: e.id,
                  name: e.scoreName,
                }))}
                hideCount={targetObject === EvalTargetObject.EXPERIMENT}
                sourceTable={sourceTable}
                experimentCount={experimentItemsExperimentCount}
              />
            )}
          </DialogBody>

          <DialogFooter className="flex justify-between">
            {step === "confirm" ? (
              <Button
                variant="ghost"
                onClick={() => setStep("select-evaluator")}
                disabled={runEvaluationMutation.isPending}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                {tAuto("back_b52b36b")}{" "}
              </Button>
            ) : (
              <div />
            )}

            {step === "select-evaluator" ? (
              <Button
                onClick={() => setStep("confirm")}
                disabled={selectedEvaluators.length === 0}
              >
                {tAutoI18n("continue_2e02623")}{" "}
                {selectedEvaluators.length > 0
                  ? tAutoI18n("with_value0_evaluator_s_1034c84", {
                      value0: String(
                        (selectedEvaluators.length as unknown) ?? "",
                      ),
                    })
                  : null}
              </Button>
            ) : (
              <Button
                onClick={onSubmit}
                loading={runEvaluationMutation.isPending}
              >
                {tAuto("run_evaluation_9b5ca83")}{" "}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateEvaluatorDialog
        projectId={projectId}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        targetObject={targetObject}
      />
    </>
  );
}
