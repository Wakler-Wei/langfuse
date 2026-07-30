import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { type ReviewStepProps } from "@/src/features/experiments/types/stepProps";
import { StepHeader } from "@/src/features/experiments/components/shared/StepHeader";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const ReviewStep: React.FC<ReviewStepProps> = ({
  formState,
  navigationState,
  summary,
}) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const { form } = formState;
  const { setActiveStep } = navigationState;
  const {
    selectedPromptName,
    selectedPromptVersion,
    selectedDataset,
    modelParams,
    activeEvaluatorNames,
    structuredOutputEnabled,
    selectedSchemaName,
    validationResult,
  } = summary;
  const formValues = form.getValues();

  return (
    <div className="space-y-6">
      <StepHeader
        title={tAuto("review_run_a75910d")}
        description={tAuto(
          "review_your_experiment_configuration_before_running__34b4f6a",
        )}
      />

      {/* Two-column grid layout */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {/* Prompt Card - Top Left */}
        <Card
          className="hover:bg-accent cursor-pointer transition-colors"
          onClick={() => setActiveStep("prompt")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {tAuto("prompt_a817d7e")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground">
                {tAuto("name_71dd2ef")}
              </span>
              <span className="font-bold">{selectedPromptName}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">
                {tAuto("version_9f49127")}
              </span>
              <span className="font-bold">v{selectedPromptVersion}</span>
            </div>
          </CardContent>
        </Card>

        {/* Model Card - Top Right */}
        <Card
          className="hover:bg-accent cursor-pointer transition-colors"
          onClick={() => setActiveStep("prompt")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {tAuto("model_68c2cc7")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground">
                {tAuto("provider_f60f814")}
              </span>
              <span>{modelParams.provider.value}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">
                {tAuto("model_9e1279a")}
              </span>
              <span>{modelParams.model.value}</span>
            </div>
            {modelParams.temperature.enabled && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">
                  {tAuto("temperature_9aca4f6")}
                </span>
                <span>{modelParams.temperature.value}</span>
              </div>
            )}
            {modelParams.max_tokens.enabled && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">
                  {tAuto("max_tokens_2df30de")}
                </span>
                <span>{modelParams.max_tokens.value}</span>
              </div>
            )}
            {structuredOutputEnabled && selectedSchemaName && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">
                  {tAuto("structured_output_4d5dfaf")}{" "}
                </span>
                <span>{selectedSchemaName}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dataset Card - Middle Left */}
        <Card
          className="hover:bg-accent cursor-pointer transition-colors"
          onClick={() => setActiveStep("dataset")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {tAuto("dataset_1052689")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground">
                {tAuto("name_71dd2ef")}
              </span>
              <span className="font-bold">{selectedDataset?.name}</span>
            </div>
            {validationResult?.isValid && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">
                  {tAuto("items_118d910")}
                </span>
                <span>{validationResult.totalItems}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evaluators Card - Middle Right (only if there are evaluators) */}
        {activeEvaluatorNames.length > 0 && (
          <Card
            className="hover:bg-accent cursor-pointer transition-colors"
            onClick={() => setActiveStep("evaluators")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {tAutoI18n("evaluators_5fd76d7")}
                {activeEvaluatorNames.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {activeEvaluatorNames.map((name) => (
                  <Badge key={name} variant="secondary" className="text-xs">
                    {name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Run Details Card - Bottom (Full Width) */}
        <Card
          className="hover:bg-accent cursor-pointer transition-colors md:col-span-2"
          onClick={() => setActiveStep("details")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {tAuto("experiment_run_details_52da234")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground">
                {tAuto("experiment_name_b712e59")}
              </span>
              <span className="font-bold">{formValues.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {tAuto("run_name_89d9bd4")}
              </span>
              <span className="font-bold">{formValues.runName}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="text-muted-foreground h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  {tAuto(
                    "this_run_name_is_auto_generated_from_the_experiment__b8c9449",
                  )}{" "}
                </TooltipContent>
              </Tooltip>
            </div>
            {formValues.description && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">
                  {tAuto("description_9b6f3f0")}
                </span>
                <span className="text-sm">{formValues.description}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
