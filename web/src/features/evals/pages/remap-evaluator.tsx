import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import Page from "@/src/components/layouts/page";
import { api } from "@/src/utils/api";
import { InnerEvaluatorForm } from "@/src/features/evals/components/inner-evaluator-form";
import {
  mapLegacyToModernTarget,
  isTraceTarget,
  isEventTarget,
} from "@/src/features/evals/utils/typeHelpers";
import { type PartialConfig } from "@/src/features/evals/types";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/src/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useEvalCapabilities } from "@/src/features/evals/hooks/useEvalCapabilities";
import { DEFAULT_OBSERVATION_FILTER_WHEN_REMAPPING } from "@/src/features/evals/utils/evaluator-constants";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type LegacyEvalAction = "keep-active" | "mark-inactive" | "delete";

export default function RemapEvaluatorPage() {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const evalConfigId = router.query.evaluator as string;

  const evalCapabilities = useEvalCapabilities(projectId);

  const [error, setError] = useState<string | null>(null);
  const [legacyAction, setLegacyAction] =
    useState<LegacyEvalAction>("mark-inactive");

  // Fetch old eval config
  const { data: oldConfig, isLoading: isLoadingConfig } =
    api.evals.configById.useQuery(
      { projectId, id: evalConfigId },
      { enabled: !!projectId && !!evalConfigId },
    );

  // Fetch eval template
  const { data: evalTemplate, isLoading: isLoadingTemplate } =
    api.evals.templateById.useQuery(
      {
        projectId,
        id: oldConfig?.evalTemplateId ?? "",
      },
      { enabled: !!projectId && !!oldConfig?.evalTemplateId },
    );

  const utils = api.useUtils();

  // Update mutation to set old eval to INACTIVE
  const updateJobMutation = api.evals.updateEvalJob.useMutation({
    onSuccess: () => {
      utils.evals.invalidate();
      router.push(`/project/${projectId}/evals`);
    },
    onError: (err) => {
      setError(
        err.message ??
          tAutoI18n("failed_to_update_old_eval_configuration_3029103"),
      );
    },
  });

  // Delete mutation to remove old eval
  const deleteJobMutation = api.evals.deleteEvalJob.useMutation({
    onSuccess: () => {
      utils.evals.invalidate();
      router.push(`/project/${projectId}/evals`);
    },
    onError: (err) => {
      setError(
        err.message ??
          tAutoI18n("failed_to_delete_old_eval_configuration_fbee593"),
      );
    },
  });

  // Map old config to new config with modern target
  // Only copy scoreName - filters and variable mapping will be initialized fresh
  const mappedConfig: PartialConfig | null = useMemo(() => {
    if (!oldConfig) return null;

    return {
      projectId: oldConfig.projectId,
      evalTemplateId: oldConfig.evalTemplateId,
      scoreName: oldConfig.scoreName,
      targetObject: mapLegacyToModernTarget(oldConfig.targetObject),
      jobType: oldConfig.jobType,
      filter:
        oldConfig.targetObject === "trace"
          ? DEFAULT_OBSERVATION_FILTER_WHEN_REMAPPING
          : [],
      variableMapping: [],
      sampling: oldConfig.sampling,
      delay: oldConfig.delay,
      status: "ACTIVE",
      // Always set to NEW for remapped evals - new eval types cannot run on existing data
      timeScope: ["NEW"],
    };
  }, [oldConfig]);

  const handleFormSuccess = async () => {
    if (!oldConfig) return;

    try {
      switch (legacyAction) {
        case "keep-active":
          // Do nothing - both old and new evals will be active
          utils.evals.invalidate();
          router.push(`/project/${projectId}/evals`);
          break;
        case "mark-inactive":
          // Set old eval to INACTIVE
          await updateJobMutation.mutateAsync({
            projectId,
            evalConfigId,
            config: {
              status: "INACTIVE",
            },
          });
          break;
        case "delete":
          // Delete old eval
          await deleteJobMutation.mutateAsync({
            projectId,
            evalConfigId,
          });
          break;
      }
    } catch (err) {
      // Error already handled in mutation onError
      console.error(`Failed to ${legacyAction} old eval:`, err);
    }
  };

  const isLoading = isLoadingConfig || isLoadingTemplate;

  return (
    <Page
      withPadding
      scrollable
      headerProps={{
        title: tAuto("upgrade_evaluator_298c69b"),
        breadcrumb: [
          {
            name: "Running Evaluators",
            href: `/project/${projectId}/evals`,
          },
        ],
      }}
    >
      <div className="space-y-4">
        <div>
          <p className="text-muted-foreground text-sm">
            {tAutoI18n(
              "review_your_legacy_evaluator_on_the_left_and_configu_806cffd",
            )}{" "}
            <a
              href="https://langfuse.com/faq/all/llm-as-a-judge-migration"
              target="_blank"
              rel="noopener noreferrer"
              className="text-dark-blue font-bold hover:opacity-80"
            >
              {tAuto("follow_our_step_by_step_guide_5d57003")}{" "}
            </a>{" "}
            {tAutoI18n("to_upgrade_successfully_28930ee")}{" "}
          </p>
          {mappedConfig ? (
            <Alert
              variant="default"
              className="border-light-yellow bg-light-yellow mt-2"
            >
              <AlertDescription>
                <div className="flex flex-col gap-2">
                  {isEventTarget(mappedConfig.targetObject ?? "event")
                    ? tAutoI18n(
                        "running_observation_targeting_evaluators_requires_js_a1b7208",
                      )
                    : tAutoI18n(
                        "running_observation_targeting_evaluators_requires_js_b8a0ce1",
                      )}
                </div>
              </AlertDescription>
            </Alert>
          ) : null}
        </div>

        <div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-[600px] w-full" />
              <Skeleton className="h-[600px] w-full" />
            </div>
          ) : !oldConfig || !evalTemplate ? (
            <Alert variant="destructive">
              <AlertDescription>
                {tAuto(
                  "failed_to_load_eval_configuration_or_template_5a2a71c",
                )}{" "}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-[1fr_2px_1fr] items-start">
              {/* LEFT: Read-only old config */}
              <div className="space-y-4 p-3">
                <div className="flex items-center gap-2 pb-2">
                  <h3 className="text-lg font-bold">
                    {tAutoI18n("legacy_configuration_c575874")}{" "}
                    {isTraceTarget(oldConfig.targetObject)
                      ? tAutoI18n("runs_on_traces_3822122")
                      : ""}
                  </h3>
                  <span className="text-muted-foreground text-xs">
                    {tAuto("read_only_9b19a5a")}{" "}
                  </span>
                </div>
                <InnerEvaluatorForm
                  projectId={projectId}
                  evalTemplate={evalTemplate}
                  useDialog={false}
                  disabled={true}
                  existingEvaluator={oldConfig}
                  mode="edit"
                  hideTargetSection={false}
                  hideTargetSelection={true}
                  hideAdvancedSettings={true}
                  preventRedirect={true}
                  renderFooter={() => null}
                  evalCapabilities={evalCapabilities}
                />
              </div>

              <Separator orientation="vertical" className="self-stretch" />

              {/* RIGHT: Editable new config form */}
              <div className="space-y-4 p-3">
                <h3 className="pb-2 text-lg font-bold">
                  {tAutoI18n("new_configuration_7624cdf")}{" "}
                  {isTraceTarget(oldConfig.targetObject)
                    ? tAutoI18n("runs_on_observations_dbe8342")
                    : ""}
                </h3>
                <InnerEvaluatorForm
                  projectId={projectId}
                  evalTemplate={evalTemplate}
                  useDialog={false}
                  existingEvaluator={mappedConfig ?? undefined}
                  onFormSuccess={handleFormSuccess}
                  mode="create"
                  hideTargetSection={false}
                  hideTargetSelection={true}
                  preventRedirect={true}
                  hideAdvancedSettings={true}
                  evalCapabilities={evalCapabilities}
                  oldConfigId={evalConfigId}
                  renderFooter={({ isLoading }) => (
                    <div className="flex w-full flex-col items-end gap-4">
                      <div className="flex items-center">
                        <Button
                          type="submit"
                          loading={isLoading}
                          className="mt-3 rounded-l-md rounded-r-none"
                        >
                          {legacyAction === "keep-active"
                            ? tAutoI18n("save_keep_legacy_active_5edb5d9")
                            : legacyAction === "mark-inactive"
                              ? tAutoI18n("save_mark_legacy_inactive_a1beab0")
                              : tAutoI18n("save_delete_legacy_5744558")}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              disabled={isLoading}
                              className="mt-3 rounded-l-none rounded-r-md border-l-2"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setLegacyAction("keep-active")}
                            >
                              {legacyAction === "keep-active" && "✓ "}
                              {tAutoI18n(
                                "save_keep_legacy_active_5edb5d9",
                              )}{" "}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setLegacyAction("mark-inactive")}
                            >
                              {legacyAction === "mark-inactive" && "✓ "}
                              {tAutoI18n(
                                "save_mark_legacy_inactive_a1beab0",
                              )}{" "}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setLegacyAction("delete")}
                            >
                              {legacyAction === "delete" && "✓ "}
                              {tAutoI18n("save_delete_legacy_5744558")}{" "}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </Page>
  );
}
