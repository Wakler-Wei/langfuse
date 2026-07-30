import React from "react";
import {
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";
import { ThumbsUp, Star, LineChart, Code } from "lucide-react";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function ScoresOnboarding() {
  const tAuto = useAutoTranslations();
  const valuePropositions: ValueProposition[] = [
    {
      title: tAuto("collect_user_feedback_7cfc2a9"),
      description: tAuto(
        "gather_thumbs_up_down_feedback_from_users_to_identif_f06b818",
      ),
      icon: <ThumbsUp className="h-4 w-4" />,
    },
    {
      title: tAuto("run_model_based_evaluations_87899a0"),
      description: tAuto(
        "use_llms_to_automatically_evaluate_your_application__6139c39",
      ),
      icon: <Star className="h-4 w-4" />,
    },
    {
      title: tAuto("track_quality_metrics_d276b90"),
      description: tAuto(
        "monitor_quality_metrics_over_time_to_identify_trends_9e25d87",
      ),
      icon: <LineChart className="h-4 w-4" />,
    },
    {
      title: tAuto("use_custom_metrics_07e742a"),
      description: tAuto(
        "langfuse_s_scores_are_flexible_and_can_be_used_to_tr_bd72ccf",
      ),
      icon: <Code className="h-4 w-4" />,
    },
  ];

  return (
    <SplashScreen
      title={tAuto("get_started_with_scores_0c2d54c")}
      description={tAuto(
        "scores_allow_you_to_evaluate_the_quality_safety_of_y_b568fe3",
      )}
      valuePropositions={valuePropositions}
      secondaryAction={{
        label: tAuto("learn_more_378cbbf"),
        href: "https://langfuse.com/docs/evaluation/evaluation-methods/custom-scores",
      }}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/scores-overview-v1.mp4"
    />
  );
}
