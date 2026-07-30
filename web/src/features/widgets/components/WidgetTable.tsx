import { useEffect } from "react";
import useProjectIdFromURL from "@/src/hooks/useProjectIdFromURL";
import { useOrderByState } from "@/src/features/orderBy/hooks/useOrderByState";
import { NumberParam, useQueryParams, withDefault } from "use-query-params";
import { api } from "@/src/utils/api";
import { DataTable } from "@/src/components/table/data-table";
import { type LangfuseColumnDef } from "@/src/components/table/types";
import { createColumnHelper } from "@tanstack/react-table";
import TableLink from "@/src/components/table/table-link";
import { LocalIsoDate } from "@/src/components/LocalIsoDate";
import { useDetailPageLists } from "@/src/features/navigate-detail-pages/context";
import startCase from "lodash/startCase";
import { Button } from "@/src/components/ui/button";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { Copy, CopyPlus, FileJson, MoreVertical, Trash } from "lucide-react";
import { useState } from "react";
import {
  buildWidgetExport,
  downloadWidgetJson,
  toWidgetCreateFields,
  type WidgetExportSource,
} from "@/src/features/widgets/utils/import-export-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import { copyTextToClipboard } from "@/src/utils/clipboard";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { useRouter } from "next/router";
import { getChartTypeDisplayName } from "@/src/features/widgets/chart-library/utils";
import { type DashboardWidgetChartType } from "@langfuse/shared/src/db";
import { type metricAggregations } from "@langfuse/shared/query";
import { type z } from "zod";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type WidgetTableRow = {
  id: string;
  name: string;
  description: string;
  view: string;
  chartType: string;
  createdAt: Date;
  updatedAt: Date;
  owner: "PROJECT" | "LANGFUSE";
};

function WidgetActionsCell({
  widgetId,
  owner,
}: {
  widgetId: string;
  owner: "PROJECT" | "LANGFUSE";
}) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const projectId = useProjectIdFromURL();
  const utils = api.useUtils();
  const capture = usePostHogClientCapture();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const hasCUDAccess = useHasProjectAccess({
    projectId,
    scope: "dashboards:CUD",
  });
  const hasDeleteAccess = hasCUDAccess && owner !== "LANGFUSE";

  const mutDeleteWidget = api.dashboardWidgets.delete.useMutation({
    onSuccess: () => {
      utils.dashboardWidgets.invalidate();
      capture("dashboard:delete_widget_form_open");
    },
    onError: (error) => {
      if (error.data?.code === "CONFLICT") {
        showErrorToast(
          tAutoI18n("widget_in_use_e34ce15"),
          tAutoI18n(
            "widget_is_still_in_use_please_remove_it_from_all_das_57eca0a",
          ),
        );
      } else {
        showErrorToast(
          tAutoI18n("failed_to_delete_widget_f6cb757"),
          error.message,
        );
      }
    },
  });
  const { mutateAsync: createWidgetAsync } =
    api.dashboardWidgets.create.useMutation();

  const fetchExportSource = async (): Promise<WidgetExportSource> => {
    if (!projectId) {
      throw new Error("Project ID is missing");
    }
    const widget = await utils.dashboardWidgets.get.fetch(
      {
        projectId,
        widgetId,
      },
      // Serve rapid repeat actions (double-click, copy-then-download) from
      // the cache instead of firing a request per menu click.
      { staleTime: 30_000 },
    );

    return {
      name: widget.name,
      description: widget.description,
      view: widget.view,
      dimensions: widget.dimensions,
      metrics: widget.metrics.map((metric) => ({
        measure: metric.measure,
        agg: metric.agg as z.infer<typeof metricAggregations>,
      })),
      filters: widget.filters,
      chartType: widget.chartType,
      chartConfig: widget.chartConfig,
      minVersion: widget.minVersion,
    };
  };

  const handleDownloadJson = async () => {
    try {
      downloadWidgetJson(await fetchExportSource());
      capture("dashboard:widget_json_downloaded", {
        surface: "widget_table",
        widget_id: widgetId,
      });
    } catch (error) {
      showErrorToast(
        tAutoI18n("failed_to_download_widget_4113ff8"),
        error instanceof Error
          ? error.message
          : tAutoI18n("unknown_error_e5fd9aa"),
      );
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const exportSource = await fetchExportSource();
      await copyTextToClipboard(
        JSON.stringify(buildWidgetExport(exportSource), null, 2),
      );
      capture("dashboard:widget_copied_to_clipboard", {
        surface: "widget_table",
        kind: "widget",
        widget_id: widgetId,
      });
    } catch (error) {
      showErrorToast(
        tAutoI18n("failed_to_copy_widget_1691171"),
        error instanceof Error
          ? error.message
          : tAutoI18n("unknown_error_e5fd9aa"),
      );
    }
  };

  const handleDuplicate = async () => {
    try {
      if (!projectId) {
        throw new Error("Project ID is missing");
      }
      const exportSource = await fetchExportSource();
      await createWidgetAsync({
        projectId,
        ...toWidgetCreateFields(exportSource),
        name: `${exportSource.name} (Copy)`,
      });
      capture("dashboard:widget_duplicated", {
        surface: "widget_table",
        kind: "widget",
        chart_type: exportSource.chartType,
        view: exportSource.view,
      });
      utils.dashboardWidgets.invalidate();
      showSuccessToast({
        title: tAuto("widget_duplicated_3a75609"),
        description: tAuto("created_value0_copy_1b213a2", {
          value0: exportSource.name,
        }),
      });
    } catch (error) {
      showErrorToast(
        tAutoI18n("failed_to_duplicate_widget_f68f6a1"),
        error instanceof Error
          ? error.message
          : tAutoI18n("unknown_error_e5fd9aa"),
      );
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="xs"
            aria-label={tAuto("widget_actions_2659cd3")}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCopyToClipboard}>
            <Copy className="mr-2 h-4 w-4" />
            {tAuto("copy_to_clipboard_d8f482e")}{" "}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!hasCUDAccess} onClick={handleDuplicate}>
            <CopyPlus className="mr-2 h-4 w-4" />
            {tAuto("duplicate_972d573")}{" "}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadJson}>
            <FileJson className="mr-2 h-4 w-4" />
            {tAuto("download_as_json_a1d2758")}{" "}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!hasDeleteAccess}
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            {tAuto("delete_f6fdbe4")}{" "}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={tAuto("delete_widget_6306b40")}
        description={tAuto(
          "this_action_permanently_deletes_this_widget_if_the_w_28b5f7c",
        )}
        confirmLabel="Delete Widget"
        loading={mutDeleteWidget.isPending}
        onConfirm={() => {
          if (!projectId) {
            console.error("Project ID is missing");
            return;
          }
          mutDeleteWidget.mutate({ projectId, widgetId });
          setIsDeleteDialogOpen(false);
        }}
      />
    </>
  );
}

export function DashboardWidgetTable() {
  const tAuto = useAutoTranslations();
  const projectId = useProjectIdFromURL();
  const { setDetailPageList } = useDetailPageLists();
  const router = useRouter();

  const [orderByState, setOrderByState] = useOrderByState({
    column: "updatedAt",
    order: "DESC",
  });
  const [paginationState, setPaginationState] = useQueryParams({
    pageIndex: withDefault(NumberParam, 0),
    pageSize: withDefault(NumberParam, 50),
  });

  const widgets = api.dashboardWidgets.all.useQuery(
    {
      page: paginationState.pageIndex,
      limit: paginationState.pageSize,
      projectId: projectId as string, // Typecast as query is enabled only when projectId is present
      orderBy: orderByState,
    },
    {
      enabled: Boolean(projectId),
      trpc: {
        context: {
          skipBatch: true,
        },
      },
    },
  );

  useEffect(() => {
    if (widgets.isSuccess) {
      setDetailPageList(
        "widgets",
        widgets.data?.widgets.map((w) => ({ id: w.id })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgets.isSuccess, widgets.data]);

  const columnHelper = createColumnHelper<WidgetTableRow>();
  const widgetColumns = [
    columnHelper.accessor("name", {
      header: tAuto("name_709a232"),
      id: "name",
      enableSorting: true,
      size: 200,
      cell: (row) => {
        const name = row.getValue();
        return name ? (
          <TableLink
            path={`/project/${projectId}/widgets/${encodeURIComponent(row.row.original.id)}`}
            value={name}
          />
        ) : undefined;
      },
    }),
    columnHelper.accessor("description", {
      header: tAuto("description_55f8ebc"),
      id: "description",
      size: 300,
      cell: (row) => {
        return row.getValue();
      },
    }),
    columnHelper.accessor("view", {
      header: tAuto("view_type_f102254"),
      id: "view",
      enableSorting: true,
      size: 100,
      cell: (row) => {
        return startCase(row.getValue().toLowerCase());
      },
    }),
    columnHelper.accessor("chartType", {
      header: tAuto("chart_type_d8c1079"),
      id: "chartType",
      enableSorting: true,
      size: 100,
      cell: (row) =>
        getChartTypeDisplayName(row.getValue() as DashboardWidgetChartType),
    }),
    columnHelper.accessor("createdAt", {
      header: tAuto("created_at_5db1542"),
      id: "createdAt",
      enableSorting: true,
      size: 150,
      cell: (row) => {
        const createdAt = row.getValue();
        return <LocalIsoDate date={createdAt} />;
      },
    }),
    columnHelper.accessor("updatedAt", {
      header: tAuto("updated_at_2271427"),
      id: "updatedAt",
      enableSorting: true,
      size: 150,
      cell: (row) => {
        const updatedAt = row.getValue();
        return <LocalIsoDate date={updatedAt} />;
      },
    }),
    columnHelper.display({
      id: "actions",
      header: tAuto("actions_c3cd636"),
      size: 70,
      cell: (row) => {
        const id = row.row.original.id;
        return (
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <WidgetActionsCell widgetId={id} owner={row.row.original.owner} />
          </div>
        );
      },
    }),
  ] as LangfuseColumnDef<WidgetTableRow>[];

  return (
    <DataTable
      tableName="widgets"
      columns={widgetColumns}
      data={
        widgets.isLoading
          ? { isLoading: true, isError: false }
          : widgets.isError
            ? {
                isLoading: false,
                isError: true,
                error: widgets.error.message,
              }
            : {
                isLoading: false,
                isError: false,
                data: widgets.data?.widgets ?? [],
              }
      }
      orderBy={orderByState}
      setOrderBy={setOrderByState}
      cellPadding="comfortable"
      pagination={{
        totalCount: widgets.data?.totalCount ?? null,
        onChange: setPaginationState,
        state: paginationState,
      }}
      onRowClick={(row) => {
        router.push(
          `/project/${projectId}/widgets/${encodeURIComponent(row.id)}`,
        );
      }}
    />
  );
}
