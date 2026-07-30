import { useRouter } from "next/router";
import { api } from "@/src/utils/api";
import { useV4Beta } from "@/src/features/events/hooks/useV4Beta";
import { useDashboardFilterOptions } from "@/src/hooks/useDashboardFilterOptions";
import Page from "@/src/components/layouts/page";
import { NoDataOrLoading } from "@/src/components/NoDataOrLoading";
import { TimeRangePicker } from "@/src/components/date-picker";
import { PopoverFilterBuilder } from "@/src/features/filters/components/filter-builder";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import type { ColumnDefinition, FilterState } from "@langfuse/shared";
import { Button } from "@/src/components/ui/button";
import { PlusIcon, Copy } from "lucide-react";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import {
  SelectWidgetDialog,
  type WidgetItem,
} from "@/src/features/widgets/components/SelectWidgetDialog";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { v4 as uuidv4 } from "uuid";
import { useDebounce } from "@/src/hooks/useDebounce";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import {
  DashboardGrid,
  type DashboardPlacement,
} from "@/src/features/widgets/components/DashboardGrid";
import { CloneFirstDialog } from "@/src/features/dashboard/components/CloneFirstDialog";
import { InlineEditText } from "@/src/components/design-system/InlineEditText/InlineEditText";
import { PageHeaderControlsPortal } from "@/src/components/layouts/page-header-controls-slot";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { EditDashboardDialog } from "@/src/features/dashboard/components/EditDashboardDialog";
import {
  LANGFUSE_HOME_DASHBOARD_ID,
  type HomeDashboardPresetId,
} from "@langfuse/shared";
import {
  ClipboardPasteIcon,
  HomeIcon,
  Loader2,
  MoreVertical,
  PencilIcon,
} from "lucide-react";
import { useDashboardDateRange } from "@/src/hooks/useDashboardDateRange";
import {
  DASHBOARD_AGGREGATION_OPTIONS,
  toAbsoluteTimeRange,
} from "@/src/utils/date-range-utils";
import { useEntitlementLimit } from "@/src/features/entitlements/hooks";
import { useEnvironmentFilterOptionsCache } from "@/src/hooks/use-environment-filter-options-cache";
import { MultiSelect } from "@/src/features/filters/components/multi-select";
import {
  convertSelectedEnvironmentsToFilter,
  useEnvironmentFilter,
} from "@/src/hooks/useEnvironmentFilter";
import {
  DashboardQuerySchedulerProvider,
  getDashboardQuerySchedulerMaxConcurrent,
  getDashboardSchedulerResetKey,
  useDashboardQueryScheduler,
} from "@/src/hooks/useDashboardQueryScheduler";
import {
  parsePastedWidget,
  toWidgetCreateFields,
  type PastedWidgetParseResult,
  type WidgetExportSource,
} from "@/src/features/widgets/utils/import-export-utils";
import {
  isPasteablePlacementPayload,
  parseDashboardImport,
  parsePastedPreset,
  type ParsedDashboardImport,
} from "@/src/features/dashboard/utils/dashboard-import-export";
import { type PresetPlacement } from "@/src/features/widgets/components/PresetDashboardWidget";
import { pushDownForInsertion } from "@/src/features/widgets/utils/grid-placement";
import { readTextFromClipboard } from "@/src/utils/clipboard";
import { useClipboardWidgetProbe } from "@/src/features/widgets/hooks/useClipboardWidgetProbe";
import { extractTransferFiles } from "@/src/components/editor/fileDropPaste";
import { Layer } from "@/src/components/ui/layer";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

// Position for a tile inserted "next to" an anchor tile: same size,
// immediately to the right when that fits the 12-column grid, otherwise
// directly below the anchor. Collisions are resolved by the grid layout.
function placementNextTo(anchor: DashboardPlacement) {
  const fitsRight = anchor.x + anchor.x_size * 2 <= 12;
  return {
    x: fitsRight ? anchor.x + anchor.x_size : anchor.x,
    y: fitsRight ? anchor.y : anchor.y + anchor.y_size,
    x_size: anchor.x_size,
    y_size: anchor.y_size,
  };
}

export default function DashboardDetail() {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const utils = api.useUtils();
  const capture = usePostHogClientCapture();

  const { projectId, dashboardId, addWidgetId } = router.query as {
    projectId: string;
    dashboardId: string;
    addWidgetId?: string;
  };

  const lookbackLimit = useEntitlementLimit("data-access-days");
  const { isBetaEnabled } = useV4Beta();

  // Fetch dashboard data
  const dashboard = api.dashboard.getDashboard.useQuery({
    projectId,
    dashboardId,
  });

  const hasRbacCUDAccess = useHasProjectAccess({
    projectId,
    scope: "dashboards:CUD",
  });
  const isLockedDashboard = dashboard.data?.owner === "LANGFUSE";
  const hasCUDAccess = hasRbacCUDAccess && !isLockedDashboard;

  // Langfuse-managed dashboards keep full edit affordances; edit attempts
  // route through the clone-first flow instead of mutating.
  const isLockedEditable = hasRbacCUDAccess && isLockedDashboard;

  // Access for cloning (independent of dashboard owner)
  const hasCloneAccess = hasRbacCUDAccess && isLockedDashboard;

  // Clone-first dialog state: open + the attempted change (if any) to carry
  // into the clone. gridResetKey remounts the grid to revert an attempted
  // drag/resize when the user cancels.
  const [cloneFirstState, setCloneFirstState] = useState<{
    open: boolean;
    pendingDefinition: { widgets: DashboardPlacement[] } | null;
  }>({ open: false, pendingDefinition: null });
  const [gridResetKey, setGridResetKey] = useState(0);

  const openCloneFirst = useCallback(
    (
      attempt:
        | "layout_change"
        | "delete_widget"
        | "add_widget"
        | "widget_pencil",
      pendingDefinition?: { widgets: DashboardPlacement[] },
    ) => {
      capture("dashboard:locked_edit_attempt", {
        dashboard_id: dashboardId,
        attempt,
        surface: "detail",
      });
      setCloneFirstState({
        open: true,
        pendingDefinition: pendingDefinition ?? null,
      });
    },
    [capture, dashboardId],
  );

  // Filter state - use persistent filters from dashboard
  const [savedFilters, setSavedFilters] = useState<FilterState>([]);
  const [currentFilters, setCurrentFilters] = useState<FilterState>([]);

  // Date range state - use the hook for all date range logic
  const { timeRange, setTimeRange } = useDashboardDateRange();
  const absoluteTimeRange = useMemo(
    () => toAbsoluteTimeRange(timeRange) ?? undefined,
    [timeRange],
  );

  // Check if current filters differ from saved filters
  const hasUnsavedFilterChanges = useMemo(() => {
    return JSON.stringify(currentFilters) !== JSON.stringify(savedFilters);
  }, [currentFilters, savedFilters]);

  // State for handling widget deletion and addition
  const [localDashboardDefinition, setLocalDashboardDefinition] = useState<{
    widgets: DashboardPlacement[];
  } | null>(null);
  // The async flows below (paste/duplicate/import) commit a definition change
  // only after a network round-trip. They must compute it from this ref — the
  // definition as of NOW — not from the state captured when the handler
  // started, or a drag/delete/paste that landed during the await gets
  // silently discarded.
  const localDashboardDefinitionRef = useRef(localDashboardDefinition);
  localDashboardDefinitionRef.current = localDashboardDefinition;

  // State for the widget selection dialog
  const [isWidgetDialogOpen, setIsWidgetDialogOpen] = useState(false);

  // Mutation for updating dashboard definition
  const updateDashboardDefinition =
    api.dashboard.updateDashboardDefinition.useMutation({
      // Saves are silent; the header shows a spinner while in flight.
      onSuccess: () => {
        // Invalidate the dashboard query to refetch the data
        dashboard.refetch();
      },
      onError: (error) => {
        showErrorToast(
          tAutoI18n("error_updating_dashboard_f6e0963"),
          error.message,
        );
      },
    });

  // Which dashboard is shown on this project's Home (for the "Use as Home" action)
  const homePointer = api.dashboard.getHomeDashboard.useQuery(
    { projectId },
    { enabled: Boolean(projectId), retry: false },
  );
  const isCurrentHome =
    (homePointer.data?.homeDashboardId ?? LANGFUSE_HOME_DASHBOARD_ID) ===
    dashboardId;

  const setHomeDashboard = api.dashboard.setHomeDashboard.useMutation({
    onSuccess: () => {
      utils.dashboard.getHomeDashboard.invalidate();
    },
    onError: (error) => {
      showErrorToast(
        tAutoI18n("failed_to_update_home_dashboard_87dee9d"),
        error.message,
      );
    },
  });

  // Dialog for editing name + description from the ... menu
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Mutation for renaming the dashboard inline from the page header
  const updateDashboardMetadata =
    api.dashboard.updateDashboardMetadata.useMutation({
      onSuccess: () => {
        utils.dashboard.invalidate();
      },
      onError: (error) => {
        showErrorToast(
          tAutoI18n("error_renaming_dashboard_b920e3d"),
          error.message,
        );
      },
    });

  // Mutation for updating dashboard filters
  const updateDashboardFilters =
    api.dashboard.updateDashboardFilters.useMutation({
      onSuccess: () => {
        // Update saved state to match current state
        setSavedFilters(currentFilters);
      },
      onError: (error) => {
        showErrorToast(
          tAutoI18n("error_saving_filters_281ec62"),
          error.message,
        );
      },
    });

  const saveDashboardChanges = useDebounce(
    (definition: { widgets: DashboardPlacement[] }) => {
      if (!hasCUDAccess) return;
      updateDashboardDefinition.mutate({
        projectId,
        dashboardId,
        definition,
      });
    },
    600,
    false,
  );

  // Single write path for definition changes: keeps the ref in sync for
  // readers that commit before the next render, updates state, and schedules
  // the debounced save.
  const applyDashboardDefinition = useCallback(
    (updated: { widgets: DashboardPlacement[] }) => {
      localDashboardDefinitionRef.current = updated;
      setLocalDashboardDefinition(updated);
      saveDashboardChanges(updated);
    },
    [saveDashboardChanges],
  );

  // Function to save current filters
  const handleSaveFilters = () => {
    if (!hasCUDAccess) return;

    updateDashboardFilters.mutate({
      projectId,
      dashboardId,
      filters: currentFilters,
    });
  };

  // Helper function to add a widget placement to the dashboard. Defaults to a
  // 6x6 tile below all existing widgets; callers can pass an explicit position
  // (e.g. "paste to the right" of an anchor tile).
  const insertWidgetPlacement = useCallback(
    (
      widgetId: string,
      position?: { x: number; y: number; x_size: number; y_size: number },
    ) => {
      // Read through the ref: async callers (paste/duplicate) reach here
      // after a network round-trip.
      const currentDefinition = localDashboardDefinitionRef.current;
      if (!currentDefinition) return;

      // Find the maximum y position to place the new widget at the bottom
      const maxY =
        currentDefinition.widgets.length > 0
          ? Math.max(...currentDefinition.widgets.map((w) => w.y + w.y_size))
          : 0;

      // Create a new widget placement
      const newWidgetPlacement: DashboardPlacement = {
        id: uuidv4(),
        widgetId,
        type: "widget",
        x: position?.x ?? 0, // Default: start at left
        y: position?.y ?? maxY, // Default: place below existing widgets
        x_size: position?.x_size ?? 6, // Default size (half of 12-column grid)
        y_size: position?.y_size ?? 6, // Default height of 6 rows
      };

      // An explicit position may target an occupied slot ("paste to the
      // right") — push the tiles in the way below it; bottom inserts are
      // collision-free by construction.
      const existingWidgets = position
        ? pushDownForInsertion(currentDefinition.widgets, newWidgetPlacement)
        : currentDefinition.widgets;
      applyDashboardDefinition({
        ...currentDefinition,
        widgets: [...existingWidgets, newWidgetPlacement],
      });

      // The new widget may land outside the viewport — bring it into view.
      setTimeout(() => {
        document
          .querySelector(`[data-placement-id="${newWidgetPlacement.id}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    },
    [applyDashboardDefinition],
  );

  const addWidgetToDashboard = useCallback(
    (widget: WidgetItem) => insertWidgetPlacement(widget.id),
    [insertWidgetPlacement],
  );

  // Add a Langfuse Home card as a preset placement (no widget row involved).
  // Defaults to a 6x6 tile below all existing widgets; callers can pass an
  // explicit position (e.g. paste/duplicate next to an anchor tile).
  const insertPresetPlacement = useCallback(
    (
      presetId: HomeDashboardPresetId,
      position?: { x: number; y: number; x_size: number; y_size: number },
    ) => {
      const currentDefinition = localDashboardDefinitionRef.current;
      if (!currentDefinition) return;

      const maxY =
        currentDefinition.widgets.length > 0
          ? Math.max(...currentDefinition.widgets.map((w) => w.y + w.y_size))
          : 0;

      const newPresetPlacement: DashboardPlacement = {
        id: uuidv4(),
        presetId,
        type: "preset",
        x: position?.x ?? 0,
        y: position?.y ?? maxY,
        x_size: position?.x_size ?? 6,
        y_size: position?.y_size ?? 6,
      };

      // See insertWidgetPlacement: anchored inserts displace occupying tiles.
      const existingWidgets = position
        ? pushDownForInsertion(currentDefinition.widgets, newPresetPlacement)
        : currentDefinition.widgets;
      applyDashboardDefinition({
        ...currentDefinition,
        widgets: [...existingWidgets, newPresetPlacement],
      });

      setTimeout(() => {
        document
          .querySelector(`[data-placement-id="${newPresetPlacement.id}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    },
    [applyDashboardDefinition],
  );

  const addPresetToDashboard = useCallback(
    (presetId: HomeDashboardPresetId) => insertPresetPlacement(presetId),
    [insertPresetPlacement],
  );

  // Duplicate a preset card: another placement of the same preset next to
  // the anchor tile (no widget row involved).
  const handleDuplicatePreset = useCallback(
    (anchor: PresetPlacement) => {
      capture("dashboard:widget_duplicated", {
        surface: "grid_menu",
        kind: "preset",
        preset_id: anchor.presetId,
        dashboard_id: dashboardId,
      });
      insertPresetPlacement(
        anchor.presetId as HomeDashboardPresetId,
        placementNextTo(anchor),
      );
    },
    [capture, dashboardId, insertPresetPlacement],
  );

  // Place a pasted preset card (next to `anchor` when given, else at the
  // bottom).
  const handlePastedPreset = useCallback(
    (
      presetId: HomeDashboardPresetId,
      source: "cmd_v" | "dashboard_menu" | "paste_right" | "drop",
      anchor?: DashboardPlacement,
    ) => {
      capture("dashboard:widget_pasted", {
        source,
        kind: "preset",
        preset_id: presetId,
        dashboard_id: dashboardId,
      });
      insertPresetPlacement(
        presetId,
        anchor ? placementNextTo(anchor) : undefined,
      );
    },
    [capture, dashboardId, insertPresetPlacement],
  );

  const { mutateAsync: createWidgetAsync } =
    api.dashboardWidgets.create.useMutation();
  const { mutateAsync: deleteWidgetAsync } =
    api.dashboardWidgets.delete.useMutation();

  // Duplicate a tile's widget: create an independent widget row seeded from
  // the source configuration, placed next to the source tile.
  const handleDuplicateWidget = useCallback(
    async (anchor: DashboardPlacement, widget: WidgetExportSource) => {
      try {
        const result = await createWidgetAsync({
          projectId,
          ...toWidgetCreateFields(widget),
          name: `${widget.name} (Copy)`,
        });
        capture("dashboard:widget_duplicated", {
          surface: "grid_menu",
          kind: "widget",
          dashboard_id: dashboardId,
          chart_type: widget.chartType,
          view: widget.view,
        });
        insertWidgetPlacement(result.widget.id, placementNextTo(anchor));
      } catch (e) {
        showErrorToast(
          tAutoI18n("failed_to_duplicate_widget_f68f6a1"),
          e instanceof Error ? e.message : tAutoI18n("unknown_error_e5fd9aa"),
        );
      }
    },
    [
      createWidgetAsync,
      projectId,
      dashboardId,
      capture,
      insertWidgetPlacement,
      tAutoI18n,
    ],
  );

  // Recreate a parsed clipboard widget as a project widget and place it on
  // the dashboard (next to `anchor` when given, else at the bottom).
  const handleParsedWidgetPaste = useCallback(
    async (
      parsed: Exclude<PastedWidgetParseResult, { status: "not-widget" }>,
      source: "cmd_v" | "dashboard_menu" | "paste_right" | "drop",
      anchor?: DashboardPlacement,
    ) => {
      if (parsed.status === "invalid") {
        capture("dashboard:widget_paste_rejected", {
          source,
          reason: "invalid",
          dashboard_id: dashboardId,
        });
        showErrorToast(
          tAutoI18n("cannot_paste_widget_1761d8e"),
          parsed.reason,
          "WARNING",
        );
        return;
      }
      // Don't create a widget row the placement step couldn't attach — a
      // paste firing before the dashboard definition has loaded would
      // otherwise leave an orphan widget in the library.
      if (!localDashboardDefinitionRef.current) return;
      try {
        const result = await createWidgetAsync({
          projectId,
          ...toWidgetCreateFields(parsed.widget),
        });
        capture("dashboard:widget_pasted", {
          source,
          kind: "widget",
          dashboard_id: dashboardId,
          chart_type: parsed.widget.chartType,
          view: parsed.widget.view,
        });
        insertWidgetPlacement(
          result.widget.id,
          anchor ? placementNextTo(anchor) : undefined,
        );
        if (parsed.removedFilters) {
          showErrorToast(
            tAutoI18n("widget_filters_were_adjusted_50c8985"),
            tAutoI18n(
              "some_pasted_filters_were_removed_because_they_are_no_1cdad50",
            ),
            "WARNING",
          );
        }
      } catch (e) {
        showErrorToast(
          tAutoI18n("failed_to_paste_widget_225c274"),
          e instanceof Error ? e.message : tAutoI18n("unknown_error_e5fd9aa"),
        );
      }
    },
    [
      capture,
      createWidgetAsync,
      dashboardId,
      insertWidgetPlacement,
      projectId,
      tAutoI18n,
    ],
  );

  // Menu-driven paste ("Paste widget" / "Paste to the right"): read the
  // clipboard and reject non-widget payloads visibly.
  const pasteWidgetFromClipboard = useCallback(
    async (
      source: "dashboard_menu" | "paste_right",
      anchor?: DashboardPlacement,
    ) => {
      const text = await readTextFromClipboard();
      if (text === null) {
        showErrorToast(
          tAutoI18n("clipboard_unavailable_bec46a2"),
          tAutoI18n(
            "your_browser_did_not_allow_reading_the_clipboard_pas_58db43b",
          ),
          "WARNING",
        );
        return;
      }
      const parsed = parsePastedWidget(text, { isBetaEnabled });
      if (parsed.status === "not-widget") {
        const preset = parsePastedPreset(text);
        if (preset.status === "preset") {
          handlePastedPreset(preset.presetId, source, anchor);
          return;
        }
        if (preset.status === "invalid") {
          capture("dashboard:widget_paste_rejected", {
            source,
            reason: "invalid",
            dashboard_id: dashboardId,
          });
          showErrorToast(
            tAutoI18n("cannot_paste_card_47acb69"),
            preset.reason,
            "WARNING",
          );
          return;
        }
        capture("dashboard:widget_paste_rejected", {
          source,
          reason: "not_widget",
          dashboard_id: dashboardId,
        });
        showErrorToast(
          tAutoI18n("no_widget_in_clipboard_303d8e9"),
          tAutoI18n(
            "the_clipboard_does_not_contain_a_langfuse_widget_jso_7b98e78",
          ),
          "WARNING",
        );
        return;
      }
      await handleParsedWidgetPaste(parsed, source, anchor);
    },
    [
      capture,
      dashboardId,
      handleParsedWidgetPaste,
      handlePastedPreset,
      isBetaEnabled,
      ,
      tAutoI18n,
    ],
  );

  // Cmd/Ctrl+V on the dashboard pastes a copied widget. Only intercepts when
  // the clipboard actually holds a Langfuse widget payload and the paste is
  // not aimed at a text input.
  useEffect(() => {
    if (!hasCUDAccess) return;

    const onPaste = (event: ClipboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable]")
      ) {
        return;
      }
      const text = event.clipboardData?.getData("text/plain");
      if (!text) return;
      const parsed = parsePastedWidget(text, { isBetaEnabled });
      if (parsed.status === "not-widget") {
        const preset = parsePastedPreset(text);
        // Neither widget nor preset payload: leave the event alone (silent,
        // per spec).
        if (preset.status === "not-preset") return;
        event.preventDefault();
        if (preset.status === "invalid") {
          capture("dashboard:widget_paste_rejected", {
            source: "cmd_v",
            reason: "invalid",
            dashboard_id: dashboardId,
          });
          showErrorToast(
            tAutoI18n("cannot_paste_card_47acb69"),
            preset.reason,
            "WARNING",
          );
          return;
        }
        handlePastedPreset(preset.presetId, "cmd_v");
        return;
      }
      event.preventDefault();
      handleParsedWidgetPaste(parsed, "cmd_v");
    };

    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [
    hasCUDAccess,
    isBetaEnabled,
    handleParsedWidgetPaste,
    handlePastedPreset,
    capture,
    dashboardId,
    ,
    tAutoI18n,
  ]);

  // Gate the dashboard-menu "Paste widget" item on the clipboard actually
  // holding a pasteable payload, where the browser lets us check silently.
  const [isDashboardMenuOpen, setIsDashboardMenuOpen] = useState(false);
  const isPasteablePayload = useCallback(
    (text: string) => isPasteablePlacementPayload(text, { isBetaEnabled }),
    [isBetaEnabled],
  );
  const clipboardProbe = useClipboardWidgetProbe(
    isDashboardMenuOpen && hasCUDAccess,
    isPasteablePayload,
  );

  // Import a dropped dashboard file: recreate its widgets as project widgets
  // and append the placements below the existing content, preserving the
  // file's relative layout.
  const handleDashboardImport = useCallback(
    async (imported: ParsedDashboardImport) => {
      if (!localDashboardDefinitionRef.current) return;
      try {
        const widgetPlacements = imported.placements.flatMap((p) =>
          p.type === "widget" ? [p] : [],
        );
        const settled = await Promise.allSettled(
          widgetPlacements.map((p) =>
            createWidgetAsync({
              projectId,
              ...toWidgetCreateFields(p.widget),
            }),
          ),
        );
        const createdWidgets = settled.flatMap((s) =>
          s.status === "fulfilled" ? [s.value] : [],
        );
        if (createdWidgets.length !== widgetPlacements.length) {
          // Partial failure: best-effort delete of the widgets that did get
          // created, so no orphan rows pile up in the widget library.
          await Promise.allSettled(
            createdWidgets.map((created) =>
              deleteWidgetAsync({ projectId, widgetId: created.widget.id }),
            ),
          );
          const firstError = settled.find(
            (s): s is PromiseRejectedResult => s.status === "rejected",
          )?.reason;
          showErrorToast(
            tAutoI18n("failed_to_import_dashboard_b3a4827"),
            firstError instanceof Error
              ? firstError.message
              : tAutoI18n("could_not_create_the_dashboard_s_widgets_f6cd461"),
          );
          return;
        }

        // Re-read the definition after the awaits: a drag/delete/paste may
        // have landed while the widgets were being created.
        const currentDefinition = localDashboardDefinitionRef.current;
        if (!currentDefinition) return;
        const maxY =
          currentDefinition.widgets.length > 0
            ? Math.max(...currentDefinition.widgets.map((w) => w.y + w.y_size))
            : 0;
        const minImportedY = Math.min(...imported.placements.map((p) => p.y));
        const yOffset = maxY - minImportedY;

        let createdIndex = 0;
        const newPlacements: DashboardPlacement[] = imported.placements.map(
          (p) => {
            const base = {
              id: uuidv4(),
              x: p.x,
              y: p.y + yOffset,
              x_size: p.x_size,
              y_size: p.y_size,
            };
            if (p.type === "preset") {
              return { ...base, type: "preset" as const, presetId: p.presetId };
            }
            const widgetId = createdWidgets[createdIndex]!.widget.id;
            createdIndex += 1;
            return { ...base, type: "widget" as const, widgetId };
          },
        );

        applyDashboardDefinition({
          ...currentDefinition,
          widgets: [...currentDefinition.widgets, ...newPlacements],
        });

        capture("dashboard:dashboard_json_imported", {
          dashboard_id: dashboardId,
          widget_count: widgetPlacements.length,
          preset_count: imported.placements.length - widgetPlacements.length,
          skipped_preset_count: imported.skippedPresetCount,
        });

        setTimeout(() => {
          document
            .querySelector(`[data-placement-id="${newPlacements[0]?.id}"]`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 150);

        showSuccessToast({
          title: tAuto("dashboard_imported_425143c"),
          description: tAuto("added_value0_widget_value1_from_value2_2adf9ff", {
            value0: newPlacements.length,
            value1: newPlacements.length === 1 ? "" : "s",
            value2: imported.name,
          }),
        });
        if (imported.removedFilters) {
          showErrorToast(
            tAutoI18n("widget_filters_were_adjusted_50c8985"),
            tAutoI18n(
              "some_imported_filters_were_removed_because_they_are__2609b30",
            ),
            "WARNING",
          );
        }
        if (imported.skippedPresetCount > 0) {
          showErrorToast(
            tAutoI18n("some_cards_were_skipped_b066b1e"),
            tAutoI18n(
              "value0_preset_card_s_in_the_file_are_not_available_i_32810e6",
              { value0: String(imported.skippedPresetCount ?? "") },
            ),
            "WARNING",
          );
        }
      } catch (e) {
        showErrorToast(
          tAutoI18n("failed_to_import_dashboard_b3a4827"),
          e instanceof Error ? e.message : tAutoI18n("unknown_error_e5fd9aa"),
        );
      }
    },
    [
      createWidgetAsync,
      deleteWidgetAsync,
      projectId,
      applyDashboardDefinition,
      capture,
      dashboardId,
      ,
      tAuto,
      tAutoI18n,
    ],
  );

  // A dropped file may be a dashboard export or a single widget export.
  const handleDroppedFile = useCallback(
    async (file: File) => {
      const text = await file.text();

      const dashboardResult = parseDashboardImport(text, { isBetaEnabled });
      if (dashboardResult.status === "dashboard") {
        await handleDashboardImport(dashboardResult.dashboard);
        return;
      }
      if (dashboardResult.status === "invalid") {
        capture("dashboard:widget_paste_rejected", {
          source: "drop",
          reason: "invalid",
          dashboard_id: dashboardId,
        });
        showErrorToast(
          tAutoI18n("cannot_import_dashboard_cb28686"),
          dashboardResult.reason,
          "WARNING",
        );
        return;
      }

      const widgetResult = parsePastedWidget(text, { isBetaEnabled });
      if (widgetResult.status === "not-widget") {
        const preset = parsePastedPreset(text);
        if (preset.status === "preset") {
          handlePastedPreset(preset.presetId, "drop");
          return;
        }
        if (preset.status === "invalid") {
          capture("dashboard:widget_paste_rejected", {
            source: "drop",
            reason: "invalid",
            dashboard_id: dashboardId,
          });
          showErrorToast(
            tAutoI18n("cannot_import_card_7ff07fe"),
            preset.reason,
            "WARNING",
          );
          return;
        }
        capture("dashboard:widget_paste_rejected", {
          source: "drop",
          reason: "not_widget",
          dashboard_id: dashboardId,
        });
        showErrorToast(
          tAutoI18n("unsupported_file_71fc0b3"),
          tAutoI18n(
            "only_langfuse_dashboard_or_widget_json_files_can_be__102a3ad",
          ),
          "WARNING",
        );
        return;
      }
      await handleParsedWidgetPaste(widgetResult, "drop");
    },
    [
      isBetaEnabled,
      handleDashboardImport,
      handleParsedWidgetPaste,
      handlePastedPreset,
      capture,
      dashboardId,
      ,
      tAutoI18n,
    ],
  );

  // Page-wide drop target: dragging a file over the dashboard shows an
  // overlay; dropping imports it.
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragDepthRef = useRef(0);

  useEffect(() => {
    if (!hasCUDAccess) return;

    const isFileDrag = (event: DragEvent) =>
      Array.from(event.dataTransfer?.types ?? []).includes("Files");

    const onDragEnter = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      dragDepthRef.current += 1;
      setIsDraggingFile(true);
    };
    const onDragOver = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      // Required for the drop event to fire.
      event.preventDefault();
    };
    const onDragLeave = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setIsDraggingFile(false);
    };
    const onDrop = (event: DragEvent) => {
      dragDepthRef.current = 0;
      setIsDraggingFile(false);
      if (!isFileDrag(event)) return;
      event.preventDefault();
      const file = extractTransferFiles(event.dataTransfer)[0];
      if (file) handleDroppedFile(file);
    };

    document.addEventListener("dragenter", onDragEnter);
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragenter", onDragEnter);
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("drop", onDrop);
    };
  }, [hasCUDAccess, handleDroppedFile]);

  const { nameOptions, tagsOptions } = useDashboardFilterOptions({
    projectId,
    isBetaEnabled,
    timeRange,
  });

  const environmentOptionsState = useEnvironmentFilterOptionsCache({
    projectId,
    timeRange,
  });
  const environmentOptions = environmentOptionsState.environmentOptions.map(
    (value) => ({
      value,
    }),
  );

  // Dedicated environment selector, same as Home. The selection is a view
  // setting (persisted per project for this user), merged into the widget
  // filters but never written into the dashboard's saved filters.
  const { selectedEnvironments, setSelectedEnvironments } =
    useEnvironmentFilter(environmentOptionsState.environmentOptions, projectId);
  const environmentFilter = useMemo(
    () =>
      convertSelectedEnvironmentsToFilter(
        ["environment"],
        selectedEnvironments,
      ),
    [selectedEnvironments],
  );
  const gridFilterState: FilterState = useMemo(
    () => [...currentFilters, ...environmentFilter],
    [currentFilters, environmentFilter],
  );
  // Filter columns for PopoverFilterBuilder
  const filterColumns: ColumnDefinition[] = [
    {
      name: "Environment",
      id: "environment",
      type: "stringOptions",
      options: environmentOptions,
      internal: "internalValue",
    },
    {
      name: "Trace Name",
      id: "traceName",
      type: "stringOptions",
      options: nameOptions,
      internal: "internalValue",
    },
    {
      name: "Observation Name",
      id: "observationName",
      type: "string",
      internal: "internalValue",
    },
    {
      name: "Score Name",
      id: "scoreName",
      type: "string",
      internal: "internalValue",
    },
    {
      name: "Tags",
      id: "tags",
      type: "arrayOptions",
      options: tagsOptions,
      internal: "internalValue",
    },
    {
      name: "User",
      id: "user",
      type: "string",
      internal: "internalValue",
    },
    {
      name: "Session",
      id: "session",
      type: "string",
      internal: "internalValue",
    },
    {
      name: "Metadata",
      id: "metadata",
      type: "stringObject",
      internal: "internalValue",
    },
    {
      name: "Release",
      id: "release",
      type: "string",
      internal: "internalValue",
    },
    {
      name: "Version",
      id: "version",
      type: "string",
      internal: "internalValue",
    },
  ];

  // Fetch widget data if addWidgetId is present
  const widgetToAdd = api.dashboardWidgets.get.useQuery(
    { projectId, widgetId: addWidgetId || "" },
    {
      enabled: Boolean(projectId) && Boolean(addWidgetId),
    },
  );

  useEffect(() => {
    if (dashboard.data && !localDashboardDefinition) {
      setLocalDashboardDefinition(dashboard.data.definition);
    }
  }, [dashboard.data, localDashboardDefinition]);

  // Initialize filters from dashboard data
  useEffect(() => {
    if (dashboard.data?.filters) {
      setSavedFilters(dashboard.data.filters);
      setCurrentFilters(dashboard.data.filters);
    }
  }, [dashboard.data?.filters]);

  useEffect(() => {
    if (localDashboardDefinition && widgetToAdd.data && addWidgetId) {
      if (
        !localDashboardDefinition.widgets.some(
          (w) => w.type === "widget" && w.widgetId === addWidgetId,
        )
      ) {
        addWidgetToDashboard(widgetToAdd.data);
      }
      // Remove the addWidgetId query parameter
      router.replace({
        pathname: router.pathname,
        query: { projectId, dashboardId },
      });
    }
  }, [
    widgetToAdd.data,
    addWidgetId,
    addWidgetToDashboard,
    localDashboardDefinition,
    projectId,
    dashboardId,
    router,
  ]);

  // Handle deleting a widget
  const handleDeleteWidget = (tileId: string) => {
    if (localDashboardDefinition) {
      const updatedWidgets = localDashboardDefinition.widgets.filter(
        (widget) => widget.id !== tileId,
      );

      const updatedDefinition = {
        ...localDashboardDefinition,
        widgets: updatedWidgets,
      };

      if (isLockedEditable) {
        // Carry the removal into the clone instead of mutating.
        openCloneFirst("delete_widget", updatedDefinition);
        return;
      }

      applyDashboardDefinition(updatedDefinition);
    }
  };

  // Handle adding a widget
  const handleAddWidget = () => {
    if (isLockedEditable) {
      openCloneFirst("add_widget");
      return;
    }
    setIsWidgetDialogOpen(true);
  };

  // Handle widget selection from dialog
  const handleSelectWidget = (widget: WidgetItem) => {
    addWidgetToDashboard(widget);
  };

  const mutateCloneDashboard = api.dashboard.cloneDashboard.useMutation({
    onSuccess: (data) => {
      utils.dashboard.invalidate();
      capture("dashboard:clone_dashboard", { source: "detail_clone_button" });
      // Redirect to new dashboard
      if (data?.id) {
        router.replace(
          `/project/${projectId}/dashboards/${encodeURIComponent(data.id)}`,
        );
      }
    },
    onError: (e) => {
      showErrorToast(tAutoI18n("failed_to_clone_dashboard_b18bc33"), e.message);
    },
  });

  const handleCloneDashboard = () => {
    if (!projectId || !dashboardId) return;
    mutateCloneDashboard.mutate({ projectId, dashboardId });
  };

  const dashboardTimeRangePresets = DASHBOARD_AGGREGATION_OPTIONS;
  const widgetSchedulerPrefix = `dashboard:${projectId}:${dashboardId}:widget:`;

  const getWidgetSchedulerId = useCallback(
    (widgetPlacementId: string) =>
      `${widgetSchedulerPrefix}${widgetPlacementId}`,
    [widgetSchedulerPrefix],
  );

  // Reset key intentionally excludes the widget set: adding or removing a
  // widget must not re-queue in-flight or already-rendered siblings (which,
  // on the SSE path, blanks them while they re-stream — LFE-10986). A new
  // widget registers with the scheduler incrementally; a removed one
  // unregisters. Only genuinely query-affecting params belong here.
  const schedulerResetKey = useMemo(
    () =>
      getDashboardSchedulerResetKey({
        projectId,
        dashboardId,
        fromIso: absoluteTimeRange?.from?.toISOString() ?? "",
        toIso: absoluteTimeRange?.to?.toISOString() ?? "",
        filters: currentFilters,
        environments: selectedEnvironments,
      }),
    [
      absoluteTimeRange?.from,
      absoluteTimeRange?.to,
      currentFilters,
      dashboardId,
      projectId,
      selectedEnvironments,
    ],
  );

  const scheduler = useDashboardQueryScheduler({
    maxConcurrent: getDashboardQuerySchedulerMaxConcurrent(timeRange),
    resetKey: schedulerResetKey,
  });

  return (
    <DashboardQuerySchedulerProvider
      scheduler={scheduler}
      shouldBucketQueriesByTimeRange={!("from" in timeRange)}
    >
      <Page
        withPadding
        scrollable
        headerProps={{
          title:
            (dashboard.data?.name || tAuto("dashboard_d87f47b")) +
            (dashboard.data?.owner === "LANGFUSE"
              ? tAuto("langfuse_maintained_9517350")
              : ""),
          titleContent:
            hasCUDAccess && dashboard.data ? (
              <InlineEditText
                value={dashboard.data.name}
                required
                aria-label={tAuto("rename_dashboard_ceb1d6d")}
                onSave={(name) => {
                  capture("dashboard:dashboard_renamed_inline", {
                    dashboard_id: dashboardId,
                  });
                  updateDashboardMetadata.mutate({
                    projectId,
                    dashboardId,
                    name,
                    description: dashboard.data?.description ?? "",
                  });
                }}
              />
            ) : undefined,
          breadcrumb: [
            {
              name: "Dashboards",
              href: `/project/${projectId}/dashboards`,
            },
          ],
          help: {
            description:
              dashboard.data?.description ||
              tAuto("no_description_available_c017d28"),
          },
          actionButtonsLeft: (
            <>
              <MultiSelect
                title={tAuto("environment_d443a11")}
                label={tAuto("env_a256269")}
                values={selectedEnvironments}
                onValueChange={useDebounce(setSelectedEnvironments)}
                options={environmentOptions}
                className="my-0 w-auto overflow-hidden"
              />
              <PopoverFilterBuilder
                columns={filterColumns}
                filterState={currentFilters}
                onChange={setCurrentFilters}
                // Analytics (LFE-10781): custom dashboard filter — a v3/legacy
                // surface (not the v4 events table).
                tableName="dashboard"
                isV4={false}
              />
            </>
          ),
          actionButtonsRight: (
            <>
              {(updateDashboardDefinition.isPending ||
                updateDashboardMetadata.isPending ||
                updateDashboardFilters.isPending ||
                setHomeDashboard.isPending) && (
                <span
                  className="flex items-center"
                  title={tAuto("saving_ae7e887")}
                  role="status"
                  aria-label={tAuto("saving_369c534")}
                >
                  <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                </span>
              )}
              {hasCUDAccess && hasUnsavedFilterChanges && (
                <Button
                  onClick={handleSaveFilters}
                  disabled={updateDashboardFilters.isPending}
                  variant="outline"
                >
                  {updateDashboardFilters.isPending
                    ? tAutoI18n("saving_ae7e887")
                    : tAutoI18n("save_filters_2b8dcec")}
                </Button>
              )}
              {hasRbacCUDAccess && (
                <Button onClick={handleAddWidget}>
                  <PlusIcon size={16} className="mr-1 h-4 w-4" />
                  {tAuto("add_widget_a9df350")}{" "}
                </Button>
              )}
              {hasCloneAccess && (
                <Button
                  variant="outline"
                  onClick={handleCloneDashboard}
                  disabled={mutateCloneDashboard.isPending}
                >
                  <Copy size={16} className="mr-1 h-4 w-4" />
                  {tAuto("clone_d8cdb57")}{" "}
                </Button>
              )}
              {hasRbacCUDAccess && (
                <DropdownMenu onOpenChange={setIsDashboardMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={tAuto("more_actions_a1e34f9")}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {hasCUDAccess && (
                      <DropdownMenuItem
                        disabled={clipboardProbe === "no-widget"}
                        onClick={() =>
                          pasteWidgetFromClipboard("dashboard_menu")
                        }
                      >
                        <ClipboardPasteIcon className="mr-2 h-4 w-4" />
                        {tAuto("paste_widget_36b51b3")}{" "}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      disabled={isCurrentHome || setHomeDashboard.isPending}
                      onClick={() => {
                        capture("dashboard:home_dashboard_set_default", {
                          dashboard_id: dashboardId,
                          source: "detail_menu",
                        });
                        setHomeDashboard.mutate({
                          projectId,
                          dashboardId:
                            dashboardId === LANGFUSE_HOME_DASHBOARD_ID
                              ? null
                              : dashboardId,
                        });
                      }}
                    >
                      <HomeIcon className="mr-2 h-4 w-4" />
                      {isCurrentHome
                        ? tAutoI18n("shown_on_home_f9c3383")
                        : tAutoI18n("use_as_home_68ed0d8")}
                    </DropdownMenuItem>
                    {hasCUDAccess && (
                      <DropdownMenuItem
                        onClick={() => setIsEditDialogOpen(true)}
                      >
                        <PencilIcon className="mr-2 h-4 w-4" />
                        {tAuto("edit_name_description_384960e")}{" "}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          ),
        }}
      >
        <PageHeaderControlsPortal>
          <TimeRangePicker
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            timeRangePresets={dashboardTimeRangePresets}
            className="my-0 max-w-full overflow-x-auto"
            triggerClassName="px-2"
            disabled={
              lookbackLimit
                ? {
                    before: new Date(
                      new Date().getTime() -
                        lookbackLimit * 24 * 60 * 60 * 1000,
                    ),
                  }
                : undefined
            }
          />
        </PageHeaderControlsPortal>
        {isDraggingFile && (
          <Layer name="modal">
            <div className="bg-background/80 pointer-events-none fixed inset-0 flex items-center justify-center backdrop-blur-xs">
              <div className="border-primary bg-background rounded-lg border-2 border-dashed px-8 py-6 text-center shadow-lg">
                <p className="font-bold">{tAuto("drop_to_import_05eb875")}</p>
                <p className="text-muted-foreground text-sm">
                  {tAuto("langfuse_dashboard_or_widget_json_3f600ab")}{" "}
                </p>
              </div>
            </div>
          </Layer>
        )}
        <SelectWidgetDialog
          open={isWidgetDialogOpen}
          onOpenChange={setIsWidgetDialogOpen}
          projectId={projectId}
          onSelectWidget={handleSelectWidget}
          onSelectPreset={addPresetToDashboard}
          dashboardId={dashboardId}
        />
        {isEditDialogOpen && dashboard.data && (
          <EditDashboardDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            projectId={projectId}
            dashboardId={dashboardId}
            initialName={dashboard.data.name}
            initialDescription={dashboard.data.description}
          />
        )}
        <CloneFirstDialog
          open={cloneFirstState.open}
          onOpenChange={(open) =>
            setCloneFirstState((prev) => ({ ...prev, open }))
          }
          projectId={projectId}
          dashboardId={dashboardId}
          dashboardName={dashboard.data?.name ?? "Dashboard"}
          pendingDefinition={cloneFirstState.pendingDefinition}
          onCancel={() => {
            // Revert the attempted drag/resize by remounting the grid with
            // the unchanged definition.
            setCloneFirstState({ open: false, pendingDefinition: null });
            setGridResetKey((key) => key + 1);
          }}
        />
        {dashboard.isPending || !localDashboardDefinition ? (
          <NoDataOrLoading isLoading={true} />
        ) : dashboard.isError ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-destructive">
              {tAutoI18n("error_787aa16")} {dashboard.error.message}
            </div>
          </div>
        ) : (
          <div>
            <DashboardGrid
              key={gridResetKey}
              widgets={localDashboardDefinition.widgets}
              onChange={(updatedWidgets) => {
                if (isLockedEditable) {
                  // Carry the attempted layout change into the clone.
                  openCloneFirst("layout_change", {
                    ...localDashboardDefinition,
                    widgets: updatedWidgets,
                  });
                  return;
                }
                applyDashboardDefinition({
                  ...localDashboardDefinition,
                  widgets: updatedWidgets,
                });
              }}
              canEdit={hasRbacCUDAccess}
              dashboardId={dashboardId}
              projectId={projectId}
              dateRange={absoluteTimeRange}
              filterState={gridFilterState}
              onDeleteWidget={handleDeleteWidget}
              dashboardOwner={dashboard.data?.owner}
              getWidgetSchedulerId={getWidgetSchedulerId}
              onLockedEditAttempt={
                isLockedEditable
                  ? () => openCloneFirst("widget_pencil")
                  : undefined
              }
              onDuplicateWidget={
                hasCUDAccess ? handleDuplicateWidget : undefined
              }
              onDuplicatePreset={
                hasCUDAccess ? handleDuplicatePreset : undefined
              }
              onPasteWidget={
                hasCUDAccess
                  ? (anchor) => {
                      pasteWidgetFromClipboard("paste_right", anchor);
                    }
                  : undefined
              }
            />
          </div>
        )}
      </Page>
    </DashboardQuerySchedulerProvider>
  );
}
