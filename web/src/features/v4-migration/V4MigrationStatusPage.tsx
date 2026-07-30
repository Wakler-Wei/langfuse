import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { ArrowRight } from "lucide-react";
import ContainerPage from "@/src/components/layouts/container-page";
import { Card } from "@/src/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { useCopyMigrationPrompt } from "@/src/features/v4-migration/V4MigrationContent";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { api } from "@/src/utils/api";
import { formatCompactRelativeTime } from "@/src/utils/dates";
import { cn } from "@/src/utils/tailwind";
import { useV4UpgradeUiEnabled } from "@/src/features/v4-migration/useV4UpgradeUiEnabled";
import { useOpenV4MigrationPanel } from "@/src/features/v4-migration/hooks/useOpenV4MigrationPanel";
import {
  useAccountV4MigrationData,
  type V4MigrationOrganization,
} from "@/src/features/v4-migration/hooks/useV4MigrationData";
import {
  getProjectMigrationReadiness,
  type MigrationCountState,
  type ProjectMigrationReadiness,
  type ProjectMigrationStatus,
} from "@/src/features/v4-migration/migrationData";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

const V4_DOCS_URL = "https://langfuse.com/docs/v4";
const SDK_UPGRADE_URL =
  "https://langfuse.com/docs/observability/sdk/upgrade-path";
const DATA_MODEL_URL = "https://langfuse.com/docs/observability/data-model";
const OBSERVATIONS_FAQ_URL =
  "https://langfuse.com/faq/all/explore-observations-in-v4";
const API_REFERENCE_URL = "https://api.reference.langfuse.com";

function FaqLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-dark-blue hover:underline"
    >
      {children}
    </a>
  );
}

function AffectedCell({ count }: { count: MigrationCountState }) {
  const tAuto = useAutoTranslations();
  if (count.status === "loading") {
    return (
      <span className="text-foreground-tertiary">
        {tAuto("checking_820d600")}
      </span>
    );
  }
  if (count.status === "error") {
    return (
      <span className="text-foreground-tertiary">
        {tAuto("unavailable_2c9c1f7")}
      </span>
    );
  }
  if (count.count === 0) {
    return <span className="text-foreground-tertiary">0</span>;
  }
  return <span>{count.count}</span>;
}

function StatusPill({ readiness }: { readiness: ProjectMigrationReadiness }) {
  const tAuto = useAutoTranslations();
  const label =
    readiness === "ready"
      ? tAuto("migrated_80ed70f")
      : readiness === "checking"
        ? tAuto("checking_97876b8")
        : readiness === "unavailable"
          ? tAuto("unavailable_2c9c1f7")
          : tAuto("action_needed_c923286");

  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap",
        readiness === "ready"
          ? "bg-light-green text-dark-green"
          : readiness === "checking" || readiness === "unavailable"
            ? "bg-muted text-muted-foreground"
            : "bg-light-yellow text-dark-yellow",
      )}
    >
      {label}
    </span>
  );
}

type SortKey =
  | "name"
  | "status"
  | "sdk"
  | "evals"
  | "apis"
  | "exports"
  | "lastTrace";
type OrderBy = { column: SortKey; order: "ASC" | "DESC" } | null;

// Header styling and none → DESC → ASC → none sort cycle copied from the
// trace table (DataTable); sorting here is client-side over the static rows.
function SortableHead({
  label,
  column,
  orderBy,
  onSort,
}: {
  label: string;
  column: SortKey;
  orderBy: OrderBy;
  onSort: (column: SortKey) => void;
}) {
  const tAuto = useAutoTranslations();
  return (
    <TableHead
      className="group cursor-pointer px-2"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center select-none">
        <span className="truncate leading-normal" title={label}>
          {label}
        </span>
        {orderBy?.column === column && (
          <span className="ml-1" title={tAuto("sort_by_this_column_ffda121")}>
            {orderBy.order === "ASC" ? "▲" : "▼"}
          </span>
        )}
      </div>
    </TableHead>
  );
}

function OrgStatusSection({
  org,
  statusByProjectId,
}: {
  org: V4MigrationOrganization;
  statusByProjectId: Map<string, ProjectMigrationStatus>;
}) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const capture = usePostHogClientCapture();
  const openMigrationPanel = useOpenV4MigrationPanel();
  const { data: lastTraceTimes } =
    api.organizations.lastTraceByProject.useQuery(
      { orgId: org.id },
      { enabled: org.projects.length > 0 },
    );

  const openProjectMigration = (row: { id: string; name: string }) => {
    capture("v4_migration:status_row_clicked");
    openMigrationPanel({ id: row.id, name: row.name });
  };

  const handleRowClick = (row: { id: string; name: string }) => {
    openProjectMigration(row);
    router.push(`/project/${row.id}/traces`);
  };

  const [orderBy, setOrderBy] = useState<OrderBy>(null);

  const handleSort = (column: SortKey) => {
    const next: OrderBy =
      orderBy?.column === column
        ? orderBy.order === "DESC"
          ? { column, order: "ASC" }
          : null
        : { column, order: "DESC" };
    capture("table:column_sorting_header_click", {
      column,
      order: next ? next.order : "Disabled",
    });
    setOrderBy(next);
  };

  const rows = org.projects.map((project) => {
    const lastTraceAt = lastTraceTimes?.find(
      (trace) => trace.projectId === project.id,
    )?.lastTraceAt;
    return {
      id: project.id,
      name: project.name,
      status: statusByProjectId.get(project.id),
      lastTraceLabel: lastTraceAt
        ? formatCompactRelativeTime(new Date(lastTraceAt))
        : "—",
      lastTraceSort: lastTraceAt ? new Date(lastTraceAt).getTime() : -1,
    };
  });

  const sortValue = (
    row: (typeof rows)[number],
    column: SortKey,
  ): string | number => {
    switch (column) {
      case "name":
        return row.name.toLowerCase();
      case "status":
        return row.status
          ? {
              unavailable: 0,
              checking: 1,
              "action-needed": 2,
              ready: 3,
            }[getProjectMigrationReadiness(row.status)]
          : 0;
      case "sdk":
        return row.status?.sdk.status === "latest"
          ? 5
          : row.status?.sdk.status === "otel_realtime"
            ? 5
            : row.status?.sdk.status === "no_data"
              ? 5
              : row.status?.sdk.status === "legacy"
                ? 4
                : row.status?.sdk.status === "otel_header_required"
                  ? 3
                  : row.status?.sdk.status === "unknown"
                    ? 2
                    : row.status?.sdk.status === "checking"
                      ? 1
                      : 0;
      case "evals":
        return row.status?.evals.count ?? 0;
      case "apis":
        return row.status?.apis.count ?? 0;
      case "exports":
        return row.status?.exports.count ?? 0;
      case "lastTrace":
        return row.lastTraceSort;
    }
  };

  const sortedRows = orderBy
    ? [...rows].sort((a, b) => {
        const va = sortValue(a, orderBy.column);
        const vb = sortValue(b, orderBy.column);
        const cmp =
          typeof va === "string"
            ? va.localeCompare(vb as string)
            : va - (vb as number);
        return orderBy.order === "ASC" ? cmp : -cmp;
      })
    : rows;

  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-muted-foreground truncate text-sm" title={org.name}>
        {org.name}
      </h3>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[60rem] table-auto">
            <TableHeader>
              <TableRow>
                <SortableHead
                  label={tAuto("project_f6f4da8")}
                  column="name"
                  orderBy={orderBy}
                  onSort={handleSort}
                />
                <SortableHead
                  label={tAuto("status_bae7d5b")}
                  column="status"
                  orderBy={orderBy}
                  onSort={handleSort}
                />
                <SortableHead
                  label="SDK"
                  column="sdk"
                  orderBy={orderBy}
                  onSort={handleSort}
                />
                <SortableHead
                  label={tAuto("affected_evals_c221089")}
                  column="evals"
                  orderBy={orderBy}
                  onSort={handleSort}
                />
                <SortableHead
                  label={tAuto("affected_apis_f9598f3")}
                  column="apis"
                  orderBy={orderBy}
                  onSort={handleSort}
                />
                <SortableHead
                  label={tAuto("affected_exports_0a51f06")}
                  column="exports"
                  orderBy={orderBy}
                  onSort={handleSort}
                />
                <SortableHead
                  label={tAuto("last_trace_43d698c")}
                  column="lastTrace"
                  orderBy={orderBy}
                  onSort={handleSort}
                />
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.map((row) => {
                if (!row.status) return null;
                const readiness = getProjectMigrationReadiness(row.status);
                return (
                  <TableRow
                    key={row.id}
                    className="group/row cursor-pointer"
                    onClick={() => handleRowClick(row)}
                  >
                    <TableCell density="comfortable" className="max-w-48">
                      <Link
                        href={`/project/${row.id}/traces`}
                        className="block truncate font-bold hover:underline"
                        title={row.name}
                        onClick={(event) => {
                          event.stopPropagation();
                          openProjectMigration(row);
                        }}
                      >
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell
                      density="comfortable"
                      className="overflow-hidden"
                    >
                      <StatusPill readiness={readiness} />
                    </TableCell>
                    <TableCell density="comfortable">
                      {row.status.sdk.status === "latest" ? (
                        <span className="text-foreground-tertiary">
                          {tAuto("latest_decd7ca")}
                        </span>
                      ) : row.status.sdk.status === "otel_realtime" ? (
                        <span className="text-foreground-tertiary">
                          {tAuto("otel_real_time_c9d51a9")}{" "}
                        </span>
                      ) : row.status.sdk.status === "no_data" ? (
                        <span className="text-foreground-tertiary">
                          {tAuto("no_data_detected_05ecc63")}{" "}
                        </span>
                      ) : row.status.sdk.status === "checking" ? (
                        <span className="text-foreground-tertiary">
                          {tAuto("checking_820d600")}{" "}
                        </span>
                      ) : row.status.sdk.status === "unknown" ? (
                        <span className="text-foreground-tertiary">
                          {tAuto("unknown_bc7819b")}{" "}
                        </span>
                      ) : row.status.sdk.status === "otel_header_required" ? (
                        <span>
                          {row.status.sdk.delayedOtelIngestionCount}{" "}
                          {tAutoI18n("otel_header_90f6083")}{" "}
                          {row.status.sdk.delayedOtelIngestionCount === 1
                            ? tAutoI18n("required_1a77d41")
                            : tAutoI18n("issues_890c540")}
                        </span>
                      ) : row.status.sdk.status === "error" ? (
                        <span className="text-foreground-tertiary">
                          {tAuto("unavailable_2c9c1f7")}{" "}
                        </span>
                      ) : (
                        <span>
                          {row.status.sdk.upgradeRequiredCount}{" "}
                          {tAutoI18n("outdated_b85a517")}{" "}
                        </span>
                      )}
                    </TableCell>
                    <TableCell density="comfortable">
                      <AffectedCell count={row.status.evals} />
                    </TableCell>
                    <TableCell density="comfortable">
                      <AffectedCell count={row.status.apis} />
                    </TableCell>
                    <TableCell density="comfortable">
                      <AffectedCell count={row.status.exports} />
                    </TableCell>
                    <TableCell
                      density="comfortable"
                      className="text-muted-foreground truncate"
                      title={row.lastTraceLabel}
                    >
                      {row.lastTraceLabel}
                    </TableCell>
                    <TableCell density="comfortable">
                      <span className="text-dark-blue flex items-center justify-end gap-1 whitespace-nowrap opacity-0 transition-opacity group-hover/row:opacity-100">
                        {tAuto("review_e29a79f")}{" "}
                        <ArrowRight className="h-3 w-3 shrink-0" />
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

export default function V4MigrationStatusPage() {
  const v4UpgradeUiEnabled = useV4UpgradeUiEnabled();

  if (!v4UpgradeUiEnabled) {
    return null;
  }

  return <V4MigrationStatusPageContent />;
}

function V4MigrationStatusPageContent() {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const session = useSession();
  const handleCopyPrompt = useCopyMigrationPrompt();

  const orgs: V4MigrationOrganization[] =
    session.data?.user?.organizations?.map((org) => ({
      id: org.id,
      name: org.name,
      projects: org.projects
        .filter((project) => !project.deletedAt)
        .map((project) => ({ id: project.id, name: project.name })),
    })) ?? [];
  const statusByProjectId = useAccountV4MigrationData({
    organizations: orgs,
    enabled: true,
  });

  const faqItems: { q: string; a: ReactNode }[] = [
    {
      q: "Why is this happening?",
      a: (
        <>
          {tAuto("we_rebuilt_the_tracing_and_evaluation_engine_around_bb8eba5")}{" "}
          <FaqLink href={DATA_MODEL_URL}>
            {tAuto("observations_1943334")}
          </FaqLink>
          . The new engine is real-time and holds up much better at scale.
        </>
      ),
    },
    {
      q: "What's in it for me?",
      a: (
        <>
          {tAuto("your_ba596fd")}{" "}
          <FaqLink href={OBSERVATIONS_FAQ_URL}>
            {tAuto("data_shows_up_instantly_4f234e6")}
          </FaqLink>
          {tAuto("everything_loads_faster_and_you_get_2131033")}{" "}
          <FaqLink href={V4_DOCS_URL}>
            {tAuto(
              "features_we_could_not_build_on_the_old_engine_ea46178",
            )}{" "}
          </FaqLink>
          {tAuto(
            "like_full_text_search_alerting_and_observation_level_f40b9bd",
          )}{" "}
        </>
      ),
    },
    {
      q: "Do I have to do this?",
      a: (
        <>
          {tAuto("yes_eventually_the_52bb1db")}{" "}
          <FaqLink href={SDK_UPGRADE_URL}>{tAuto("old_sdks_6f24662")}</FaqLink>
          {tAuto(
            "trace_level_evals_and_apis_are_frozen_and_stop_worki_d9d2fc2",
          )}{" "}
          <span className="underline">{tAuto("soon_3f934e4")}</span>. They keep
          running until then, but we&apos;re no longer fixing bugs in them.
        </>
      ),
    },
    {
      q: "How much work is it?",
      a: (
        <>
          Less than you&apos;d think. For most projects it&apos;s{" "}
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="text-dark-blue hover:underline"
          >
            {tAuto("one_prompt_eaffbaf")}{" "}
          </button>
          {tAuto(
            "the_agent_updates_your_sdk_repoints_your_evals_and_m_d422932",
          )}{" "}
        </>
      ),
    },
    {
      q: "What if I do nothing?",
      a: (
        <>
          <span className="underline">{tAuto("soon_32d3b26")}</span>
          {tAuto("old_sdks_stop_sending_data_and_the_49962a9")}{" "}
          <FaqLink href={API_REFERENCE_URL}>
            {tAuto("deprecated_evals_and_endpoints_d9b7829")}{" "}
          </FaqLink>{" "}
          {tAuto("start_returning_errors_bc16e57")}{" "}
        </>
      ),
    },
  ];

  const totalProjects = orgs.reduce(
    (total, org) => total + org.projects.length,
    0,
  );
  const readiness = orgs.flatMap((org) =>
    org.projects.flatMap((project) => {
      const status = statusByProjectId.get(project.id);
      return status ? [getProjectMigrationReadiness(status)] : [];
    }),
  );
  const readyProjects = readiness.filter((state) => state === "ready").length;
  const isChecking =
    session.status === "loading" ||
    readiness.some((state) => state === "checking");

  return (
    <ContainerPage
      headerProps={{
        title: tAuto("migration_status_2ab5037"),
      }}
    >
      <div className="flex flex-col gap-6 pt-2 pb-24">
        <Card className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 p-6">
          <div className="flex min-w-0 flex-col gap-2.5">
            <p className="text-base font-bold">
              {tAuto(
                "langfuse_v4_is_here_real_time_and_up_to_165_faster_7946608",
              )}{" "}
            </p>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              {isChecking ? (
                <span className="text-muted-foreground text-sm">
                  {tAuto("checking_project_status_fe86966")}{" "}
                </span>
              ) : totalProjects === 0 ? (
                <span className="text-muted-foreground text-sm">
                  {tAuto("no_active_projects_e6823ec")}{" "}
                </span>
              ) : (
                <>
                  <span className="text-2xl leading-none font-bold tracking-tight">
                    {readyProjects}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {tAutoI18n("of_de04fa0")} {totalProjects}{" "}
                    {tAutoI18n("projects_migrated_ea238f6")}{" "}
                  </span>
                </>
              )}
            </div>
          </div>
        </Card>

        {orgs.map((org) => (
          <OrgStatusSection
            key={org.id}
            org={org}
            statusByProjectId={statusByProjectId}
          />
        ))}

        <div className="mt-6">
          <p className="text-base font-bold">What&apos;s new in v4</p>
          <div className="flex flex-col gap-6 pt-4">
            <div className="divide-y">
              {faqItems.map(({ q, a }) => (
                <div key={q} className="py-3">
                  <p className="text-sm font-bold">{q}</p>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    {a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ContainerPage>
  );
}
