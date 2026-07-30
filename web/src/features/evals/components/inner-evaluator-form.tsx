import { type UseFormReturn, useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import {
  tracesTableColsWithOptions,
  singleFilter,
  availableTraceEvalVariables,
  datasetFormFilterColsWithOptions,
  observationEvalFilterColsWithOptions,
  experimentEvalFilterColsWithOptions,
  type availableDatasetEvalVariables,
  JobConfigState,
  validateEvaluatorFiltersForTarget,
  evalTraceTableCols,
} from "@langfuse/shared";
import { z } from "zod";
import { useEffect, useMemo, useState, memo } from "react";
import { api } from "@/src/utils/api";
import { InlineFilterBuilder } from "@/src/features/filters/components/filter-builder";
import {
  type EvalTemplate,
  EvalTemplateSourceCodeLanguage,
  variableMapping,
  observationVariableMapping,
} from "@langfuse/shared";
import { useRouter } from "next/router";
import { trpcErrorToast } from "@/src/utils/trpcErrorToast";
import { Slider } from "@/src/components/ui/slider";
import { Card } from "@/src/components/ui/card";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { Checkbox } from "@/src/components/design-system/Checkbox/Checkbox";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import {
  evalConfigFormSchema,
  type EvalFormType,
  getTargetDisplayName,
  inferDefaultMapping,
  type LangfuseObject,
} from "@/src/features/evals/utils/evaluator-form-utils";
import { validateAndTransformVariableMapping } from "@/src/features/evals/utils/variable-mapping-validation";
import { useVariableMappingSync } from "@/src/features/evals/hooks/useVariableMappingSync";
import { EvalTargetObject, EvalTargetObjectSchema } from "@langfuse/shared";
import { ExecutionCountTooltip } from "@/src/features/evals/components/execution-count-tooltip";
import { Suspense, lazy } from "react";
import {
  getDateFromOption,
  type TableDateRange,
} from "@/src/utils/date-range-utils";
import { type PartialConfig } from "@/src/features/evals/types";
import { type EvalCapabilities } from "@/src/features/evals/hooks/useEvalCapabilities";
import { EvalVersionCallout } from "@/src/features/evals/components/eval-version-callout";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";
import {
  BetweenHorizonalStart,
  CircleDot,
  AlertTriangle,
  FlaskConical,
  InfoIcon,
  ListTree,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import {
  isDatasetTarget,
  isEventTarget,
  isExperimentTarget,
  isLegacyEvalTarget,
  isTraceTarget,
} from "@/src/features/evals/utils/typeHelpers";
import {
  useUserFacingTarget,
  useEvaluatorTargetState,
} from "@/src/features/evals/hooks/useEvaluatorTarget";
import {
  DEFAULT_OBSERVATION_FILTER,
  DEFAULT_TRACE_FILTER,
} from "@/src/features/evals/utils/evaluator-constants";
import { useEvalConfigFilterOptions } from "@/src/features/evals/hooks/useEvalConfigFilterOptions";
import { VariableMappingCard } from "@/src/features/evals/components/variable-mapping-card";
import { useV4Beta } from "@/src/features/events/hooks/useV4Beta";
import { useIsCodeEvalEnabled } from "@/src/features/evals/hooks/useIsCodeEvalEnabled";
import {
  getCodeEvalVariableMapping,
  isCodeEvalTemplate,
  resolveCodeEvalTarget,
} from "@/src/features/evals/utils/code-eval-template-utils";
import { CodeEvalTestRunCard } from "@/src/features/evals/components/code-eval-test-run-card";
import { getExperimentEvalPreviewFilters } from "@/src/features/evals/utils/experiment-eval-preview-utils";
import { cn } from "@/src/utils/tailwind";
import { PeekTableStateProvider } from "@/src/components/table/peek/contexts/PeekTableStateContext";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

// Lazy load tables
const TracesTable = lazy(
  () => import("@/src/components/table/use-cases/traces"),
);
const ObservationsTable = lazy(
  () => import("@/src/components/table/use-cases/observations"),
);

const EventsTable = lazy(
  () => import("@/src/features/events/components/EventsTable"),
);

const TracesPreview = memo(
  ({
    projectId,
    filterState,
  }: {
    projectId: string;
    filterState: z.infer<typeof singleFilter>[];
  }) => {
    const tAuto = useAutoTranslations();
    const dateRange = useMemo(() => {
      return {
        from: getDateFromOption({
          filterSource: "TABLE",
          option: "last1Day",
        }),
      } as TableDateRange;
    }, []);

    return (
      <>
        <div className="flex flex-col items-start gap-1">
          <span className="text-sm leading-none font-bold">
            {tAuto("preview_sample_matched_traces_21b97d2")}{" "}
          </span>
          <FormDescription>
            {tAuto(
              "sample_over_the_last_24_hours_that_match_these_filte_d8460c7",
            )}{" "}
          </FormDescription>
        </div>
        <div className="mb-4 flex max-h-[30dvh] w-full flex-col overflow-hidden border-r border-b border-l">
          <Suspense fallback={<Skeleton className="h-[30dvh] w-full" />}>
            {/* Match peek tables: preview state stays local and never touches the URL. */}
            <PeekTableStateProvider>
              <TracesTable
                projectId={projectId}
                hideControls
                externalFilterState={filterState}
                externalDateRange={dateRange}
                limitRows={10}
              />
            </PeekTableStateProvider>
          </Suspense>
        </div>
      </>
    );
  },
);

TracesPreview.displayName = "TracesPreview";

const ObservationsPreview = memo(
  ({
    projectId,
    filterState,
    isNewCompatible,
    compatibilityCheckWasPerformed,
  }: {
    projectId: string;
    filterState: z.infer<typeof singleFilter>[];
    isNewCompatible: boolean;
    compatibilityCheckWasPerformed: boolean;
  }) => {
    const tAutoI18n = useAutoTranslations();
    const tAuto = useAutoTranslations();
    const { isBetaEnabled } = useV4Beta();

    const dateRange = useMemo(() => {
      return {
        from: getDateFromOption({
          filterSource: "TABLE",
          option: "last1Day",
        }),
      } as TableDateRange;
    }, []);

    // Show upgrade message only when SDK check was performed and user is not on OTEL SDK
    const showSdkUpgradeMessage =
      compatibilityCheckWasPerformed && !isNewCompatible;

    return (
      <>
        <div className="flex flex-col items-start gap-1">
          <FormDescription>
            {tAuto(
              "sample_over_the_last_24_hours_that_match_filters_da795c5",
            )}{" "}
          </FormDescription>
        </div>
        <div className="mb-4 flex max-h-[30dvh] w-full flex-col overflow-hidden border-r border-b border-l">
          <Suspense fallback={<Skeleton className="h-[30dvh] w-full" />}>
            {showSdkUpgradeMessage ? (
              <div className="flex h-[30dvh] flex-col items-center justify-center gap-2 border-t p-4 text-center">
                <AlertTriangle className="text-dark-yellow h-8 w-8" />
                <div className="flex flex-col gap-1">
                  <span className="text-foreground font-bold">
                    {tAuto("please_verify_your_sdk_version_d6fd5a1")}{" "}
                  </span>
                  <span className="text-muted-foreground max-w-md text-sm">
                    {tAutoI18n(
                      "we_did_not_find_any_data_ingested_with_langfuse_otel_bc02a20",
                    )}{" "}
                    <a
                      href="https://langfuse.com/docs/observability/sdk/upgrade-path"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-dark-blue font-bold hover:opacity-80"
                    >
                      {tAuto("learn_more_824d76b")}{" "}
                    </a>
                    .
                  </span>
                </div>
              </div>
            ) : (
              // Keep the evaluator preview isolated from the parent route's table state.
              <PeekTableStateProvider>
                {isBetaEnabled ? (
                  <EventsTable
                    projectId={projectId}
                    hideControls
                    externalFilterState={filterState}
                    externalDateRange={dateRange}
                    limitRows={10}
                  />
                ) : (
                  <ObservationsTable
                    projectId={projectId}
                    hideControls
                    externalFilterState={filterState}
                    externalDateRange={dateRange}
                    limitRows={10}
                  />
                )}
              </PeekTableStateProvider>
            )}
          </Suspense>
        </div>
      </>
    );
  },
);

ObservationsPreview.displayName = "ObservationsPreview";

function getCodeEvalSourceLanguageLabel(
  sourceCodeLanguage: EvalTemplate["sourceCodeLanguage"],
) {
  return sourceCodeLanguage === EvalTemplateSourceCodeLanguage.PYTHON
    ? "Python"
    : "TypeScript";
}

function CodeEvalSourceLink({
  projectId,
  evalTemplate,
}: {
  projectId: string;
  evalTemplate: EvalTemplate;
}) {
  const tAuto = useAutoTranslations();
  const sourceCodeLanguage =
    evalTemplate.sourceCodeLanguage ??
    EvalTemplateSourceCodeLanguage.TYPESCRIPT;
  const languageLabel = getCodeEvalSourceLanguageLabel(sourceCodeLanguage);

  const editButton = evalTemplate.projectId ? (
    <Button asChild variant="outline">
      <Link
        href={`/project/${projectId}/evals/templates/${evalTemplate.id}?mode=edit`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {tAuto("edit_source_code_8f15dfd")}{" "}
        <ExternalLink className="ml-1 h-3.5 w-3.5" />
      </Link>
    </Button>
  ) : (
    <Button
      variant="outline"
      disabled
      title={tAuto("only_user_managed_templates_can_be_edited_ad591df")}
    >
      {tAuto("edit_source_code_8f15dfd")}{" "}
      <ExternalLink className="ml-1 h-3.5 w-3.5" />
    </Button>
  );

  return (
    <div className="bg-muted/20 flex max-w-[500px] items-center justify-between gap-3 rounded-md border px-3 py-2">
      <span className="text-muted-foreground text-sm">{languageLabel}</span>
      {editButton}
    </div>
  );
}

const EMPTY_FILTER_STATE: z.infer<typeof singleFilter>[] = [];

export const InnerEvaluatorForm = (props: {
  projectId: string;
  evalTemplate: EvalTemplate;
  useDialog: boolean;
  disabled?: boolean;
  existingEvaluator?: PartialConfig;
  onFormSuccess?: () => void;
  shouldWrapVariables?: boolean;
  mode?: "create" | "edit";
  hideTargetSection?: boolean;
  preventRedirect?: boolean;
  preprocessFormValues?: (values: any) => any;
  hideAdvancedSettings?: boolean;
  hideTargetSelection?: boolean;
  hidePreviewTable?: boolean;
  evalCapabilities: EvalCapabilities;
  defaultRunOnLive?: boolean;
  defaultTarget?: EvalTargetObject;
  renderFooter?: (params: { isLoading: boolean }) => React.ReactNode;
  oldConfigId?: string;
}) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const capture = usePostHogClientCapture();
  const router = useRouter();
  const [showTraceConfirmDialog, setShowTraceConfirmDialog] = useState(false);
  const { isBetaEnabled } = useV4Beta();
  const { enabled: isCodeEvalEnabled } = useIsCodeEvalEnabled();
  const isCodeEvalConfig =
    isCodeEvalEnabled && isCodeEvalTemplate(props.evalTemplate);

  // Destructure eval capabilities passed from parent
  const { allowLegacy } = props.evalCapabilities;

  // Existing legacy evaluators must keep rendering their (read-only) legacy
  // target UI in edit mode even when new legacy setups are not allowed.
  const showLegacyTargetOptions =
    allowLegacy ||
    (props.mode === "edit" &&
      isLegacyEvalTarget(props.existingEvaluator?.targetObject ?? ""));

  // Custom hooks for managing evaluator state
  const {
    userFacingTarget,
    setUserFacingTarget,
    useOtelDataForExperiment,
    setUseOtelDataForExperiment,
  } = useUserFacingTarget(props.existingEvaluator?.targetObject);

  const {
    traceFilterOptions,
    observationEvalFilterOptions,
    experimentEvalFilterOptions,
    datasetFilterOptions,
  } = useEvalConfigFilterOptions({ projectId: props.projectId });

  const targetState = useEvaluatorTargetState();

  // Check if existing trace evaluator has invalid filters (e.g., score filters added by bug ff4b03c0b)
  const hasInvalidTraceFilters = useMemo(() => {
    if (
      !props.existingEvaluator?.filter ||
      props.existingEvaluator.targetObject !== EvalTargetObject.TRACE
    ) {
      return false;
    }
    const validation = validateEvaluatorFiltersForTarget({
      targetObject: EvalTargetObject.TRACE,
      filter: props.existingEvaluator.filter,
    });
    return !validation.isValid;
  }, [props.existingEvaluator?.filter, props.existingEvaluator?.targetObject]);

  const defaultTargetResult = EvalTargetObjectSchema.safeParse(
    props.existingEvaluator?.targetObject ??
      props.defaultTarget ??
      EvalTargetObject.EVENT,
  );
  const parsedDefaultTarget = defaultTargetResult.success
    ? defaultTargetResult.data
    : EvalTargetObject.EVENT;
  const defaultTarget = isCodeEvalConfig
    ? resolveCodeEvalTarget(parsedDefaultTarget)
    : parsedDefaultTarget;

  const getDefaultMapping = () => {
    if (isCodeEvalConfig) {
      return getCodeEvalVariableMapping();
    }

    if (props.existingEvaluator?.variableMapping) {
      return isEventTarget(props.existingEvaluator.targetObject) ||
        isExperimentTarget(props.existingEvaluator.targetObject)
        ? z
            .array(observationVariableMapping)
            .parse(props.existingEvaluator.variableMapping)
        : z
            .array(variableMapping)
            .parse(props.existingEvaluator.variableMapping);
    }

    return z.array(variableMapping).parse(
      props.evalTemplate
        ? props.evalTemplate.vars.map((v) => ({
            templateVariable: v,
            langfuseObject: "trace" as const,
            objectName: null,
            selectedColumnId: "input",
            jsonSelector: null,
          }))
        : [],
    );
  };

  const form = useForm({
    resolver: zodResolver(evalConfigFormSchema),
    disabled: props.disabled,
    defaultValues: {
      scoreName:
        props.existingEvaluator?.scoreName ?? `${props.evalTemplate.name}`,
      target: defaultTarget,
      filter: props.existingEvaluator?.filter
        ? z.array(singleFilter).parse(props.existingEvaluator.filter)
        : defaultTarget === EvalTargetObject.TRACE
          ? // For new trace evaluators, exclude internal environments by default
            DEFAULT_TRACE_FILTER
          : defaultTarget === EvalTargetObject.EVENT
            ? // For new observation evaluators, default to GENERATION type
              DEFAULT_OBSERVATION_FILTER
            : [],
      mapping: getDefaultMapping(),
      sampling: props.existingEvaluator?.sampling
        ? props.existingEvaluator.sampling.toNumber()
        : 1,
      delay: props.existingEvaluator?.delay
        ? props.existingEvaluator.delay / 1000
        : 30,
      timeScope: (props.existingEvaluator?.timeScope ?? ["NEW"]).filter(
        (option): option is "NEW" | "EXISTING" =>
          ["NEW", "EXISTING"].includes(option),
      ),
      runOnLive: props.existingEvaluator
        ? props.existingEvaluator.status === "ACTIVE"
        : (props.defaultRunOnLive ?? true),
    },
  }) as UseFormReturn<EvalFormType>;

  const currentMapping = form.watch("mapping") ?? [];
  const syncStatus = useVariableMappingSync({
    templateVars: isCodeEvalConfig ? [] : props.evalTemplate?.vars,
    currentMapping: currentMapping,
  });

  useEffect(() => {
    if (!props.evalTemplate) return;
    if (isCodeEvalConfig) return;

    const mapping = form.getValues("mapping");

    if (mapping.length === 0 && props.evalTemplate.vars.length > 0) {
      // Initialize mapping for new evaluators (only if there are vars to map)
      const target = form.getValues("target");
      form.setValue(
        "mapping",
        props.evalTemplate.vars.map((v) => ({
          templateVariable: v,
          langfuseObject: isLegacyEvalTarget(target)
            ? ("trace" as const)
            : undefined,
          ...inferDefaultMapping(v),
        })),
      );
      form.setValue("scoreName", `${props.evalTemplate.name}`);
    } else if (
      props.existingEvaluator &&
      !props.disabled &&
      !syncStatus.inSync
    ) {
      // Reconcile mapping when edit mode is enabled
      const target = form.getValues("target");

      // Keep mappings for unchanged variables
      const preservedMappings = mapping.filter((m) =>
        syncStatus.unchanged.includes(m.templateVariable),
      );

      // Add mappings for new variables
      const newMappings = syncStatus.added.map((varName) => ({
        templateVariable: varName,
        langfuseObject: isLegacyEvalTarget(target)
          ? ("trace" as const)
          : undefined,
        ...inferDefaultMapping(varName),
      }));

      // Combine and update form
      form.setValue("mapping", [...preservedMappings, ...newMappings]);
    }
  }, [
    form,
    props.evalTemplate,
    props.disabled,
    props.existingEvaluator,
    syncStatus,
    isCodeEvalConfig,
  ]);

  const utils = api.useUtils();
  const createJobMutation = api.evals.createJob.useMutation({
    onSuccess: () => utils.models.invalidate(),
    // Defining onError replaces the react-query default that shows the
    // standard error toast, so trigger it explicitly.
    onError: trpcErrorToast,
  });
  const updateJobMutation = api.evals.updateEvalJob.useMutation({
    onSuccess: () => utils.evals.invalidate(),
    onError: trpcErrorToast,
  });
  const [availableVariables, setAvailableVariables] = useState<
    typeof availableTraceEvalVariables | typeof availableDatasetEvalVariables
  >(() =>
    targetState.getAvailableVariables(
      props.existingEvaluator?.targetObject ?? EvalTargetObject.EVENT,
    ),
  );

  const watchedTarget = form.watch("target");
  const watchedScoreName = form.watch("scoreName");
  const watchedFilter = form.watch("filter") ?? EMPTY_FILTER_STATE;
  const shouldShowExperimentEventsPreview =
    isExperimentTarget(watchedTarget) && isBetaEnabled;
  const shouldShowEventsPreview =
    isEventTarget(watchedTarget) || shouldShowExperimentEventsPreview;
  const previewTableVisible = !props.disabled && !props.hidePreviewTable;
  const previewAlreadyShowsSdkWarning =
    previewTableVisible && shouldShowEventsPreview;
  const eventsPreviewFilterState = useMemo(
    () =>
      shouldShowExperimentEventsPreview
        ? getExperimentEvalPreviewFilters(watchedFilter)
        : watchedFilter,
    [shouldShowExperimentEventsPreview, watchedFilter],
  );

  // Clear mapping error if user switches away from trace target
  useEffect(() => {
    if (
      !isTraceTarget(watchedTarget) &&
      form.formState.errors.mapping?.type === "manual"
    ) {
      form.clearErrors("mapping");
    }
  }, [watchedTarget, form]);

  function onSubmit(values: z.infer<typeof evalConfigFormSchema>) {
    capture(
      props.mode === "edit"
        ? "eval_config:update"
        : "eval_config:new_form_submit",
    );

    // Apply preprocessFormValues if it exists
    if (props.preprocessFormValues) {
      values = props.preprocessFormValues(values);
    }

    const validatedFilter = z.array(singleFilter).safeParse(values.filter);

    if (
      props.existingEvaluator?.timeScope.includes("EXISTING") &&
      props.mode === "edit" &&
      !values.timeScope.includes("EXISTING")
    ) {
      form.setError("timeScope", {
        type: "manual",
        message:
          "The evaluator ran on existing traces already. This cannot be changed anymore.",
      });
      return;
    }
    if (form.getValues("timeScope").length === 0) {
      form.setError("timeScope", {
        type: "manual",
        message: "Please select at least one.",
      });
      return;
    }

    if (validatedFilter.success === false) {
      form.setError("filter", {
        type: "manual",
        message: "Please fill out all filter fields",
      });
      return;
    }

    if (
      isCodeEvalConfig &&
      !isEventTarget(values.target) &&
      !isExperimentTarget(values.target)
    ) {
      form.setError("target", {
        type: "manual",
        message: "Code evaluators can only run on observations or experiments.",
      });
      return;
    }

    // Block NEW trace-level evals that target observations
    if (
      !isCodeEvalConfig &&
      props.mode !== "edit" &&
      isTraceTarget(values.target) &&
      values.mapping.some(
        (m) => m.langfuseObject && m.langfuseObject !== "trace",
      )
    ) {
      form.setError("mapping", {
        type: "manual",
        message:
          "Trace-level evaluators targeting observations are no longer supported. Please use observation-level evaluators or target trace IO instead.",
      });
      return;
    }

    const validatedVarMapping = isCodeEvalConfig
      ? {
          success: true as const,
          data: getCodeEvalVariableMapping(),
        }
      : validateAndTransformVariableMapping(
          values.mapping,
          values.target as EvalTargetObject,
        );

    if (!validatedVarMapping.success) {
      form.setError("mapping", {
        type: "manual",
        message: validatedVarMapping.error,
      });
      return;
    }

    const delay = values.delay * 1000; // convert to ms
    const sampling = values.sampling;
    const mapping = validatedVarMapping.data;
    const filter = validatedFilter.data;
    const scoreName = values.scoreName;

    // For modern targets, derive status from runOnLive
    const isModern = !isLegacyEvalTarget(values.target);
    const status = isModern
      ? values.runOnLive
        ? JobConfigState.ACTIVE
        : JobConfigState.INACTIVE
      : undefined;

    (props.mode === "edit" && props.existingEvaluator?.id
      ? updateJobMutation.mutateAsync({
          projectId: props.projectId,
          evalConfigId: props.existingEvaluator.id,
          config: {
            delay,
            filter,
            variableMapping: mapping,
            sampling,
            scoreName,
            timeScope: isModern ? ["NEW"] : values.timeScope,
            ...(status ? { status } : {}),
          },
        })
      : createJobMutation.mutateAsync({
          projectId: props.projectId,
          target: values.target,
          evalTemplateId: props.evalTemplate.id,
          scoreName,
          filter,
          mapping,
          sampling,
          delay,
          timeScope: isModern ? ["NEW"] : values.timeScope,
          ...(status ? { status } : {}),
        })
    )
      .then(() => {
        props.onFormSuccess?.();

        if (props.mode !== "edit" && !props.preventRedirect) {
          router.push(`/project/${props.projectId}/evals`);
          // Don't reset form when redirecting - it will unmount anyway
        } else {
          // Only reset form when NOT redirecting
          form.reset();
        }
      })
      .catch((error) => {
        // Mutation failures are surfaced via the onError toast; this catch
        // also swallows post-success errors (onFormSuccess, router.push),
        // so keep a console trace for those.
        console.error("Evaluator form submission failed", error);
      });
  }

  function handleAndResolveTarget(value: string) {
    const newUserFacingTarget = value as
      | "trace"
      | "event"
      | "offline-experiment";

    if (newUserFacingTarget === userFacingTarget) {
      return;
    }

    // Show dialog when clicking trace if user has no legacy evals
    if (
      newUserFacingTarget === "trace" &&
      !props.evalCapabilities.hasLegacyEvals &&
      props.mode !== "edit"
    ) {
      setShowTraceConfirmDialog(true);
      return;
    }

    // Update user-facing target
    setUserFacingTarget(newUserFacingTarget);

    // Determine the actual target based on selection
    let actualTarget: EvalTargetObject;
    if (newUserFacingTarget === "trace") {
      actualTarget = EvalTargetObject.TRACE;
    } else if (newUserFacingTarget === "event") {
      actualTarget = EvalTargetObject.EVENT;
    } else {
      // offline-experiment: code evaluators always use the observation-backed experiment target
      actualTarget = isCodeEvalConfig
        ? EvalTargetObject.EXPERIMENT
        : useOtelDataForExperiment
          ? EvalTargetObject.EXPERIMENT
          : EvalTargetObject.DATASET;
    }

    // Transform variable mapping for new target type
    const currentMapping = form.getValues("mapping");
    const newMapping = isCodeEvalConfig
      ? getCodeEvalVariableMapping()
      : targetState.transformMapping(currentMapping, actualTarget);

    // Update form state with target-appropriate default filters
    form.setValue(
      "filter",
      actualTarget === EvalTargetObject.TRACE
        ? DEFAULT_TRACE_FILTER
        : actualTarget === EvalTargetObject.EVENT
          ? DEFAULT_OBSERVATION_FILTER
          : [],
    );
    form.setValue("mapping", newMapping);
    form.setValue("runOnLive", props.defaultRunOnLive ?? true);
    setAvailableVariables(targetState.getAvailableVariables(actualTarget));
    return actualTarget;
  }

  const shouldShowCodeEvalTestPanel =
    isCodeEvalConfig &&
    !props.disabled &&
    (isEventTarget(watchedTarget) ||
      (isExperimentTarget(watchedTarget) && isBetaEnabled));
  const shouldShowCodeEvalSourceLinkInSettingsCard =
    isCodeEvalConfig &&
    !props.disabled &&
    isExperimentTarget(watchedTarget) &&
    !isBetaEnabled;

  const formBody = (
    <div
      className={cn(
        "grid gap-4",
        shouldShowCodeEvalTestPanel &&
          "xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] xl:items-start",
      )}
    >
      <div className={cn(shouldShowCodeEvalTestPanel && "xl:col-span-2")}>
        <FormField
          control={form.control}
          name="scoreName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tAuto("generated_score_name_d10cd7a")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {!props.hideTargetSection && (
        <Card className="flex max-w-full flex-col gap-2 overflow-y-auto p-4">
          {hasInvalidTraceFilters && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {tAuto("unsupported_filter_detected_0f1ea78")}
              </AlertTitle>
              <AlertDescription>
                {tAuto(
                  "this_evaluator_has_a_filter_that_is_not_supported_fo_d29fbda",
                )}{" "}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-4">
            {!props.hideTargetSelection && (
              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {tAutoI18n("run_on_c58e8a1")}{" "}
                      {props.mode === "edit" && (
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoIcon className="text-muted-foreground size-3" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[200px] p-2">
                            <span className="leading-4">
                              An evaluator&apos;s target data may only be
                              configured at creation.
                            </span>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Tabs
                        value={userFacingTarget}
                        onValueChange={(value) => {
                          const actualTarget = handleAndResolveTarget(value);
                          if (actualTarget) {
                            field.onChange(actualTarget);
                          }
                        }}
                      >
                        <TabsList className="grid w-fit max-w-fit grid-flow-col gap-4">
                          <TabsTrigger
                            value="event"
                            disabled={props.disabled || props.mode === "edit"}
                            className="min-w-[100px] gap-1.5"
                          >
                            <CircleDot className="h-3.5 w-3.5" />
                            {tAuto("observations_461ebaa")}{" "}
                          </TabsTrigger>
                          {showLegacyTargetOptions && (
                            <TabsTrigger
                              value="trace"
                              disabled={props.disabled || props.mode === "edit"}
                              className="min-w-[100px] gap-1.5"
                            >
                              <ListTree className="h-3.5 w-3.5" />
                              {tAuto("traces_194e807")}{" "}
                              <Badge
                                variant="secondary"
                                size="sm"
                                className="border-border border font-normal"
                              >
                                {tAuto("legacy_fb74bca")}{" "}
                              </Badge>
                            </TabsTrigger>
                          )}
                          <TabsTrigger
                            value="offline-experiment"
                            disabled={props.disabled || props.mode === "edit"}
                            className="min-w-[100px] gap-1.5"
                          >
                            <FlaskConical className="h-3.5 w-3.5" />
                            {tAuto("experiments_e8f296b")}{" "}
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Second tab bar for experiment data source selection */}
            {!props.hideTargetSelection &&
              userFacingTarget === "offline-experiment" &&
              showLegacyTargetOptions && (
                <div className="flex flex-col gap-2">
                  <FormLabel className="text-sm">
                    {tAuto("experiment_method_197c960")}
                  </FormLabel>
                  <Tabs
                    value={useOtelDataForExperiment ? "otel" : "non-otel"}
                    onValueChange={(value) => {
                      // Don't allow changes in edit mode or disabled mode
                      if (props.mode === "edit" || props.disabled) {
                        return;
                      }

                      const useOtel = value === "otel";
                      setUseOtelDataForExperiment(useOtel);

                      // Update the actual form target: only use EXPERIMENT if beta is enabled
                      const actualTarget = useOtel
                        ? EvalTargetObject.EXPERIMENT
                        : EvalTargetObject.DATASET;
                      form.setValue("target", actualTarget);

                      // Transform variable mapping for new target type
                      const currentMapping = form.getValues("mapping");
                      const newMapping = targetState.transformMapping(
                        currentMapping,
                        actualTarget,
                      );

                      // Update form state
                      form.setValue("filter", []);
                      form.setValue("mapping", newMapping);
                      setAvailableVariables(
                        targetState.getAvailableVariables(actualTarget),
                      );
                    }}
                  >
                    <TabsList className="grid w-fit max-w-fit grid-flow-col gap-4">
                      <TabsTrigger
                        value="otel"
                        className="min-w-[100px] gap-1.5"
                        disabled={props.mode === "edit" || props.disabled}
                      >
                        <FlaskConical className="h-3.5 w-3.5" />
                        {tAuto("experiment_runner_sdk_ecfb7ff")}{" "}
                      </TabsTrigger>
                      <TabsTrigger
                        value="non-otel"
                        className="min-w-[100px] gap-1.5"
                        disabled={props.mode === "edit" || props.disabled}
                      >
                        <BetweenHorizonalStart className="h-3.5 w-3.5" />
                        {tAuto("low_level_sdk_methods_cf69319")}{" "}
                        <Badge
                          variant="secondary"
                          size="sm"
                          className="border-border border font-normal"
                        >
                          {tAuto("legacy_fb74bca")}{" "}
                        </Badge>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}

            {!props.hideTargetSelection &&
              props.mode !== "edit" &&
              !props.disabled &&
              !previewAlreadyShowsSdkWarning && (
                <EvalVersionCallout
                  targetObject={watchedTarget}
                  evalCapabilities={props.evalCapabilities}
                />
              )}

            {!props.hideAdvancedSettings &&
              isLegacyEvalTarget(form.watch("target")) && (
                <FormField
                  control={form.control}
                  name="timeScope"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{tAuto("evaluate_d713258")}</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-2">
                          <div className="flex space-x-2">
                            <Checkbox
                              id="newObjects"
                              checked={field.value.includes("NEW")}
                              onCheckedChange={(checked) => {
                                const newValue = checked
                                  ? [...field.value, "NEW"]
                                  : field.value.filter((v) => v !== "NEW");
                                field.onChange(newValue);
                              }}
                              disabled={props.disabled}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label
                                htmlFor="newObjects"
                                className="text-sm leading-none font-bold peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {tAutoI18n("new_6403f2b")}{" "}
                                {getTargetDisplayName(form.watch("target"))}
                              </label>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Checkbox
                              id="existingObjects"
                              checked={field.value.includes("EXISTING")}
                              onCheckedChange={(checked) => {
                                const newValue = checked
                                  ? [...field.value, "EXISTING"]
                                  : field.value.filter((v) => v !== "EXISTING");
                                field.onChange(newValue);
                              }}
                              disabled={
                                props.disabled ||
                                (props.mode === "edit" &&
                                  field.value.includes("EXISTING"))
                              }
                            />
                            <div className="flex items-center gap-1.5 leading-none">
                              <label
                                htmlFor="existingObjects"
                                className="text-sm leading-none font-bold peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {tAutoI18n("existing_0a6f321")}{" "}
                                {getTargetDisplayName(form.watch("target"))}
                              </label>
                              {field.value.includes("EXISTING") &&
                                !props.disabled &&
                                (props.mode === "edit" ? (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <InfoIcon className="text-muted-foreground size-3" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[300px] p-2">
                                      <span className="leading-4">
                                        {tAutoI18n(
                                          "this_evaluator_has_already_run_on_existing_7c3926c",
                                        )}{" "}
                                        {getTargetDisplayName(
                                          form.watch("target"),
                                        )}{" "}
                                        {tAutoI18n(
                                          "once_set_up_a_new_evaluator_to_re_run_on_existing_b18844a",
                                        )}{" "}
                                        {getTargetDisplayName(
                                          form.watch("target"),
                                        )}
                                        .
                                      </span>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <ExecutionCountTooltip
                                    projectId={props.projectId}
                                    item={form.watch("target")}
                                    filter={form.watch("filter")}
                                  />
                                ))}
                            </div>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

            {/* Run on Live toggle for modern (non-legacy) targets */}
            {!props.hideAdvancedSettings &&
              !isLegacyEvalTarget(form.watch("target")) && (
                <FormField
                  control={form.control}
                  name="runOnLive"
                  render={({ field }) => {
                    const target = form.watch("target");
                    return (
                      <div className="flex max-w-4xl flex-col gap-2">
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>
                              {isEventTarget(target)
                                ? tAutoI18n(
                                    "run_on_live_incoming_observations_5fefa38",
                                  )
                                : tAutoI18n("run_on_new_experiments_aeaeb50")}
                            </FormLabel>
                            <FormDescription>
                              {tAutoI18n(
                                "automatically_evaluate_new_incoming_fe919df",
                              )}{" "}
                              {getTargetDisplayName(target)}.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={props.disabled}
                            />
                          </FormControl>
                        </FormItem>
                        {!field.value && isEventTarget(target) && (
                          <p className="text-muted-foreground text-xs">
                            {tAutoI18n(
                              "this_evaluator_can_still_be_used_for_batched_evaluat_715773e",
                            )}{" "}
                            <a
                              href="https://langfuse.com/docs/evaluation/evaluation-methods/llm-as-a-judge"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-dark-blue hover:opacity-80"
                            >
                              {tAuto("read_the_docs_d4a74b5")}{" "}
                            </a>
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
              )}

            {(isLegacyEvalTarget(form.watch("target")) ||
              form.watch("runOnLive")) && (
              <>
                <FormField
                  control={form.control}
                  name="filter"
                  render={({ field }) => {
                    const target = form.watch("target");

                    // Get appropriate columns based on target type
                    const getFilterColumns = () => {
                      if (isEventTarget(target)) {
                        // Event evaluators - use observation columns
                        return observationEvalFilterColsWithOptions(
                          observationEvalFilterOptions,
                        );
                      } else if (isTraceTarget(target)) {
                        return tracesTableColsWithOptions(
                          traceFilterOptions,
                          evalTraceTableCols,
                        );
                      } else if (isExperimentTarget(target)) {
                        // Experiment evaluators - only dataset filter
                        return experimentEvalFilterColsWithOptions(
                          experimentEvalFilterOptions,
                        );
                      }
                      // dataset (legacy non-OTEL experiments)
                      return datasetFormFilterColsWithOptions(
                        datasetFilterOptions,
                      );
                    };

                    const hasFilters = field.value && field.value.length > 0;

                    return (
                      <FormItem>
                        <FormLabel>{tAuto("filter_d7decf1")}</FormLabel>
                        <FormControl>
                          <div className="max-w-[500px]">
                            {props.disabled && !hasFilters ? (
                              <p className="text-muted-foreground text-xs">
                                {tAutoI18n("all_6a72085")}{" "}
                                {getTargetDisplayName(target)}{" "}
                                {tAutoI18n("will_be_evaluated_e4bfc86")}{" "}
                              </p>
                            ) : (
                              <InlineFilterBuilder
                                key={target}
                                columnIdentifier={
                                  isDatasetTarget(target) ||
                                  isTraceTarget(target)
                                    ? "name"
                                    : "id"
                                }
                                columns={getFilterColumns()}
                                filterState={field.value ?? []}
                                onChange={(
                                  value: z.infer<typeof singleFilter>[],
                                ) => {
                                  field.onChange(value);
                                  if (router.query.traceId) {
                                    const { traceId, ...otherParams } =
                                      router.query;
                                    router.replace(
                                      {
                                        pathname: router.pathname,
                                        query: otherParams,
                                      },
                                      undefined,
                                      { shallow: true },
                                    );
                                  }
                                }}
                                disabled={props.disabled}
                                columnsWithCustomSelect={
                                  isTraceTarget(target)
                                    ? ["traceTags", "traceName"]
                                    : isEventTarget(target)
                                      ? ["tags", "name", "calledToolNames"]
                                      : undefined
                                }
                              />
                            )}
                          </div>
                        </FormControl>
                        {!props.disabled && !hasFilters && (
                          <div className="flex max-w-[500px] gap-1">
                            <AlertTriangle className="text-dark-yellow h-4 w-4" />
                            <AlertDescription className="text-dark-yellow">
                              {tAutoI18n(
                                "no_filters_set_this_evaluator_will_run_on_all_c82abe5",
                              )}{" "}
                              {getTargetDisplayName(target)}.
                            </AlertDescription>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Preview based on target type */}
                {previewTableVisible && (
                  <>
                    {isTraceTarget(form.watch("target")) && (
                      <TracesPreview
                        projectId={props.projectId}
                        filterState={watchedFilter}
                      />
                    )}

                    {shouldShowEventsPreview && (
                      <ObservationsPreview
                        projectId={props.projectId}
                        filterState={eventsPreviewFilterState}
                        isNewCompatible={props.evalCapabilities.isNewCompatible}
                        compatibilityCheckWasPerformed={
                          props.evalCapabilities.compatibilityCheckWasPerformed
                        }
                      />
                    )}
                  </>
                )}

                {!props.hideAdvancedSettings && (
                  <>
                    <FormField
                      control={form.control}
                      name="sampling"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tAuto("sampling_741d6c4")}</FormLabel>
                          <FormControl>
                            <div className="max-w-[500px]">
                              <Slider
                                disabled={props.disabled}
                                min={0}
                                max={1}
                                step={0.0001}
                                value={[field.value]}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                                showInput={true}
                                displayAsPercentage={true}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {isLegacyEvalTarget(form.watch("target")) && (
                      <FormField
                        control={form.control}
                        name="delay"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {tAuto("delay_seconds_db0e07c")}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min={0} />
                            </FormControl>
                            <FormDescription>
                              {tAuto(
                                "time_between_first_trace_dataset_run_event_and_evalu_769fd02",
                              )}{" "}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}
                {shouldShowCodeEvalSourceLinkInSettingsCard ? (
                  <CodeEvalSourceLink
                    projectId={props.projectId}
                    evalTemplate={props.evalTemplate}
                  />
                ) : null}
              </>
            )}
          </div>
        </Card>
      )}
      {shouldShowCodeEvalTestPanel ? (
        <CodeEvalTestRunCard
          projectId={props.projectId}
          evalTemplate={props.evalTemplate}
          target={watchedTarget}
          scoreName={watchedScoreName}
          disabled={props.disabled}
          enableExecutionTracePeek={!props.existingEvaluator}
        />
      ) : isCodeEvalConfig ? null : (
        <VariableMappingCard
          projectId={props.projectId}
          availableVariables={availableVariables}
          evalTemplate={props.evalTemplate}
          form={form}
          disabled={props.disabled}
          shouldWrapVariables={props.shouldWrapVariables}
          hideAdvancedSettings={props.hideAdvancedSettings}
          oldConfigId={props.oldConfigId}
          isNewCompatible={props.evalCapabilities.isNewCompatible}
          compatibilityCheckWasPerformed={
            props.evalCapabilities.compatibilityCheckWasPerformed
          }
        />
      )}
    </div>
  );

  const mutationIsLoading =
    createJobMutation.isPending || updateJobMutation.isPending;

  const formFooter = props.renderFooter ? (
    props.renderFooter({ isLoading: mutationIsLoading })
  ) : (
    <div className="flex w-full flex-col items-end gap-4">
      {!props.disabled ? (
        <Button
          type="submit"
          loading={mutationIsLoading}
          className="mt-3 max-w-fit"
        >
          {props.mode === "edit"
            ? tAutoI18n("update_fb91e24")
            : tAutoI18n("execute_6ea36ce")}
        </Button>
      ) : null}
    </div>
  );

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.stopPropagation(); // Prevent event bubbling to parent forms
            form.handleSubmit(onSubmit)(e);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
              e.preventDefault();
            }
          }}
          className="flex w-full flex-col gap-4"
        >
          {props.useDialog ? <DialogBody>{formBody}</DialogBody> : formBody}

          {formFooter &&
            (props.useDialog ? (
              <DialogFooter>{formFooter}</DialogFooter>
            ) : (
              <div className="mt-4 flex flex-row justify-end">{formFooter}</div>
            ))}
        </form>
      </Form>

      <Dialog
        open={showTraceConfirmDialog}
        onOpenChange={setShowTraceConfirmDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tAuto("you_selected_a_legacy_evaluator_5e313b2")}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="text-sm">
            {tAuto(
              "we_strongly_recommend_using_observation_evaluators_t_ec3a814",
            )}{" "}
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTraceConfirmDialog(false)}
            >
              {tAuto("cancel_77dfd21")}{" "}
            </Button>
            <Button
              onClick={() => {
                setShowTraceConfirmDialog(false);
                setUserFacingTarget("trace");

                // Update form and mapping
                const actualTarget = "trace";
                const langfuseObject: LangfuseObject = "trace";
                const newMapping = form.getValues("mapping").map((field) => ({
                  ...field,
                  langfuseObject,
                }));
                form.setValue("filter", DEFAULT_TRACE_FILTER);
                form.setValue("mapping", newMapping);
                setAvailableVariables(availableTraceEvalVariables);
                form.setValue("target", actualTarget);
              }}
            >
              {tAuto("continue_2e02623")}{" "}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
