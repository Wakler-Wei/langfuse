import React from "react";
import {
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";
import { ButtonWithIcon } from "@/src/components/ButtonWithIcon";
import { DialogTrigger } from "@/src/components/ui/dialog";
import { CreateDatasetDialogController } from "@/src/features/datasets/components/CreateDatasetDialogController";
import { Database, Beaker, Zap, Code, LockIcon, PlusIcon } from "lucide-react";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function DatasetsOnboarding({ projectId }: { projectId: string }) {
  const tAuto = useAutoTranslations();
  const valuePropositions: ValueProposition[] = [
    {
      title: tAuto("continuous_improvement_ed618ac"),
      description: tAuto(
        "create_datasets_from_production_edge_cases_to_improv_85cd913",
      ),
      icon: <Zap className="h-4 w-4" />,
    },
    {
      title: tAuto("pre_deployment_testing_9849656"),
      description: tAuto(
        "benchmark_new_releases_before_deploying_to_productio_57417d5",
      ),
      icon: <Beaker className="h-4 w-4" />,
    },
    {
      title: tAuto("structured_testing_bdf915f"),
      description: tAuto(
        "run_experiments_on_collections_of_inputs_and_expecte_30ba13e",
      ),
      icon: <Database className="h-4 w-4" />,
    },
    {
      title: tAuto("custom_workflows_b38eedf"),
      description: tAuto(
        "build_custom_workflows_around_your_datasets_via_the__fc457c9",
      ),
      icon: <Code className="h-4 w-4" />,
    },
  ];

  return (
    <SplashScreen
      title={tAuto("get_started_with_datasets_experiments_e1aa226")}
      description={tAuto(
        "datasets_in_langfuse_are_collections_of_inputs_and_e_93bb31d",
      )}
      valuePropositions={valuePropositions}
      primaryAction={{
        label: tAuto("create_dataset_ffd8411"),
        component: (
          <CreateDatasetDialogController
            projectId={projectId}
            target={{ type: "root" }}
          >
            {({ disabled, openDialog }) => (
              <DialogTrigger asChild>
                <ButtonWithIcon
                  size="lg"
                  disabled={disabled !== undefined}
                  onClick={openDialog}
                  variant="default"
                  icon={disabled === undefined ? PlusIcon : LockIcon}
                  text={tAuto("create_dataset_ffd8411")}
                />
              </DialogTrigger>
            )}
          </CreateDatasetDialogController>
        ),
      }}
      secondaryAction={{
        label: tAuto("learn_more_378cbbf"),
        href: "https://langfuse.com/docs/datasets",
      }}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/datasets-overview-v1.mp4"
    />
  );
}
