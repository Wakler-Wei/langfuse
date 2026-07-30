import React from "react";
import { FormItem, FormLabel, FormMessage } from "@/src/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { TemplateSelector } from "@/src/features/evals/components/template-selector";
import { EvaluatorForm } from "@/src/features/evals/components/evaluator-form";
import { type EvaluatorsStepProps } from "@/src/features/experiments/types/stepProps";
import { StepHeader } from "@/src/features/experiments/components/shared/StepHeader";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const EvaluatorsStep: React.FC<EvaluatorsStepProps> = ({
  projectId,
  datasetId,
  evaluatorState,
  permissions,
}) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const {
    evalTemplates,
    selectedEvaluatorData,
    showEvaluatorForm,
    handleConfigureEvaluator,
    handleSelectEvaluator,
    handleCloseEvaluatorForm,
    handleEvaluatorSuccess,
    preprocessFormValues,
  } = evaluatorState;
  const { hasEvalReadAccess, hasEvalWriteAccess } = permissions;
  return (
    <div className="space-y-6">
      <StepHeader
        title={tAuto("evaluators_optional_3f58a16")}
        description={tAuto(
          "configure_evaluators_to_automatically_score_experime_5982b5d",
        )}
      />

      <FormItem>
        <FormLabel>{tAuto("select_evaluators_0e69109")}</FormLabel>
        {hasEvalReadAccess && datasetId ? (
          <TemplateSelector
            projectId={projectId}
            datasetId={datasetId}
            evalTemplates={evalTemplates}
            onConfigureTemplate={handleConfigureEvaluator}
            onSelectEvaluator={handleSelectEvaluator}
            disabled={!hasEvalWriteAccess}
          />
        ) : (
          <p className="text-muted-foreground text-sm">
            {!hasEvalReadAccess
              ? tAutoI18n(
                  "you_don_t_have_permission_to_manage_evaluators_3a07426",
                )
              : tAutoI18n(
                  "please_select_a_dataset_first_to_configure_evaluator_76e23d0",
                )}
          </p>
        )}
        <FormMessage />
      </FormItem>

      {/* Dialog for configuring evaluators */}
      {selectedEvaluatorData && (
        <Dialog
          open={showEvaluatorForm}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseEvaluatorForm();
            }
          }}
        >
          <DialogContent className="max-h-[90vh] max-w-(--breakpoint-md) overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedEvaluatorData.evaluator.id
                  ? tAutoI18n("edit_5301648")
                  : tAutoI18n("configure_792c81a")}{" "}
                {tAutoI18n("evaluator_191ad26")}{" "}
              </DialogTitle>
            </DialogHeader>
            <EvaluatorForm
              useDialog={true}
              projectId={projectId}
              evalTemplates={evalTemplates}
              templateId={selectedEvaluatorData.templateId}
              existingEvaluator={selectedEvaluatorData.evaluator}
              mode={selectedEvaluatorData.evaluator.id ? "edit" : "create"}
              hideTargetSection={!selectedEvaluatorData.evaluator.id}
              onFormSuccess={handleEvaluatorSuccess}
              preprocessFormValues={preprocessFormValues}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
