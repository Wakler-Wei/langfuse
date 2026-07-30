import { StatusBadge } from "@/src/components/ui/StatusBadge/StatusBadge";
import { DataTable } from "@/src/components/table/data-table";
import {
  type CustomHeights,
  useRowHeightLocalStorage,
} from "@/src/components/table/data-table-row-height-switch";
import { DataTableToolbar } from "@/src/components/table/data-table-toolbar";
import {
  DataTableControlsProvider,
  DataTableControls,
} from "@/src/components/table/data-table-controls";
import { ResizableFilterLayout } from "@/src/components/table/resizable-filter-layout";
import TableLink from "@/src/components/table/table-link";
import { type LangfuseColumnDef } from "@/src/components/table/types";
import { IOTableCell } from "@/src/components/ui/IOTableCell";
import useColumnOrder from "@/src/features/column-visibility/hooks/useColumnOrder";
import useColumnVisibility from "@/src/features/column-visibility/hooks/useColumnVisibility";
import { useSidebarFilterState } from "@/src/features/filters/hooks/useSidebarFilterState";
import { evalLogFilterConfig } from "@/src/features/filters/config/eval-logs-config";
import { type RouterOutputs, api } from "@/src/utils/api";
import { safeExtract } from "@/src/utils/map-utils";
import { type Prisma } from "@langfuse/shared";
import { createColumnHelper } from "@tanstack/react-table";
import { useQueryParams, withDefault, NumberParam } from "use-query-params";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export type JobExecutionRow = {
  status: string;
  scoreName?: string;
  scoreValue?: number | string;
  scoreComment?: string;
  scoreMetadata?: Prisma.JsonValue;
  startTime?: string;
  endTime?: string;
  traceId?: string;
  executionTraceId?: string;
  templateId: string;
  evaluatorId: string;
  error?: string;
};

const evalLogRowHeights: CustomHeights = {
  s: "h-8",
  m: "h-24",
  l: "h-64",
};

export default function EvalLogTable({
  projectId,
  jobConfigurationId,
}: {
  projectId: string;
  jobConfigurationId?: string;
}) {
  const tAuto = useAutoTranslations();
  const [rowHeight, setRowHeight] = useRowHeightLocalStorage("evalLogs", "s");
  const [paginationState, setPaginationState] = useQueryParams({
    pageIndex: withDefault(NumberParam, 0),
    pageSize: withDefault(NumberParam, 50),
  });

  const queryFilter = useSidebarFilterState(
    evalLogFilterConfig,
    {}, // No dynamic options needed - status options are in column definition
    {
      loading: false,
      stateLocation: "urlAndSessionStorage",
      sessionFilterContextId: projectId,
    },
  );

  const logs = api.evals.getLogs.useQuery({
    page: paginationState.pageIndex,
    limit: paginationState.pageSize,
    filter: queryFilter.filterState,
    jobConfigurationId,
    projectId,
  });
  const totalCount = logs.data?.totalCount ?? null;

  const columnHelper = createColumnHelper<JobExecutionRow>();
  const columns = [
    columnHelper.accessor("status", {
      header: tAuto("status_bae7d5b"),
      id: "status",
      cell: (row) => {
        const status = row.getValue();
        return (
          <div className="w-fit self-start">
            <StatusBadge type={status.toLowerCase()} />
          </div>
        );
      },
    }),
    columnHelper.accessor("startTime", {
      id: "startTime",
      header: tAuto("start_time_41c1074"),
      enableHiding: true,
    }),
    columnHelper.accessor("endTime", {
      id: "endTime",
      header: tAuto("end_time_4c640e9"),
      enableHiding: true,
    }),
    columnHelper.accessor("scoreName", {
      header: tAuto("score_name_38bc700"),
      id: "scoreName",
      enableHiding: true,
    }),
    columnHelper.accessor("scoreValue", {
      header: tAuto("score_value_82f9789"),
      id: "scoreValue",
      enableHiding: true,
      cell: (row) => {
        const value = row.getValue();
        if (value === undefined) {
          return undefined;
        }
        if (typeof value === "number") {
          return value % 1 === 0 ? value : value.toFixed(4);
        }
        return value;
      },
    }),
    columnHelper.accessor("scoreComment", {
      header: tAuto("score_comment_b48fca0"),
      id: "scoreComment",
      enableHiding: true,
      cellPadding: "none",
      loadingCell: () => (
        <IOTableCell
          isLoading
          data={undefined}
          padding="compact"
          singleLine={rowHeight === "s"}
        />
      ),
      cell: (row) => {
        const value = row.getValue();
        return (
          value !== undefined && (
            <IOTableCell
              data={value}
              padding="compact"
              singleLine={rowHeight === "s"}
            />
          )
        );
      },
    }),
    columnHelper.accessor("error", {
      id: "error",
      header: tAuto("error_7f2f6a1"),
      enableHiding: true,
      cellPadding: "none",
      loadingCell: () => (
        <IOTableCell
          isLoading
          data={undefined}
          padding="compact"
          singleLine={rowHeight === "s"}
        />
      ),
      cell: (row) => {
        const value = row.getValue();
        return (
          value !== undefined && (
            <IOTableCell
              data={value}
              padding="compact"
              singleLine={rowHeight === "s"}
            />
          )
        );
      },
    }),
    columnHelper.accessor("traceId", {
      id: "traceId",
      header: tAuto("target_trace_fa83851"),
      cell: (row) => {
        const traceId = row.getValue();
        return traceId ? (
          <TableLink
            path={`/project/${projectId}/traces/${encodeURIComponent(traceId)}`}
            value={traceId}
          />
        ) : undefined;
      },
    }),
    columnHelper.accessor("executionTraceId", {
      id: "executionTraceId",
      header: tAuto("execution_trace_ff5c4b1"),
      enableHiding: true,
      cell: (row) => {
        const traceId = row.getValue();
        return traceId ? (
          <TableLink
            path={`/project/${projectId}/traces/${encodeURIComponent(traceId)}`}
            value={traceId}
          />
        ) : undefined;
      },
    }),
    columnHelper.accessor("templateId", {
      id: "templateId",
      header: tAuto("template_3ec1ae0"),
      cell: (row) => {
        const templateId = row.getValue();
        return templateId ? (
          <TableLink
            path={`/project/${projectId}/evals/templates/${encodeURIComponent(templateId)}`}
            value={templateId}
          />
        ) : undefined;
      },
    }),
  ] as LangfuseColumnDef<JobExecutionRow>[];

  if (!jobConfigurationId) {
    columns.push(
      columnHelper.accessor("evaluatorId", {
        id: "evaluatorId",
        header: tAuto("evaluator_191ad26"),
        cell: (row) => {
          const evaluatorId = row.getValue();
          return evaluatorId ? (
            <TableLink
              path={`/project/${projectId}/evals/${encodeURIComponent(evaluatorId)}`}
              value={evaluatorId}
            />
          ) : undefined;
        },
      }) as LangfuseColumnDef<JobExecutionRow>,
    );
  }

  const [columnVisibility, setColumnVisibility] =
    useColumnVisibility<JobExecutionRow>("evalLogColumnVisibility", columns);

  const [columnOrder, setColumnOrder] = useColumnOrder<JobExecutionRow>(
    "evalLogColumnOrder",
    columns,
  );

  const convertToTableRow = (
    jobConfig: RouterOutputs["evals"]["getLogs"]["data"][number],
  ): JobExecutionRow => {
    return {
      status: jobConfig.status,
      scoreName: jobConfig.score?.name ?? undefined,
      scoreValue:
        jobConfig.score?.stringValue ?? jobConfig.score?.value ?? undefined,
      scoreComment: jobConfig.score?.comment ?? undefined,
      scoreMetadata: jobConfig.score?.metadata ?? undefined,
      startTime: jobConfig.startTime?.toLocaleString() ?? undefined,
      endTime: jobConfig.endTime?.toLocaleString() ?? undefined,
      traceId: jobConfig.jobInputTraceId ?? undefined,
      executionTraceId: jobConfig.executionTraceId ?? undefined,
      templateId: jobConfig.jobTemplateId ?? "",
      evaluatorId: jobConfig.jobConfigurationId,
      error: jobConfig.error ?? undefined,
    };
  };

  return (
    <DataTableControlsProvider
      tableName={evalLogFilterConfig.tableName}
      defaultSidebarCollapsed={evalLogFilterConfig.defaultSidebarCollapsed}
    >
      <div className="flex h-full w-full flex-col">
        <DataTableToolbar
          columns={columns}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
          columnOrder={columnOrder}
          setColumnOrder={setColumnOrder}
          rowHeight={rowHeight}
          setRowHeight={setRowHeight}
          filterState={queryFilter.filterState}
        />

        <ResizableFilterLayout>
          <DataTableControls queryFilter={queryFilter} />

          <div className="flex flex-1 flex-col overflow-hidden">
            <DataTable
              tableName="evalLogs"
              columns={columns}
              data={
                logs.isLoading
                  ? { isLoading: true, isError: false }
                  : logs.isError
                    ? {
                        isLoading: false,
                        isError: true,
                        error: logs.error.message,
                      }
                    : {
                        isLoading: false,
                        isError: false,
                        data: safeExtract(logs.data, "data", []).map((t) =>
                          convertToTableRow(t),
                        ),
                      }
              }
              pagination={{
                totalCount,
                onChange: setPaginationState,
                state: paginationState,
              }}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={setColumnVisibility}
              columnOrder={columnOrder}
              onColumnOrderChange={setColumnOrder}
              customRowHeights={evalLogRowHeights}
              rowHeight={rowHeight}
            />
          </div>
        </ResizableFilterLayout>
      </div>
    </DataTableControlsProvider>
  );
}
