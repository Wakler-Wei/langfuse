import React from "react";
import {
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";
import { ClipboardCheck, Users, BarChart4, GitMerge } from "lucide-react";
import { CreateOrEditAnnotationQueueButton } from "@/src/features/annotation-queues/components/CreateOrEditAnnotationQueueButton";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function AnnotationQueuesOnboarding({
  projectId,
}: {
  projectId: string;
}) {
  const tAuto = useAutoTranslations();
  const valuePropositions: ValueProposition[] = [
    {
      title: tAuto("manage_scoring_workflows_125d910"),
      description: tAuto(
        "create_and_manage_annotation_queues_to_streamline_yo_425da7e",
      ),
      icon: <ClipboardCheck className="h-4 w-4" />,
    },
    {
      title: tAuto("collaborate_with_annotators_fc5470d"),
      description: tAuto(
        "invite_team_members_to_annotate_and_evaluate_your_ll_e035ce4",
      ),
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: tAuto("track_annotation_metrics_4bd2cd9"),
      description: tAuto(
        "monitor_annotation_progress_and_quality_metrics_acro_68b5555",
      ),
      icon: <BarChart4 className="h-4 w-4" />,
    },
    {
      title: tAuto("baseline_evaluation_efforts_0217487"),
      description: tAuto(
        "use_annotation_data_as_a_baseline_to_evaluate_your_o_b7ec923",
      ),
      icon: <GitMerge className="h-4 w-4" />,
    },
  ];

  return (
    <SplashScreen
      title={tAuto("get_started_with_annotation_queues_332271c")}
      description={tAuto(
        "annotation_queues_help_you_manage_manual_annotation__12d79e0",
      )}
      valuePropositions={valuePropositions}
      primaryAction={{
        label: tAuto("create_annotation_queue_ddf6876"),
        component: (
          <CreateOrEditAnnotationQueueButton
            variant="default"
            projectId={projectId}
            size="lg"
          />
        ),
      }}
      secondaryAction={{
        label: tAuto("learn_more_378cbbf"),
        href: "https://langfuse.com/docs/scores/annotation",
      }}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/annotation-queue-overview-v1.mp4"
    />
  );
}
