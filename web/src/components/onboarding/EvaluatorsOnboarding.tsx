import React from "react";
import {
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";
import { Bot, Gauge, Zap, BarChart4 } from "lucide-react";
import { useIsCodeEvalEnabled } from "@/src/features/evals/hooks/useIsCodeEvalEnabled";
import { EvalTemplateSourceCodeLanguage } from "@langfuse/shared";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

interface EvaluatorsOnboardingProps {
  projectId: string;
}

export function EvaluatorsOnboarding({ projectId }: EvaluatorsOnboardingProps) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const { enabled, supportedSourceCodeLanguages } = useIsCodeEvalEnabled();
  const codeEvaluatorLanguageDescription =
    supportedSourceCodeLanguages.includes(EvalTemplateSourceCodeLanguage.PYTHON)
      ? tAuto("typescript_or_python_3a2da6a")
      : tAutoI18n("typescript_d4a86cb");

  const llmAsJudgeValuePropositions: ValueProposition[] = [
    {
      title: tAuto("automate_evaluations_8e55cfa"),
      description: tAuto(
        "use_llm_as_a_judge_to_automatically_evaluate_your_tr_b5ab156",
      ),
      icon: <Bot className="h-4 w-4" />,
    },
    {
      title: tAuto("measure_quality_e88ae14"),
      description: tAuto(
        "create_custom_evaluation_criteria_to_measure_the_qua_e28bb27",
      ),
      icon: <Gauge className="h-4 w-4" />,
    },
    {
      title: tAuto("scale_efficiently_ac12761"),
      description: tAuto(
        "evaluate_thousands_of_traces_automatically_with_cust_d9f2863",
      ),
      icon: <Zap className="h-4 w-4" />,
    },
    {
      title: tAuto("track_performance_fa6925b"),
      description: tAuto(
        "monitor_evaluation_metrics_over_time_to_identify_tre_beb7c1e",
      ),
      icon: <BarChart4 className="h-4 w-4" />,
    },
  ];

  if (enabled) {
    return (
      <SplashScreen
        title={tAuto("get_started_with_evaluations_cc35abd")}
        description={
          <>
            {tAuto(
              "use_evaluators_to_score_traces_and_observations_auto_b24f29d",
            )}{" "}
            <ul className="text-muted-foreground mx-auto mt-2 max-w-2xl list-disc space-y-2 pl-5 text-left text-sm">
              <li>
                <span className="text-foreground font-bold">
                  {tAuto("llm_as_a_judge_evaluators_a3a9664")}{" "}
                </span>{" "}
                {tAutoI18n(
                  "use_an_llm_to_score_outputs_against_natural_language_dfce444",
                )}{" "}
              </li>
              <li>
                <span className="text-foreground font-bold">
                  {tAuto("code_evaluators_98df2cb")}{" "}
                </span>{" "}
                {tAuto(
                  "use_value0_logic_for_deterministic_custom_scoring_3756630",
                  { value0: codeEvaluatorLanguageDescription },
                )}{" "}
              </li>
            </ul>
          </>
        }
        primaryAction={{
          label: tAuto("create_evaluator_2fa1ea6"),
          href: `/project/${projectId}/evals/new`,
        }}
        secondaryAction={{
          label: tAuto("learn_more_378cbbf"),
          href: "https://langfuse.com/docs/evaluation",
        }}
      />
    );
  }

  return (
    <SplashScreen
      title={tAuto("get_started_with_llm_as_a_judge_evaluations_cf4b79b")}
      description={tAuto(
        "create_evaluation_templates_and_evaluators_to_automa_f1da44d",
      )}
      valuePropositions={llmAsJudgeValuePropositions}
      primaryAction={{
        label: tAuto("create_evaluator_2fa1ea6"),
        href: `/project/${projectId}/evals/new`,
      }}
      secondaryAction={{
        label: tAuto("learn_more_378cbbf"),
        href: "https://langfuse.com/docs/evaluation/evaluation-methods/llm-as-a-judge",
      }}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/scores-llm-as-a-judge-overview-v1.mp4"
    />
  );
}
