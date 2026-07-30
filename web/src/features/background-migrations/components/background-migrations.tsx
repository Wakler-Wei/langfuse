import { DataTable } from "@/src/components/table/data-table";
import { DataTableToolbar } from "@/src/components/table/data-table-toolbar";
import { type LangfuseColumnDef } from "@/src/components/table/types";
import { api } from "@/src/utils/api";
import { type BackgroundMigration } from "@langfuse/shared";
import { RetryBackgroundMigration } from "@/src/features/background-migrations/components/retry-background-migration";
import { StatusBadge } from "@/src/components/ui/StatusBadge/StatusBadge";
import Page from "@/src/components/layouts/page";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export default function BackgroundMigrationsTable() {
  const tAuto = useAutoTranslations();
  const backgroundMigrations = api.backgroundMigrations.all.useQuery();

  const columns = [
    {
      accessorKey: "name",
      id: "name",
      enableColumnFilter: false,
      header: tAuto("name_709a232"),
    },
    {
      accessorKey: "script",
      id: "script",
      enableColumnFilter: false,
      header: tAuto("script_ee6d6af"),
    },
    {
      accessorKey: "args",
      id: "args",
      enableColumnFilter: false,
      header: tAuto("args_4bf0024"),
      size: 80,
      cell: (row) => JSON.stringify(row.getValue()),
    },
    {
      id: "status",
      header: tAuto("status_bae7d5b"),
      size: 80,
      cell: (row) => {
        const failedAt = row.row.original.failedAt;
        if (failedAt) {
          return <StatusBadge type="failed" />;
        }
        const finishedAt = row.row.original.finishedAt;
        if (finishedAt) {
          return <StatusBadge type="finished" />;
        }
        const workerId = row.row.original.workerId;
        if (workerId) {
          return <StatusBadge type="active" />;
        }

        return <StatusBadge type="queued" />;
      },
    },
    {
      accessorKey: "failedReason",
      id: "failedReason",
      enableColumnFilter: false,
      header: tAuto("failed_reason_1c6702c"),
    },
    {
      accessorKey: "state",
      id: "state",
      enableColumnFilter: false,
      header: tAuto("state_a725020"),
      cell: (row) => JSON.stringify(row.getValue()),
    },
    {
      id: "actions",
      header: tAuto("actions_c3cd636"),
      size: 65,
      cell: (row) => {
        const name = row.row.original.name;
        const isRetryable = row.row.original.failedAt !== null;
        return (
          <RetryBackgroundMigration
            backgroundMigrationName={name}
            isRetryable={isRetryable}
          />
        );
      },
    },
  ] as LangfuseColumnDef<BackgroundMigration>[];

  return (
    <Page
      headerProps={{
        title: tAuto("background_migrations_d561ddf"),
      }}
    >
      <DataTableToolbar columns={columns} />
      <DataTable
        tableName="backgroundMigrations"
        columns={columns}
        data={
          backgroundMigrations.isPending
            ? { isLoading: true, isError: false }
            : backgroundMigrations.isError
              ? {
                  isLoading: false,
                  isError: true,
                  error: backgroundMigrations.error.message,
                }
              : {
                  isLoading: false,
                  isError: false,
                  data: backgroundMigrations.data?.migrations ?? [],
                }
        }
      />
    </Page>
  );
}
