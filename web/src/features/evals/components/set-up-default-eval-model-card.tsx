import { CardContent } from "@/src/components/ui/card";
import { Card } from "@/src/components/ui/card";
import { ManageDefaultEvalModel } from "@/src/features/evals/components/manage-default-eval-model";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function SetupDefaultEvalModelCard({
  projectId,
}: {
  projectId: string;
}) {
  const tAuto = useAutoTranslations();
  return (
    <Card className="border-dark-yellow bg-light-yellow mt-2">
      <CardContent className="mt-2 flex flex-col gap-1">
        <ManageDefaultEvalModel
          projectId={projectId}
          setUpMessage={
            <>
              {tAuto("no_default_model_description_01")}{" "}
              <a
                href="https://langfuse.com/docs/evaluation/evaluation-methods/llm-as-a-judge#how-llm-as-a-judge-works"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {tAuto("learn_more_2a5c6a3")}{" "}
              </a>
            </>
          }
          variant="color-coded"
        />
        <p className="text-dark-yellow/70 text-xs">
          {tAuto(
            "this_evaluator_expects_to_use_the_default_evaluation_bad70c6",
          )}{" "}
        </p>
      </CardContent>
    </Card>
  );
}
