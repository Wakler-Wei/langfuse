import React from "react";
import {
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";
import { FileText, GitBranch, Zap, BarChart4 } from "lucide-react";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function PromptsOnboarding({ projectId }: { projectId: string }) {
  const tAuto = useAutoTranslations();
  const valuePropositions: ValueProposition[] = [
    {
      title: tAuto("decoupled_from_code_2b70e6a"),
      description: tAuto(
        "deploy_new_prompts_without_application_redeployment__16b7133",
      ),
      icon: <FileText className="h-4 w-4" />,
    },
    {
      title: tAuto("edit_in_ui_or_programmatically_e116dd3"),
      description: tAuto(
        "non_technical_users_can_easily_edit_prompts_in_the_u_0be9ba9",
      ),
      icon: <GitBranch className="h-4 w-4" />,
    },
    {
      title: tAuto("performance_optimized_d2d93a6"),
      description: tAuto(
        "client_side_caching_prevents_latency_or_availability_f42132b",
      ),
      icon: <Zap className="h-4 w-4" />,
    },
    {
      title: tAuto("compare_metrics_77a0c64"),
      description: tAuto(
        "track_latency_cost_and_evaluation_metrics_across_dif_7bad986",
      ),
      icon: <BarChart4 className="h-4 w-4" />,
    },
  ];

  return (
    <SplashScreen
      title={tAuto("get_started_with_prompt_management_298aa61")}
      description={tAuto(
        "langfuse_prompt_management_helps_you_centrally_manag_aee0788",
      )}
      valuePropositions={valuePropositions}
      primaryAction={{
        label: tAuto("create_prompt_e4d94df"),
        href: `/project/${projectId}/prompts/new`,
      }}
      secondaryAction={{
        label: tAuto("learn_more_378cbbf"),
        href: "https://langfuse.com/docs/prompt-management/get-started",
      }}
    />
  );
}
