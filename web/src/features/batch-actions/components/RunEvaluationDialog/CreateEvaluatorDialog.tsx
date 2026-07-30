import { useState } from "react";
import {
  EvalTargetObject,
  type EvalTargetObject as EvalTargetObjectType,
} from "@langfuse/shared";
import { api } from "@/src/utils/api";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { EvaluatorSelector } from "@/src/features/evals/components/evaluator-selector";
import { EvaluatorForm } from "@/src/features/evals/components/evaluator-form";
import { ChevronLeft } from "lucide-react";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type CreateEvaluatorDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetObject?: EvalTargetObjectType;
};

export function CreateEvaluatorDialog(props: CreateEvaluatorDialogProps) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const {
    projectId,
    open,
    onOpenChange,
    targetObject = EvalTargetObject.EVENT,
  } = props;
  const [templateId, setTemplateId] = useState<string | null>(null);
  const utils = api.useUtils();

  const templatesQuery = api.evals.latestTemplates.useQuery(
    {
      projectId,
      limit: 500,
      page: 0,
    },
    {
      enabled: open,
    },
  );

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setTemplateId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-(--breakpoint-md) pb-0">
        <DialogHeader>
          <DialogTitle>
            {tAutoI18n("create_evaluator_for_batched_dda664b")}{" "}
            {targetObject === EvalTargetObject.EVENT
              ? tAutoI18n("observation_7c02c7e")
              : tAutoI18n("experiment_f45f2bc")}{" "}
            {tAutoI18n("runs_71b3f0b")}{" "}
          </DialogTitle>
          <DialogDescription>
            {tAutoI18n("this_form_creates_an_evaluator_for_batched_c621774")}{" "}
            {targetObject === EvalTargetObject.EVENT
              ? tAutoI18n("observation_7c02c7e")
              : tAutoI18n("experiment_f45f2bc")}{" "}
            {tAutoI18n("runs_6853381")}{" "}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="max-h-[72vh] overflow-y-auto pr-1 pb-0">
          {!templateId ? (
            <div className="space-y-4 px-1 pb-1">
              <p className="text-muted-foreground text-sm">
                {tAuto(
                  "select_an_evaluator_template_to_configure_bf97194",
                )}{" "}
              </p>
              {templatesQuery.isLoading ? (
                <p className="text-muted-foreground text-sm">
                  {tAuto("loading_templates_41e96b9")}{" "}
                </p>
              ) : templatesQuery.isError ? (
                <p className="text-destructive text-sm">
                  {tAutoI18n("failed_to_load_templates_e931bd6")}{" "}
                  {templatesQuery.error.message}
                </p>
              ) : (
                <div className="max-h-[55vh] overflow-y-auto rounded-md border p-2">
                  <EvaluatorSelector
                    projectId={projectId}
                    evalTemplates={templatesQuery.data?.templates ?? []}
                    selectedTemplateId={undefined}
                    onTemplateSelect={(id) => setTemplateId(id)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="pb-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTemplateId(null)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                {tAuto("back_to_template_selection_0658b3e")}{" "}
              </Button>
              <EvaluatorForm
                useDialog
                projectId={projectId}
                evalTemplates={templatesQuery.data?.templates ?? []}
                templateId={templateId}
                hideTargetSelection
                hidePreviewTable
                defaultRunOnLive={false}
                defaultTarget={targetObject}
                onFormSuccess={() => {
                  handleClose(false);
                  utils.evals.jobConfigsByTarget.invalidate({
                    projectId,
                    targetObject,
                  });
                  showSuccessToast({
                    title: tAuto("evaluator_created_b0d90cb"),
                    description: tAuto(
                      "select_it_in_the_previous_step_to_run_it_on_selected_4b49d7f",
                    ),
                  });
                }}
                preprocessFormValues={(values) => ({
                  ...values,
                  target: targetObject,
                  timeScope: ["NEW"],
                  ...(values.runOnLive
                    ? {}
                    : {
                        filter: [],
                        sampling: 1,
                        delay: 0,
                      }),
                })}
              />
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
