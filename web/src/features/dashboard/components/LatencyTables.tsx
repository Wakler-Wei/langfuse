/* eslint-disable @repo/no-style-props */
import { RightAlignedCell } from "@/src/features/dashboard/components/RightAlignedCell";
import { DashboardCard } from "@/src/features/dashboard/components/cards/DashboardCard";
import { DashboardTable } from "@/src/features/dashboard/components/cards/DashboardTable";
import {
  ObservationType,
  type FilterState,
  getGenerationLikeTypes,
} from "@langfuse/shared";

import { formatIntervalSeconds } from "@/src/utils/dates";
import { truncate } from "@/src/utils/string";
import { cn } from "@/src/utils/tailwind";
import { Popup } from "@/src/components/layouts/doc-popup";
import { type QueryType, type ViewVersion } from "@langfuse/shared/query";
import { mapLegacyUiTableFilterToView } from "@/src/features/dashboard/lib/dashboardUiTableToViewMapping";
import { useScheduledDashboardExecuteQuery } from "@/src/hooks/useDashboardQueryScheduler";
import { I18nText, useAutoTranslations } from "@/src/features/i18n/I18nText";

export type LatencyTableKind = "traces" | "generations" | "observations";

const LATENCY_TABLE_KINDS: Record<
  LatencyTableKind,
  {
    title: React.ReactNode;
    nameHeader: string;
    buildQuery: (
      globalFilterState: FilterState,
      fromTimestamp: Date,
      toTimestamp: Date,
    ) => QueryType;
  }
> = {
  traces: {
    title: <I18nText id="trace_latency_percentiles_5e2c5f0" />,
    nameHeader: "Trace Name",
    buildQuery: (globalFilterState, fromTimestamp, toTimestamp) => ({
      view: "traces",
      dimensions: [{ field: "name" }],
      metrics: [
        { measure: "latency", aggregation: "p50" },
        { measure: "latency", aggregation: "p90" },
        { measure: "latency", aggregation: "p95" },
        { measure: "latency", aggregation: "p99" },
      ],
      filters: mapLegacyUiTableFilterToView("traces", globalFilterState),
      timeDimension: null,
      fromTimestamp: fromTimestamp.toISOString(),
      toTimestamp: toTimestamp.toISOString(),
      orderBy: [{ field: "p95_latency", direction: "desc" }],
      chartConfig: { type: "table", row_limit: 20 },
    }),
  },
  generations: {
    title: <I18nText id="generation_latency_percentiles_0f63cd7" />,
    nameHeader: "Generation Name",
    buildQuery: (globalFilterState, fromTimestamp, toTimestamp) => ({
      view: "observations",
      dimensions: [{ field: "name" }],
      metrics: [
        { measure: "latency", aggregation: "p50" },
        { measure: "latency", aggregation: "p90" },
        { measure: "latency", aggregation: "p95" },
        { measure: "latency", aggregation: "p99" },
      ],
      filters: [
        ...mapLegacyUiTableFilterToView("observations", globalFilterState),
        {
          column: "type",
          operator: "any of",
          value: getGenerationLikeTypes(),
          type: "stringOptions",
        },
      ],
      timeDimension: null,
      fromTimestamp: fromTimestamp.toISOString(),
      toTimestamp: toTimestamp.toISOString(),
      orderBy: [{ field: "p95_latency", direction: "desc" }],
      chartConfig: { type: "table", row_limit: 20 },
    }),
  },
  observations: {
    title: <I18nText id="observation_latency_percentiles_7bd75fd" />,
    nameHeader: "Observation",
    buildQuery: (globalFilterState, fromTimestamp, toTimestamp) => ({
      view: "observations",
      dimensions: [{ field: "type" }, { field: "name" }],
      metrics: [
        { measure: "latency", aggregation: "p50" },
        { measure: "latency", aggregation: "p90" },
        { measure: "latency", aggregation: "p95" },
        { measure: "latency", aggregation: "p99" },
      ],
      filters: [
        ...mapLegacyUiTableFilterToView("observations", globalFilterState),
        {
          column: "type",
          operator: "none of",
          value: [ObservationType.GENERATION],
          type: "stringOptions",
        },
      ],
      timeDimension: null,
      fromTimestamp: fromTimestamp.toISOString(),
      toTimestamp: toTimestamp.toISOString(),
      orderBy: [{ field: "p95_latency", direction: "desc" }],
      chartConfig: { type: "table", row_limit: 20 },
    }),
  },
};

const generateLatencyData = (data?: Record<string, unknown>[]) => {
  return data
    ? data
        .filter((item) => item.name !== null)
        .map((item, i) => [
          <div key={`${item.name as string}-${i}`}>
            <Popup
              triggerContent={
                item.type ? (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[10px] font-bold tracking-wide uppercase">
                      {String(item.type)}
                    </span>
                    <span>{truncate(item.name as string)}</span>
                  </div>
                ) : (
                  truncate(item.name as string)
                )
              }
              description={
                item.type
                  ? `${String(item.type)} · ${item.name as string}`
                  : (item.name as string)
              }
            />
          </div>,
          <RightAlignedCell key={`${i}-p50`}>
            {item.p50_latency
              ? formatIntervalSeconds(Number(item.p50_latency) / 1000, 2)
              : "-"}
          </RightAlignedCell>,
          <RightAlignedCell key={`${i}-p90`}>
            {item.p90_latency
              ? formatIntervalSeconds(Number(item.p90_latency) / 1000, 2)
              : "-"}
          </RightAlignedCell>,
          <RightAlignedCell key={`${i}-p95`}>
            {item.p95_latency
              ? formatIntervalSeconds(Number(item.p95_latency) / 1000, 2)
              : "-"}
          </RightAlignedCell>,
          <RightAlignedCell key={`${i}-p99`}>
            {item.p99_latency
              ? formatIntervalSeconds(Number(item.p99_latency) / 1000, 2)
              : "-"}
          </RightAlignedCell>,
        ])
    : [];
};

export const LatencyTable = ({
  kind,
  className,
  projectId,
  globalFilterState,
  fromTimestamp,
  toTimestamp,
  isLoading = false,
  metricsVersion,
  schedulerId,
}: {
  kind: LatencyTableKind;
  className?: string;
  projectId: string;
  globalFilterState: FilterState;
  fromTimestamp: Date;
  toTimestamp: Date;
  isLoading?: boolean;
  metricsVersion?: ViewVersion;
  schedulerId?: string;
}) => {
  const tAuto = useAutoTranslations();
  const { title, nameHeader, buildQuery } = LATENCY_TABLE_KINDS[kind];

  const latencies = useScheduledDashboardExecuteQuery(
    {
      projectId,
      query: buildQuery(globalFilterState, fromTimestamp, toTimestamp),
      version: metricsVersion,
    },
    {
      trpc: {
        context: {
          skipBatch: true,
        },
      },
      queryId: schedulerId ?? `home:latency-table-${kind}`,
      enabled: !isLoading,
    },
  );

  return (
    <DashboardCard
      // h-full pins the card to the tile so the table fits its rows to the
      // AVAILABLE height instead of overflowing; min-h-0 lets the flex column
      // shrink so the row area scrolls internally. (LFE-11035)
      className={cn(className, "h-full")}
      cardContentClassName="min-h-0"
      title={title}
      isLoading={isLoading || latencies.isPending}
    >
      <DashboardTable
        headers={[
          nameHeader,
          <RightAlignedCell key="p50">{tAuto("p50_42e3121")}</RightAlignedCell>,
          <RightAlignedCell key="p90">{tAuto("p90_8359621")}</RightAlignedCell>,
          <RightAlignedCell key="p95">
            {tAuto("p95_e375f5b")}
            <span className="ml-1">▼</span>
          </RightAlignedCell>,
          <RightAlignedCell key="p99">{tAuto("p99_70e80eb")}</RightAlignedCell>,
        ]}
        rows={generateLatencyData(latencies.data)}
        isLoading={isLoading || latencies.isPending}
        collapse={{ collapsed: 5, expanded: 20 }}
      />
    </DashboardCard>
  );
};
