import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { CheckIcon, ChevronDown, Code2, Cog, Wand2 } from "lucide-react";
import { api } from "@/src/utils/api";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/src/components/ui/card";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "@/src/components/ui/dialog";
import {
  InputCommand,
  InputCommandEmpty,
  InputCommandGroup,
  InputCommandInput,
  InputCommandItem,
  InputCommandList,
} from "@/src/components/ui/input-command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import Link from "next/link";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { type CreateExperiment } from "@/src/features/experiments/types";
import { MultiStepExperimentForm } from "@/src/features/experiments/components/MultiStepExperimentForm";
import { RemoteExperimentUpsertForm } from "@/src/features/experiments/components/RemoteExperimentUpsertForm";
import { RemoteExperimentTriggerModal } from "@/src/features/experiments/components/RemoteExperimentTriggerModal";
import { useExperimentAccess } from "@/src/features/experiments/hooks/useExperimentAccess";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/utils/tailwind";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const CreateExperimentsForm = ({
  projectId,
  setFormOpen,
  defaultValues = {},
  promptDefault,
  handleExperimentSettled,
  handleExperimentSuccess,
  showSDKRunInfoPage = false,
}: {
  projectId: string;
  setFormOpen: (open: boolean) => void;
  defaultValues?: Partial<Pick<CreateExperiment, "promptId" | "datasetId">>;
  promptDefault?: {
    name: string;
    version: number;
  };
  handleExperimentSuccess?: (data?: {
    success: boolean;
    datasetId: string;
    runId: string;
    runName: string;
  }) => Promise<void>;
  handleExperimentSettled?: (data?: {
    success: boolean;
    datasetId: string;
    runId: string;
    runName: string;
  }) => Promise<void>;
  showSDKRunInfoPage?: boolean;
}) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const capture = usePostHogClientCapture();
  const { isExperimentsBetaActive, isInitializing } = useExperimentAccess();
  const [showPromptForm, setShowPromptForm] = useState(false);
  const [showRemoteExperimentUpsertForm, setShowRemoteExperimentUpsertForm] =
    useState(false);
  const [
    showRemoteExperimentTriggerModal,
    setShowRemoteExperimentTriggerModal,
  ] = useState(false);
  const [datasetPopoverOpen, setDatasetPopoverOpen] = useState(false);

  const hasExperimentWriteAccess = useHasProjectAccess({
    projectId,
    scope: "promptExperiments:CUD",
  });
  const fixedDatasetId = defaultValues.datasetId;
  const [remoteExperimentDataset, setRemoteExperimentDataset] = useState<
    { id: string; name?: string } | undefined
  >(fixedDatasetId ? { id: fixedDatasetId } : undefined);
  const datasetId = fixedDatasetId ?? remoteExperimentDataset?.id;
  const remoteExperimentDatasets = api.datasets.allDatasetMeta.useQuery(
    { projectId },
    {
      enabled:
        showSDKRunInfoPage && !fixedDatasetId && hasExperimentWriteAccess,
      trpc: {
        context: {
          skipBatch: true,
        },
      },
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
    },
  );
  const selectedRemoteExperimentDataset = remoteExperimentDatasets.data?.find(
    (dataset) => dataset.id === remoteExperimentDataset?.id,
  );

  const existingRemoteExperiment = api.datasets.getRemoteExperiment.useQuery(
    {
      projectId,
      datasetId: datasetId as string,
    },
    {
      enabled: !!datasetId,
    },
  );
  const isRemoteExperimentLoading =
    !!datasetId &&
    (existingRemoteExperiment.isLoading || existingRemoteExperiment.isFetching);
  const hasRemoteExperiment = !!existingRemoteExperiment.data;
  const isRemoteExperimentEnabled =
    existingRemoteExperiment.data?.enabled !== false;
  const webhookActionLabel = isRemoteExperimentLoading
    ? tAutoI18n("loading_b04ba49")
    : hasRemoteExperiment
      ? tAutoI18n("run_b1b3926")
      : tAutoI18n("configure_792c81a");

  if (!hasExperimentWriteAccess) {
    return null;
  }

  if (
    existingRemoteExperiment.isLoading &&
    !!datasetId &&
    !showSDKRunInfoPage
  ) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (
    showSDKRunInfoPage &&
    !showPromptForm &&
    !showRemoteExperimentUpsertForm &&
    !showRemoteExperimentTriggerModal
  ) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{tAuto("run_experiment_f8f3222")}</DialogTitle>
          <DialogDescription>
            {tAutoI18n(
              "experiments_allow_you_to_test_iterations_of_your_app_4a12542",
            )}{" "}
            <Link
              href="https://langfuse.com/docs/evaluation/dataset-runs/datasets"
              target="_blank"
              className="underline"
            >
              {tAuto("here_0154c0d")}{" "}
            </Link>
            .
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="pb-8">
          <div className="mt-4 grid grid-cols-2 grid-rows-1 gap-2">
            <Card className="flex flex-1 flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wand2 className="size-4" />
                  {tAuto("via_user_interface_39e4fb2")}{" "}
                </CardTitle>
                <CardDescription>
                  {tAuto(
                    "test_single_prompts_and_model_configurations_via_lan_9000932",
                  )}{" "}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-muted-foreground list-disc space-y-2 pl-4 text-sm">
                  <li>{tAuto("compare_prompt_versions_49992de")}</li>
                  <li>{tAuto("compare_model_configurations_c26f27f")}</li>
                  <li>{tAuto("no_code_required_294b74d")}</li>
                </ul>
              </CardContent>
              <CardFooter className="mt-auto flex flex-row gap-2">
                <Button
                  className="w-full"
                  onClick={() => {
                    setShowPromptForm(true);
                    setShowRemoteExperimentUpsertForm(false);
                    setShowRemoteExperimentTriggerModal(false);
                  }}
                >
                  {tAuto("configure_792c81a")}{" "}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                  onClick={() =>
                    capture("dataset_run:view_prompt_experiment_docs")
                  }
                >
                  <Link href="https://langfuse.com/docs/evaluation/dataset-runs/native-run">
                    {tAuto("view_docs_2205e12")}{" "}
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex flex-1 flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Code2 className="size-4" />
                  {tAuto("via_webhook_069988c")}{" "}
                </CardTitle>
                <CardDescription>
                  {tAuto(
                    "set_up_an_experiment_webhook_to_start_remote_experim_0984ad6",
                  )}{" "}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-muted-foreground list-disc space-y-2 pl-4 text-sm">
                  <li>
                    {tAuto(
                      "run_custom_evaluation_logic_in_your_service_bae8e60",
                    )}
                  </li>
                  <li>
                    {tAuto("keep_experiment_results_in_langfuse_a757aaa")}
                  </li>
                </ul>
                {!fixedDatasetId ? (
                  <div className="mt-4 space-y-2">
                    <div className="text-sm font-bold">
                      {tAuto("dataset_1052689")}
                    </div>
                    <Popover
                      open={datasetPopoverOpen}
                      onOpenChange={setDatasetPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={datasetPopoverOpen}
                          disabled={
                            remoteExperimentDatasets.isPending ||
                            remoteExperimentDatasets.data?.length === 0
                          }
                          className="w-full justify-between px-2 font-normal"
                        >
                          {remoteExperimentDatasets.isPending
                            ? tAutoI18n("loading_datasets_8b3b61a")
                            : (selectedRemoteExperimentDataset?.name ??
                              remoteExperimentDataset?.name ??
                              tAutoI18n("select_a_dataset_c0f85d3"))}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-(--radix-popover-trigger-width) overflow-auto p-0"
                        align="start"
                      >
                        <InputCommand>
                          <InputCommandInput
                            placeholder={tAuto("search_datasets_2edc7dc")}
                            className="h-9"
                            variant="bottom"
                          />
                          <InputCommandList>
                            <InputCommandEmpty>
                              {tAuto("no_dataset_found_48303db")}{" "}
                            </InputCommandEmpty>
                            <InputCommandGroup>
                              {remoteExperimentDatasets.data?.map((dataset) => (
                                <InputCommandItem
                                  key={dataset.id}
                                  value={dataset.name}
                                  onSelect={() => {
                                    setRemoteExperimentDataset({
                                      id: dataset.id,
                                      name: dataset.name,
                                    });
                                    setDatasetPopoverOpen(false);
                                  }}
                                >
                                  {dataset.name}
                                  <CheckIcon
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      dataset.id === datasetId
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                </InputCommandItem>
                              ))}
                            </InputCommandGroup>
                          </InputCommandList>
                        </InputCommand>
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : null}
              </CardContent>
              <CardFooter className="mt-auto flex flex-row gap-2">
                {hasRemoteExperiment && !isRemoteExperimentLoading ? (
                  <div className="flex w-full items-start">
                    <Button
                      className="w-full rounded-r-none"
                      disabled={!datasetId || !isRemoteExperimentEnabled}
                      title={
                        isRemoteExperimentEnabled
                          ? undefined
                          : tAuto("please_edit_and_enable_webhook_ea48bfb")
                      }
                      onClick={() => {
                        if (!datasetId || !isRemoteExperimentEnabled) return;
                        setShowRemoteExperimentTriggerModal(true);
                      }}
                    >
                      {tAuto("run_b1b3926")}{" "}
                    </Button>
                    <Button
                      aria-label={tAuto("edit_remote_trigger_settings_d758c4f")}
                      className="rounded-l-none rounded-r-md border-l-2 px-2"
                      title={tAuto("edit_remote_trigger_settings_d758c4f")}
                      onClick={() => setShowRemoteExperimentUpsertForm(true)}
                    >
                      <Cog className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    disabled={!datasetId || isRemoteExperimentLoading}
                    onClick={() => {
                      if (!datasetId || isRemoteExperimentLoading) return;
                      setShowRemoteExperimentUpsertForm(true);
                    }}
                  >
                    {webhookActionLabel}
                  </Button>
                )}
                <Button
                  className="w-full"
                  variant="outline"
                  asChild
                  onClick={() =>
                    capture("dataset_run:view_custom_experiment_docs")
                  }
                >
                  <Link
                    href="https://langfuse.com/docs/evaluation/dataset-runs/remote-run"
                    target="_blank"
                  >
                    {tAuto("view_docs_2205e12")}{" "}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </DialogBody>
      </>
    );
  }

  if (
    showRemoteExperimentTriggerModal &&
    datasetId &&
    existingRemoteExperiment.data
  ) {
    return (
      <RemoteExperimentTriggerModal
        projectId={projectId}
        datasetId={datasetId}
        remoteExperimentConfig={existingRemoteExperiment.data}
        setShowTriggerModal={setShowRemoteExperimentTriggerModal}
      />
    );
  }

  if (showRemoteExperimentUpsertForm && datasetId) {
    return (
      <RemoteExperimentUpsertForm
        projectId={projectId}
        datasetId={datasetId}
        existingRemoteExperiment={existingRemoteExperiment.data}
        setShowRemoteExperimentUpsertForm={setShowRemoteExperimentUpsertForm}
      />
    );
  }

  return (
    <MultiStepExperimentForm
      projectId={projectId}
      setFormOpen={setFormOpen}
      defaultValues={defaultValues}
      promptDefault={promptDefault}
      handleExperimentSettled={handleExperimentSettled}
      handleExperimentSuccess={handleExperimentSuccess}
      enableLegacyNameValidation={!isInitializing && !isExperimentsBetaActive}
    />
  );
};
