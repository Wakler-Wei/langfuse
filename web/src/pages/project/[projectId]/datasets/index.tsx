import { useRouter } from "next/router";
import { DatasetsTable } from "@/src/features/datasets/components/DatasetsTable";
import Page from "@/src/components/layouts/page";
import { ButtonWithIcon } from "@/src/components/ButtonWithIcon";
import { DialogTrigger } from "@/src/components/ui/dialog";
import { CreateDatasetDialogController } from "@/src/features/datasets/components/CreateDatasetDialogController";
import { api } from "@/src/utils/api";
import { DatasetsOnboarding } from "@/src/components/onboarding/DatasetsOnboarding";
import { LockIcon, PlusIcon } from "lucide-react";
import { useQueryParam, StringParam } from "use-query-params";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export default function Datasets() {
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const [currentFolderPath] = useQueryParam("folder", StringParam);

  // Check if the project has any datasets
  const { data: hasAnyDataset, isLoading } = api.datasets.hasAny.useQuery(
    { projectId },
    {
      enabled: !!projectId,
      trpc: {
        context: {
          skipBatch: true,
        },
      },
    },
  );

  const showOnboarding = !isLoading && !hasAnyDataset;

  if (showOnboarding) {
    return (
      <Page
        headerProps={{
          title: tAuto("datasets_93a7f22"),
          help: {
            description: tAuto(
              "datasets_in_langfuse_are_a_collection_of_inputs_and__51ad45c",
            ),
            href: "https://langfuse.com/docs/evaluation/dataset-runs/datasets",
          },
        }}
        scrollable
      >
        <DatasetsOnboarding projectId={projectId} />
      </Page>
    );
  }

  return (
    <Page
      headerProps={{
        title: tAuto("datasets_93a7f22"),
        help: {
          description: tAuto(
            "datasets_in_langfuse_are_a_collection_of_inputs_and__51ad45c",
          ),
          href: "https://langfuse.com/docs/evaluation/dataset-runs/datasets",
        },
        actionButtonsRight: (
          <CreateDatasetDialogController
            projectId={projectId}
            target={
              currentFolderPath
                ? { type: "folder", prefix: currentFolderPath }
                : { type: "root" }
            }
          >
            {({ disabled, openDialog }) => (
              <DialogTrigger asChild>
                <ButtonWithIcon
                  size="default"
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
    >
      <DatasetsTable projectId={projectId} />
    </Page>
  );
}
