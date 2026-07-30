import { Button, type ButtonProps } from "@/src/components/ui/button";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Pen, PlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { Form } from "@/src/components/ui/form";
import { Textarea } from "@/src/components/ui/textarea";
import {
  type CreateQueueWithAssignments,
  CreateQueueWithAssignmentsData,
  type ScoreConfigDomain,
} from "@langfuse/shared";
import { api } from "@/src/utils/api";
import { MultiSelectKeyValues } from "@/src/features/scores/components/multi-select-key-values";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { useEntitlementLimit } from "@/src/features/entitlements/hooks";
import { ActionButton } from "@/src/components/ActionButton";
import { IconOnlyButton } from "@/src/components/IconOnlyButton";
import { DropdownMenuItemWithSecondaryAction } from "@/src/components/ui/dropdown-menu";
import { useUniqueNameValidation } from "@/src/hooks/useUniqueNameValidation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { UserAssignmentSection } from "@/src/features/annotation-queues/components/UserAssignmentSection";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { getScoreDataTypeIcon } from "@/src/features/scores/lib/scoreColumns";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const CreateOrEditAnnotationQueueButton = ({
  projectId,
  queueId,
  variant = "secondary",
  size,
  isTableAction = false,
}: {
  projectId: string;
  queueId?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  isTableAction?: boolean;
}) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const hasQueueAccess = useHasProjectAccess({
    projectId: projectId,
    scope: "annotationQueues:CUD",
  });
  const hasQueueAssignmentsReadAccess = useHasProjectAccess({
    projectId: projectId,
    scope: "annotationQueueAssignments:read",
  });
  const queueLimit = useEntitlementLimit("annotation-queue-count");
  const capture = usePostHogClientCapture();

  const queueQuery = api.annotationQueues.byId.useQuery(
    { projectId, queueId: queueId as string },
    // Only needed once the edit dialog is open; otherwise this fires for every
    // row that eagerly mounts the inline table-action button.
    { enabled: !!queueId && hasQueueAccess && isOpen },
  );

  const form = useForm({
    resolver: zodResolver(CreateQueueWithAssignmentsData),
  });

  useEffect(() => {
    // Re-seed when the dialog opens so reopening discards any unsaved edits;
    // the component now stays mounted per table row instead of remounting.
    if (!isOpen) return;
    if (queueId && queueQuery.data) {
      form.reset({
        name: queueQuery.data.name,
        description: queueQuery.data.description || undefined,
        scoreConfigIds: queueQuery.data.scoreConfigs.map(
          (config: ScoreConfigDomain) => config.id,
        ),
        newAssignmentUserIds: [],
      });
    } else {
      form.reset({
        name: "",
        scoreConfigIds: [],
        newAssignmentUserIds: [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueId, queueQuery.data, isOpen]);

  const utils = api.useUtils();

  const createQueueMutation = api.annotationQueues.create.useMutation();
  const editQueueMutation = api.annotationQueues.update.useMutation();
  const createQueueAssignmentsMutation =
    api.annotationQueueAssignments.createMany.useMutation();

  const queueCountData = api.annotationQueues.count.useQuery(
    { projectId },
    // The count only feeds the create button's limit check; skip it when
    // editing (e.g. the per-row table action button) where it goes unused.
    { enabled: hasQueueAccess && !queueId },
  );

  const configsData = api.scoreConfigs.all.useQuery(
    {
      projectId,
    },
    {
      enabled: hasQueueAccess && isOpen,
    },
  );

  const allQueueNamesAndIds = api.annotationQueues.allNamesAndIds.useQuery(
    { projectId },
    { enabled: hasQueueAccess && !queueId },
  );

  const allQueueNames = useMemo(() => {
    return !queueId && allQueueNamesAndIds.data
      ? allQueueNamesAndIds.data.map((queue) => ({ value: queue.name }))
      : [];
  }, [allQueueNamesAndIds.data, queueId]);

  useUniqueNameValidation({
    currentName: form.watch("name"),
    allNames: allQueueNames,
    form,
    errorMessage: "Queue name already exists.",
  });

  const configs = configsData.data?.configs ?? [];

  const onSubmit = async (data: CreateQueueWithAssignments) => {
    try {
      // Step 1: Create or update the queue
      let queueResponse;
      if (queueId) {
        // Update existing queue
        queueResponse = await editQueueMutation.mutateAsync({
          name: data.name,
          description: data.description,
          scoreConfigIds: data.scoreConfigIds,
          projectId,
          queueId,
        });
      } else {
        // Create new queue
        queueResponse = await createQueueMutation.mutateAsync({
          name: data.name,
          description: data.description,
          scoreConfigIds: data.scoreConfigIds,
          projectId,
        });
      }

      // Step 2: Handle assignment if provided
      if (data.newAssignmentUserIds && data.newAssignmentUserIds.length > 0) {
        const targetQueueId = queueId || queueResponse.id;

        await createQueueAssignmentsMutation.mutateAsync({
          projectId,
          queueId: targetQueueId,
          userIds: data.newAssignmentUserIds,
        });
      }

      // Step 3: Success handling
      await Promise.all([
        utils.annotationQueues.invalidate(),
        utils.annotationQueueAssignments.invalidate(),
      ]);
      form.reset();
      setIsOpen(false);

      // capture posthog event
    } catch {
      showErrorToast(
        tAutoI18n("operation_failed_c4e6ed9"),
        tAutoI18n(
          "failed_to_create_or_update_queue_or_assign_users_ple_721a308",
        ),
      );
    }
  };

  const handleOnValueChange = (values: Record<string, string>[]) => {
    form.setValue(
      "scoreConfigIds",
      values.map((value) => value.key),
    );

    if (values.length === 0) {
      form.setError("scoreConfigIds", {
        type: "manual",
        message: "At least 1 score config must be selected",
      });
    } else {
      form.clearErrors("scoreConfigIds");
    }
  };

  // Table rows render a compact icon button and rely on the disabled state plus
  // a tooltip; everywhere else uses the labeled ActionButton with its built-in
  // access/limit messaging.
  const triggerButton = isTableAction ? (
    <IconOnlyButton
      icon={<Pen className="h-4 w-4" />}
      label={tAuto("edit_5301648")}
      aria-label={tAuto("edit_9ead47a")}
      disabledReason={
        hasQueueAccess
          ? undefined
          : "You don't have permission to edit this queue."
      }
      onClick={(event) => {
        event.stopPropagation();
        setIsOpen(true);
      }}
    />
  ) : (
    <ActionButton
      variant={variant}
      onClick={() => setIsOpen(true)}
      icon={
        queueId ? (
          <Edit className="h-4 w-4" aria-hidden="true" />
        ) : (
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
        )
      }
      hasAccess={hasQueueAccess}
      usageLimit={
        typeof queueLimit === "number"
          ? { current: queueCountData.data, max: queueLimit }
          : undefined
      }
      size={size}
    >
      <span className="ml-1 text-sm font-normal">
        {queueId ? tAuto("edit_5301648") : tAuto("new_queue_42ad740")}
      </span>
    </ActionButton>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {isTableAction ? (
        triggerButton
      ) : (
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      )}
      {/* For an edit, also wait for the queue data so the form opens populated
          rather than briefly showing empty fields while byId loads. */}
      {configsData.data && (!queueId || queueQuery.data) && (
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {queueId ? tAutoI18n("edit_5301648") : tAutoI18n("new_6403f2b")}{" "}
              {tAutoI18n("annotation_queue_fd7ac2a")}{" "}
            </DialogTitle>
            <DialogDescription>
              {queueId
                ? tAutoI18n("edit_5301648")
                : tAutoI18n("create_a_new_3f66229")}{" "}
              {tAutoI18n(
                "queue_to_manage_your_annotation_workflows_46cf2a5",
              )}{" "}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <DialogBody>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tAuto("name_709a232")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          className="text-xs"
                          onBlur={(e) =>
                            field.onChange(e.target.value.trimEnd())
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {tAuto("description_optional_388de6f")}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={tAuto("add_description_750c9f7")}
                          className="text-xs focus:ring-0 focus:outline-hidden focus-visible:ring-0 focus-visible:ring-offset-0 active:ring-0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scoreConfigIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tAuto("score_configs_c78e87c")}</FormLabel>
                      <FormDescription>
                        {tAuto(
                          "define_which_dimensions_annotators_should_score_for__1c0e553",
                        )}{" "}
                      </FormDescription>
                      <FormControl>
                        <MultiSelectKeyValues
                          placeholder={tAuto("value_8dce170")}
                          align="end"
                          variant="outline"
                          className="grid grid-cols-[auto_1fr_auto_auto] gap-2"
                          onValueChange={handleOnValueChange}
                          options={configs
                            .filter((config) => !config.isArchived)
                            .map((config) => ({
                              key: config.id,
                              value: `${getScoreDataTypeIcon(config.dataType)} ${config.name}`,
                              isArchived: config.isArchived,
                            }))}
                          values={field.value.map((configId) => {
                            const config = configs.find(
                              (config) => config.id === configId,
                            );
                            return {
                              value: config
                                ? `${getScoreDataTypeIcon(config.dataType)} ${config.name}`
                                : `${configId}`,
                              key: configId,
                            };
                          })}
                          controlButtons={
                            <DropdownMenuItemWithSecondaryAction
                              onBeforeAction={() => {
                                capture(
                                  "score_configs:manage_configs_item_click",
                                  { source: "AnnotationQueue" },
                                );
                              }}
                              href={`/project/${projectId}/settings/scores`}
                              title={tAuto("manage_score_configs_3e599c9")}
                            />
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Advanced Section */}
                <FormField
                  control={form.control}
                  name="newAssignmentUserIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {tAuto("advanced_settings_c8fef35")}
                      </FormLabel>
                      <div className="mt-1 rounded-md border">
                        <Collapsible
                          open={isAdvancedOpen && hasQueueAssignmentsReadAccess}
                          onOpenChange={(open) => {
                            if (!hasQueueAssignmentsReadAccess) {
                              setIsAdvancedOpen(false);
                            } else {
                              setIsAdvancedOpen(open);
                            }
                          }}
                        >
                          <CollapsibleTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              className="group flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-transparent"
                            >
                              <div className="flex items-center gap-2">
                                {isAdvancedOpen ? (
                                  <ChevronDown className="text-muted-foreground h-4 w-4" />
                                ) : (
                                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                                )}
                                <span className="text-sm font-bold">
                                  {tAuto("user_assignment_40add11")}{" "}
                                </span>
                              </div>
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="border-border/20 border-t px-3 pt-1 pb-3">
                            {hasQueueAssignmentsReadAccess && (
                              <>
                                <FormControl>
                                  <UserAssignmentSection
                                    projectId={projectId}
                                    queueId={queueId}
                                    selectedUserIds={field.value}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                                <FormMessage />
                              </>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </FormItem>
                  )}
                />
              </DialogBody>
              <DialogFooter>
                <Button
                  type="submit"
                  className="text-xs"
                  disabled={
                    !!form.formState.errors.name ||
                    createQueueMutation.isPending ||
                    editQueueMutation.isPending ||
                    createQueueAssignmentsMutation.isPending
                  }
                >
                  {createQueueMutation.isPending ||
                  editQueueMutation.isPending ||
                  createQueueAssignmentsMutation.isPending
                    ? tAutoI18n("processing_272bc02")
                    : tAutoI18n("value0_queue_c4396f6", {
                        value0: queueId
                          ? tAuto("save_efc007a")
                          : tAuto("create_6e157c5"),
                      })}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      )}
    </Dialog>
  );
};
