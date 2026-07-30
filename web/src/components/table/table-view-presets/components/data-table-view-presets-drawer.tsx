import { Button } from "@/src/components/ui/button";
import {
  X,
  Plus,
  ChevronDown,
  Link,
  MoreVertical,
  Pen,
  Lock,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { LangfuseIcon } from "@/src/components/design-system/LangfuseIcon/LangfuseIcon";
import {
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  Drawer,
  DrawerClose,
} from "@/src/components/ui/drawer";
import { Separator } from "@/src/components/ui/separator";
import { useViewData } from "@/src/components/table/table-view-presets/hooks/useViewData";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/src/components/ui/command";
import { useViewMutations } from "@/src/components/table/table-view-presets/hooks/useViewMutations";
import { cn } from "@/src/utils/tailwind";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import {
  type VisibilityState,
  type ColumnOrderState,
} from "@tanstack/react-table";
import {
  type OrderByState,
  type FilterState,
  type TableViewPresetTableName,
  type TableViewPresetState,
} from "@langfuse/shared";
import { useCallback, useMemo, useState } from "react";
import {
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { DropdownMenu } from "@/src/components/ui/dropdown-menu";
import { DropdownMenuContent } from "@/src/components/ui/dropdown-menu";
import { DeleteButton } from "@/src/components/deleteButton";
import { api } from "@/src/utils/api";
import { Popover, PopoverContent } from "@/src/components/ui/popover";
import { PopoverTrigger } from "@/src/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { copyTextToClipboard } from "@/src/utils/clipboard";
import { useUniqueNameValidation } from "@/src/hooks/useUniqueNameValidation";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import isEqual from "lodash/isEqual";
import { useDefaultViewMutations } from "../hooks/useDefaultViewMutations";
import { DropdownMenuSeparator } from "@/src/components/ui/dropdown-menu";
import { summarizeTableViewPreset } from "../lib/viewPreview";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

/**
 * Prefix for system preset IDs. These are page-specific presets defined in code
 * (not stored in DB). Using this prefix prevents DB lookups and allows special handling.
 * Convention: `__langfuse_{preset_name}__`
 */
export const SYSTEM_PRESET_ID_PREFIX = "__langfuse_";

/** Check if a view ID is a system preset (defined in code, not stored in DB) */
export const isSystemPresetId = (id: string | undefined | null): boolean =>
  !!id?.startsWith(SYSTEM_PRESET_ID_PREFIX);

/** Recursively remove undefined values for consistent comparison */
function normalizeForComparison<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(normalizeForComparison) as T;
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, normalizeForComparison(v)]),
    ) as T;
  }
  return obj;
}

interface SystemPreset {
  id: string;
  name: string;
  isSystem: true;
}

const SYSTEM_PRESETS: { DEFAULT: SystemPreset } = {
  DEFAULT: {
    id: "__langfuse_default__",
    name: "My view (default)",
    isSystem: true,
  },
};

export interface SystemFilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: FilterState;
}

interface TableViewPresetsDrawerProps {
  viewConfig: {
    tableName: TableViewPresetTableName;
    projectId: string;
    controllers: {
      selectedViewId: string | null;
      /** The view whose full state was actually applied this session (null on a
       * shared-link visit where the view is intentionally not applied). */
      appliedViewId: string | null;
      handleSetViewId: (viewId: string | null) => void;
      applyViewState: (
        viewData: TableViewPresetState,
        meta?: {
          trigger: "select" | "permalink" | "default" | "system_preset";
          viewId?: string | null;
        },
      ) => void;
    };
  };
  currentState: {
    orderBy: OrderByState;
    filters: FilterState;
    columnOrder: ColumnOrderState;
    columnVisibility: VisibilityState;
    searchQuery: string;
  };
  /** Page-specific system filter presets (e.g. "Last Generation in Trace") */
  systemFilterPresets?: SystemFilterPreset[];
  /** Optional DOM id on the trigger button so other UI can open the drawer. */
  triggerId?: string;
}

function formatOrderBy(orderBy?: OrderByState) {
  return orderBy?.column ? `${orderBy.column} ${orderBy.order}` : "none";
}

function buildSystemFilterPresetState(
  preset: SystemFilterPreset,
): TableViewPresetState {
  return {
    filters: preset.filters,
    columnOrder: [],
    columnVisibility: {},
    orderBy: null,
    searchQuery: "",
  };
}

export function TableViewPresetsDrawer({
  viewConfig,
  currentState,
  systemFilterPresets,
  triggerId,
}: TableViewPresetsDrawerProps) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const [searchQuery, setSearchQueryLocal] = useState("");
  const { tableName, projectId, controllers } = viewConfig;
  const { handleSetViewId, applyViewState, selectedViewId, appliedViewId } =
    controllers;
  const { TableViewPresetsList } = useViewData({ tableName, projectId });
  const {
    createMutation,
    updateConfigMutation,
    updateNameMutation,
    deleteMutation,
    generatePermalinkMutation,
  } = useViewMutations({ handleSetViewId, applyViewState });
  const utils = api.useUtils();
  const capture = usePostHogClientCapture();

  const form = useForm({
    resolver: zodResolver(z.object({ name: z.string().min(1) })),
    defaultValues: {
      name: "",
    },
  });

  const hasWriteAccess = useHasProjectAccess({
    projectId,
    scope: "TableViewPresets:CUD",
  });

  const { data: defaultAssignments } =
    api.TableViewPresets.getDefaultAssignments.useQuery(
      { projectId, viewName: tableName },
      { enabled: !!projectId },
    );

  const { setViewAsDefault, clearViewDefault, isSettingDefault } =
    useDefaultViewMutations({ tableName, projectId });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditPopoverOpen, setIsEditPopoverOpen] = useState<boolean>(false);
  const [dropdownId, setDropdownId] = useState<string | null>(null);

  const allViewNames = useMemo(
    () => TableViewPresetsList?.map((view) => ({ value: view.name })) ?? [],
    [TableViewPresetsList],
  );

  // Categorized system presets are surfaced by the category chip row beneath
  // the search bar, so they are excluded from the drawer list to avoid showing
  // the same preset in two places. Name lookups and uniqueness checks above
  // still use the full list. Two exceptions stay in the drawer:
  // - a categorized USER view (the name-dedup lets a same-named user view
  //   displace a system preset into the chips) — a personal view must never
  //   vanish from "My Views", it is its only management surface (rename,
  //   delete, defaults, permalink);
  // - a categorized system preset that IS the current user/project default
  //   (assignable pre-chips; the row still exists in default_views) — this
  //   row is the only place carrying the default badge and the "Remove as
  //   my/project default" menu, so hiding it would leave the assignment
  //   auto-applying on every load with no UI to inspect or clear it. Once
  //   the default is removed, the row leaves the drawer again.
  const drawerPresetList = useMemo(
    () =>
      TableViewPresetsList?.filter(
        (view) =>
          !view.category ||
          !view.isSystem ||
          view.id === defaultAssignments?.userDefaultViewId ||
          view.id === defaultAssignments?.projectDefaultViewId,
      ),
    [TableViewPresetsList, defaultAssignments],
  );

  useUniqueNameValidation({
    currentName: form.watch("name"),
    allNames: allViewNames,
    form,
    errorMessage: "View name already exists.",
  });

  const handleSelectView = (view: TableViewPresetState & { id: string }) => {
    capture("saved_views:view_selected", {
      tableName,
      viewId: view.id,
    });

    handleSetViewId(view.id);
    applyViewState(view, { trigger: "select", viewId: view.id });
  };

  const handleSelectSystemFilterPreset = useCallback(
    (preset: SystemFilterPreset) => {
      capture("saved_views:system_preset_selected", {
        tableName,
        presetId: preset.id,
      });
      handleSetViewId(preset.id);
      applyViewState(buildSystemFilterPresetState(preset), {
        trigger: "system_preset",
        viewId: preset.id,
      });
    },
    [capture, tableName, handleSetViewId, applyViewState],
  );

  const handleCreateView = (createdView: { name: string }) => {
    capture("saved_views:create", {
      tableName,
      name: createdView.name,
    });

    createMutation.mutate({
      name: createdView.name,
      tableName,
      projectId,
      orderBy: currentState.orderBy,
      filters: currentState.filters,
      columnOrder: currentState.columnOrder,
      columnVisibility: currentState.columnVisibility,
      searchQuery: currentState.searchQuery,
    });

    setIsCreateDialogOpen(false);
  };

  const handleUpdateViewConfig = (updatedView: { name: string }) => {
    if (!selectedViewId) return;

    capture("saved_views:update_config", {
      tableName,
      viewId: selectedViewId,
      name: updatedView.name,
    });

    // Column order/visibility are the visitor's per-table localStorage, which
    // only reflects this view when the view was actually applied this session.
    // On a shared-link visit the view is intentionally not applied, so
    // `currentState`'s columns are the visitor's own unrelated layout — sending
    // them would silently overwrite the saved view's columns. In that case keep
    // the view's stored column layout instead (LFE-10486). Filters/sort/search
    // always come from the live state, since updating those to what the visitor
    // currently sees is exactly the intent.
    const viewWasApplied = appliedViewId === selectedViewId;
    const storedView = TableViewPresetsList?.find(
      (view) => view.id === selectedViewId,
    );
    const columnOrder =
      viewWasApplied || !storedView
        ? currentState.columnOrder
        : storedView.columnOrder;
    const columnVisibility =
      viewWasApplied || !storedView
        ? currentState.columnVisibility
        : storedView.columnVisibility;

    updateConfigMutation.mutate({
      projectId,
      name: updatedView.name,
      id: selectedViewId,
      tableName,
      orderBy: currentState.orderBy,
      filters: currentState.filters,
      columnOrder,
      columnVisibility,
      searchQuery: currentState.searchQuery,
    });
  };

  const handleUpdateViewName = (updatedView: { id: string; name: string }) => {
    capture("saved_views:update_name", {
      tableName,
      viewId: updatedView.id,
      name: updatedView.name,
    });

    updateNameMutation.mutate({
      id: updatedView.id,
      name: updatedView.name,
      tableName,
      projectId,
    });
  };

  const onSubmit = (id?: string) => (data: { name: string }) => {
    if (id) {
      handleUpdateViewName({ id, name: data.name });
      setIsEditPopoverOpen(false);
      setDropdownId(null);
    } else {
      handleCreateView({ name: data.name });
    }
  };

  const handleDeleteView = async (viewId: string) => {
    capture("saved_views:delete", {
      tableName,
      viewId,
    });

    await deleteMutation.mutateAsync({
      projectId,
      tableViewPresetsId: viewId,
    });
  };

  const handleGeneratePermalink = (viewId: string) => {
    capture("saved_views:permalink_generate", {
      tableName,
      viewId,
    });

    // For the view that is currently active, the page URL already encodes the
    // applied filters, sort and search — the URL is the source of truth. Share
    // it verbatim so in-view edits travel with the link. A server-built
    // `?viewId=…` permalink points at the saved view's stored state and would
    // silently drop those edits, which is the recipient-gets-stale-filters bug
    // (LFE-10486). Non-active views still get a clean link to the saved view.
    if (
      viewId === selectedViewId &&
      typeof window !== "undefined" &&
      window.location?.href
    ) {
      // Toast on the clipboard write's resolution: a permission failure must
      // surface an error instead of falsely reporting success.
      copyTextToClipboard(window.location.href)
        .then(() =>
          showSuccessToast({
            title: tAuto("permalink_copied_to_clipboard_50608c4"),
            description: tAuto(
              "you_can_now_share_the_permalink_with_others_d8f7432",
            ),
          }),
        )
        .catch(() =>
          showErrorToast(
            tAutoI18n("failed_to_copy_permalink_9964fc5"),
            tAutoI18n(
              "could_not_write_to_the_clipboard_please_copy_the_pag_502078e",
            ),
            "WARNING",
          ),
        );
      return;
    }

    if (window.location.origin) {
      generatePermalinkMutation.mutate({
        viewId,
        projectId,
        tableName,
        baseUrl: window.location.origin,
      });
    } else {
      showErrorToast(
        tAutoI18n("failed_to_generate_permalink_8410a86"),
        tAutoI18n(
          "please_reach_out_to_langfuse_support_and_report_this_fe869b6",
        ),
        "WARNING",
      );
    }
  };

  return (
    <>
      <Drawer
        forceDirection="responsive-left"
        onOpenChange={(open) => {
          if (open) {
            capture("saved_views:drawer_open", { tableName });
          } else {
            capture("saved_views:drawer_close", { tableName });
          }
        }}
      >
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            id={triggerId}
            title={tAuto("my_views_a7a71fd")}
          >
            <span>{tAuto("my_views_a7a71fd")}</span>
            {selectedViewId ? (
              <ChevronDown className="ml-1 h-4 w-4" />
            ) : (
              <div className="bg-input ml-1 rounded-sm px-1 text-xs">
                {drawerPresetList?.length ?? 0}
              </div>
            )}
          </Button>
        </DrawerTrigger>
        <DrawerContent overlayClassName="bg-primary/10">
          <div className="mx-auto w-full">
            <DrawerHeader className="bg-modal flex flex-row items-center justify-between rounded-sm px-3 py-1.5">
              <DrawerTitle className="flex flex-row items-center gap-1">
                {tAutoI18n("views_24be612")}{" "}
                <a
                  href="https://github.com/orgs/langfuse/discussions/4657"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                  title={tAuto(
                    "saving_table_view_presets_is_currently_in_beta_click_697c8c0",
                  )}
                ></a>
              </DrawerTitle>
              <DrawerClose asChild>
                <Button variant="outline" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </DrawerHeader>
            <Separator />

            <Command className="h-fit rounded-none border-none pb-1 shadow-none">
              <CommandInput
                placeholder={tAuto("search_views_da900d2")}
                value={searchQuery}
                onValueChange={setSearchQueryLocal}
                className="h-9 border-none focus:ring-0"
              />
              <CommandList className="max-h-[calc(100vh-150px)]">
                <CommandEmpty>{tAuto("no_views_found_be4f171")}</CommandEmpty>
                <CommandGroup className="pb-0">
                  {/* System Preset: Langfuse Default - hidden when page-specific presets exist */}
                  {!systemFilterPresets?.length && (
                    <CommandItem
                      key={SYSTEM_PRESETS.DEFAULT.id}
                      onSelect={() => handleSetViewId(null)}
                      className={cn(
                        "hover:bg-muted/50 group mt-1 flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors",
                        selectedViewId === null && "bg-muted",
                      )}
                      title={tAuto(
                        "reflects_your_current_table_settings_without_applyin_cc56a1e",
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-sm">
                          {SYSTEM_PRESETS.DEFAULT.name}
                        </span>
                        <span className="text-muted-foreground w-fit pl-0 text-xs">
                          {tAuto("your_working_view_ab28261")}{" "}
                        </span>
                      </div>
                    </CommandItem>
                  )}

                  {/* Page-specific System Filter Presets */}
                  {systemFilterPresets?.map((preset) => (
                    <CommandItem
                      key={preset.id}
                      onSelect={() => handleSelectSystemFilterPreset(preset)}
                      className={cn(
                        "hover:bg-muted/50 group mt-1 flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors",
                        selectedViewId === preset.id &&
                          isEqual(
                            normalizeForComparison(currentState.filters),
                            normalizeForComparison(preset.filters),
                          ) &&
                          "bg-muted",
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1.5 text-sm">
                          <LangfuseIcon size={14} />
                          {preset.name}
                        </span>
                        {preset.description && (
                          <span className="text-muted-foreground w-fit pl-0 text-xs">
                            {preset.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}

                  {/* Separator between system and user presets */}
                  {systemFilterPresets?.length && drawerPresetList?.length ? (
                    <Separator className="my-2" />
                  ) : null}

                  {/* User Presets */}
                  {drawerPresetList?.map((view) => {
                    const isUserDefault =
                      defaultAssignments?.userDefaultViewId === view.id;
                    const isProjectDefault =
                      defaultAssignments?.projectDefaultViewId === view.id;
                    const isSystemView = view.isSystem === true;
                    const previewText = summarizeTableViewPreset(view);

                    return (
                      <CommandItem
                        key={view.id}
                        onSelect={() => handleSelectView(view)}
                        className={cn(
                          "hover:bg-muted/50 group mt-1 flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors",
                          selectedViewId === view.id && "bg-muted",
                        )}
                      >
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-sm",
                                isSystemView
                                  ? "flex items-center gap-1.5"
                                  : "truncate",
                              )}
                              title={view.name}
                            >
                              {isSystemView && <LangfuseIcon size={14} />}
                              {view.name}
                            </span>
                            {isUserDefault && (
                              <Badge variant="secondary" className="text-xs">
                                {tAuto("your_default_d93dcae")}{" "}
                              </Badge>
                            )}
                            {isProjectDefault && (
                              <Badge variant="outline" className="text-xs">
                                {tAuto("project_default_832db23")}{" "}
                              </Badge>
                            )}
                          </div>
                          {isSystemView ? (
                            view.description ? (
                              <span className="text-muted-foreground w-fit pl-0 text-xs">
                                {view.description}
                              </span>
                            ) : null
                          ) : previewText ? (
                            <span
                              className="text-muted-foreground truncate text-xs"
                              title={previewText}
                            >
                              {previewText}
                            </span>
                          ) : null}
                          {!isSystemView && view.id === selectedViewId && (
                            <Button
                              variant="ghost"
                              size="xs"
                              className={cn(
                                "w-fit pl-0 text-xs",
                                hasWriteAccess
                                  ? "text-primary-accent"
                                  : "text-muted-foreground",
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateViewConfig({
                                  name: view.name,
                                });
                              }}
                              disabled={!hasWriteAccess}
                            >
                              {tAuto(
                                "update_view_with_current_filters_8e44673",
                              )}{" "}
                            </Button>
                          )}
                        </div>
                        <div className="flex flex-row gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGeneratePermalink(view.id);
                            }}
                            className="w-4 opacity-0 group-hover:opacity-100 peer-data-[state=open]:opacity-100"
                          >
                            <Link className="h-4 w-4" />
                          </Button>
                          <DropdownMenu
                            open={dropdownId === view.id}
                            onOpenChange={(open) => {
                              setDropdownId(open ? view.id : null);
                            }}
                          >
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="flex flex-col *:w-full *:justify-start">
                              {!isSystemView && (
                                <>
                                  <DropdownMenuItem asChild>
                                    <Popover
                                      key={view.id + "-edit"}
                                      open={isEditPopoverOpen}
                                      onOpenChange={(open) => {
                                        setIsEditPopoverOpen(open);
                                        if (open) {
                                          form.reset({ name: view.name });
                                          capture(
                                            "saved_views:update_form_open",
                                            {
                                              tableName,
                                              viewId: view.id,
                                            },
                                          );
                                        } else {
                                          setDropdownId(null);
                                        }
                                      }}
                                    >
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                          }}
                                          disabled={!hasWriteAccess}
                                        >
                                          {hasWriteAccess ? (
                                            <Pen className="mr-2 h-4 w-4" />
                                          ) : (
                                            <Lock className="mr-2 h-4 w-4" />
                                          )}
                                          {tAutoI18n("rename_d3f4cb8")}{" "}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <h2 className="mb-3 font-bold">
                                          {tAuto("edit_5301648")}
                                        </h2>
                                        <Form {...form}>
                                          <form
                                            onSubmit={form.handleSubmit(
                                              onSubmit(view.id),
                                            )}
                                            className="space-y-2"
                                          >
                                            <FormField
                                              control={form.control}
                                              name="name"
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>
                                                    {tAuto(
                                                      "view_name_f13b6b7",
                                                    )}{" "}
                                                  </FormLabel>
                                                  <FormControl>
                                                    <Input
                                                      defaultValue={view.name}
                                                      {...field}
                                                    />
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />

                                            <div className="flex w-full justify-end">
                                              <Button
                                                type="submit"
                                                loading={
                                                  updateNameMutation.isPending
                                                }
                                                disabled={
                                                  !!form.formState.errors.name
                                                }
                                              >
                                                {tAuto("save_efc007a")}{" "}
                                              </Button>
                                            </div>
                                          </form>
                                        </Form>
                                      </PopoverContent>
                                    </Popover>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isUserDefault) {
                                    clearViewDefault("user");
                                  } else {
                                    setViewAsDefault(view.id, "user");
                                  }
                                  setDropdownId(null);
                                }}
                                disabled={isSettingDefault}
                              >
                                {isUserDefault ? (
                                  <>{tAuto("remove_as_my_default_e8f6c85")}</>
                                ) : (
                                  <>{tAuto("set_as_my_default_9918387")}</>
                                )}
                              </DropdownMenuItem>
                              {/* Set as project default - requires write access */}
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isProjectDefault) {
                                    clearViewDefault("project");
                                  } else {
                                    setViewAsDefault(view.id, "project");
                                  }
                                  setDropdownId(null);
                                }}
                                disabled={!hasWriteAccess || isSettingDefault}
                              >
                                {isProjectDefault ? (
                                  <>
                                    {tAuto("remove_as_project_default_18d1b9b")}
                                  </>
                                ) : (
                                  <>{tAuto("set_as_project_default_b9025b2")}</>
                                )}
                                {!hasWriteAccess && (
                                  <Lock className="ml-auto h-4 w-4" />
                                )}
                              </DropdownMenuItem>
                              {!isSystemView && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <DeleteButton
                                      itemId={view.id}
                                      projectId={projectId}
                                      scope="TableViewPresets:CUD"
                                      entityToDeleteName="view"
                                      executeDeleteMutation={async () => {
                                        await handleDeleteView(view.id);
                                      }}
                                      isDeleteMutationLoading={
                                        deleteMutation.isPending
                                      }
                                      invalidateFunc={() => {
                                        utils.TableViewPresets.invalidate();
                                      }}
                                      captureDeleteOpen={() =>
                                        capture(
                                          "saved_views:delete_form_open",
                                          {
                                            tableName,
                                            viewId: view.id,
                                          },
                                        )
                                      }
                                      captureDeleteSuccess={() => {}}
                                    />
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {!isSystemView && (
                            <div className="text-muted-foreground flex items-center text-xs">
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={view.createdByUser?.image ?? undefined}
                                  alt={
                                    view.createdByUser?.name ??
                                    tAuto("user_avatar_32e4f25")
                                  }
                                />
                                <AvatarFallback className="bg-tertiary">
                                  {view.createdByUser?.name
                                    ? view.createdByUser?.name
                                        .split(" ")
                                        .map((word) => word[0])
                                        .slice(0, 2)
                                        .concat("")
                                    : null}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>

            <Separator />

            <div className="p-2">
              <Button
                onClick={() => {
                  setIsCreateDialogOpen(true);
                  capture("saved_views:create_form_open", { tableName });
                }}
                variant="ghost"
                className="w-full justify-start px-1"
              >
                <Plus className="mr-2 h-4 w-4" />
                {tAuto("create_custom_view_0a6ccae")}{" "}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Create View Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            form.reset({ name: "" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tAuto("save_current_table_view_1f856a4")}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit())}
              className="space-y-4"
            >
              <DialogBody>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tAuto("view_name_f13b6b7")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-muted-foreground mt-4 text-sm">
                  <p>{tAuto("this_will_save_the_current_b3d7a60")}</p>
                  <ul className="mt-2 list-disc pl-5">
                    <li>
                      {tAutoI18n("column_arrangement_a6b5f0c")}
                      {currentState.columnOrder.length}{" "}
                      {tAutoI18n("columns_78764e2")}{" "}
                    </li>
                    <li>
                      {tAutoI18n("filters_445f863")}
                      {currentState.filters.length}{" "}
                      {tAutoI18n("active_1a59ea5")}
                    </li>
                    <li>
                      {tAutoI18n("sort_order_1655638")}
                      {formatOrderBy(currentState.orderBy)}{" "}
                      {tAutoI18n("criteria_8f1fcb0")}{" "}
                    </li>
                    {currentState.searchQuery && (
                      <li>{tAuto("search_term_972c820")}</li>
                    )}
                  </ul>
                </div>
              </DialogBody>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  {tAuto("cancel_77dfd21")}{" "}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending ||
                    !!form.formState.errors.name ||
                    !hasWriteAccess
                  }
                >
                  {!hasWriteAccess && <Lock className="mr-2 h-4 w-4" />}
                  {createMutation.isPending
                    ? tAutoI18n("saving_ae7e887")
                    : tAutoI18n("save_view_b7faf6a")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
