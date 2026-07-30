import { DataTable } from "@/src/components/table/data-table";
import { type LangfuseColumnDef } from "@/src/components/table/types";
import { api, type RouterOutputs } from "@/src/utils/api";
import { safeExtract } from "@/src/utils/map-utils";
import { formatDistanceToNow } from "date-fns";
import { StatusBadge } from "@/src/components/ui/StatusBadge/StatusBadge";
import { NumberParam, useQueryParams, withDefault } from "use-query-params";
import { ActionButton } from "@/src/components/ActionButton";
import { DownloadIcon, InfoIcon } from "lucide-react";
import { Avatar, AvatarImage } from "@/src/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import { useState } from "react";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type BatchExportRow = RouterOutputs["batchExport"]["all"]["exports"][number];

export function BatchExportsTable(props: { projectId: string }) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const [paginationState, setPaginationState] = useQueryParams({
    pageIndex: withDefault(NumberParam, 0),
    pageSize: withDefault(NumberParam, 10),
  });
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedExportId, setSelectedExportId] = useState<string | null>(null);
  // Per-row pending downloads: a shared mutation with a single scalar id
  // would cross-wire spinners when two rows are clicked in quick succession.
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const batchExports = api.batchExport.all.useQuery({
    projectId: props.projectId,
    limit: paginationState.pageSize,
    page: paginationState.pageIndex,
  });

  const cancelBatchExport = api.batchExport.cancel.useMutation({
    onSuccess: () => {
      batchExports.refetch();
      setCancelDialogOpen(false);
      setSelectedExportId(null);
    },
  });

  const downloadBatchExport = api.batchExport.downloadUrl.useMutation();

  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "batchExports:create",
  });

  const columns = [
    {
      accessorKey: "name",
      id: "name",
      header: tAuto("name_709a232"),
      size: 200,
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        const { createdAt, finishedAt, expiresAt } = row.original;
        return (
          <div className="flex items-center gap-2">
            <span className="whitespace-break-spaces">{name}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="text-muted-foreground size-3" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <div>
                      {tAutoI18n("created_0c78dab")}{" "}
                      {new Date(createdAt).toLocaleString()}
                    </div>
                    <div>
                      {tAutoI18n("finished_4b52fe3")}{" "}
                      {finishedAt ? new Date(finishedAt).toLocaleString() : "-"}
                    </div>
                    <div>
                      {tAutoI18n("download_expires_05e38dd")}{" "}
                      {expiresAt ? new Date(expiresAt).toLocaleString() : "-"}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      id: "status",
      header: tAuto("status_bae7d5b"),
      size: 90,
      cell: ({ row }) => {
        const { status, log } = row.original;
        const badge = <StatusBadge type={status.toLowerCase()} />;
        // The log only exists on failed exports (worker-written, user-facing
        // error message); surface it on the badge instead of a dedicated
        // column that is empty for every successful row.
        if (!log) {
          return badge;
        }
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>{badge}</TooltipTrigger>
              <TooltipContent className="max-w-md whitespace-pre-wrap">
                {log}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "isDownloadable",
      id: "action",
      header: tAuto("action_97c89a4"),
      size: 130,
      // One state-dependent action per row: Cancel while queued/processing,
      // Download (or Expired) once completed — the states never coexist.
      cell: ({ row }) => {
        const { id, status, isExpired, isDownloadable } = row.original;
        if (isDownloadable) {
          return (
            <ActionButton
              icon={<DownloadIcon size={16} />}
              size="sm"
              loading={downloadingIds.has(id)}
              onClick={() => {
                setDownloadingIds((prev) => new Set(prev).add(id));
                downloadBatchExport.mutate(
                  { projectId: props.projectId, batchExportId: id },
                  {
                    // Content-Disposition is `attachment`, so assigning the
                    // fresh URL triggers a download without leaving the page.
                    onSuccess: (data) => {
                      window.location.href = data.url;
                    },
                    onSettled: () =>
                      setDownloadingIds((prev) => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                      }),
                  },
                );
              }}
            >
              {tAuto("download_a479c9c")}{" "}
            </ActionButton>
          );
        }
        if (status === "COMPLETED" && isExpired) {
          return (
            <span className="text-muted-foreground">
              {tAuto("expired_a689a99")}
            </span>
          );
        }
        if (status === "QUEUED" || status === "PROCESSING") {
          return (
            <AlertDialog
              open={cancelDialogOpen && selectedExportId === id}
              onOpenChange={(open) => {
                if (!open) {
                  setCancelDialogOpen(false);
                  setSelectedExportId(null);
                }
              }}
            >
              <AlertDialogTrigger asChild>
                <ActionButton
                  hasAccess={hasAccess}
                  size="sm"
                  onClick={() => {
                    setSelectedExportId(id);
                    setCancelDialogOpen(true);
                  }}
                >
                  {tAuto("cancel_77dfd21")}{" "}
                </ActionButton>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {tAuto("cancel_batch_export_ed1ca55")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {tAuto(
                      "are_you_sure_you_want_to_cancel_this_batch_export_th_caad0bd",
                    )}{" "}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {tAuto("no_keep_it_8644b7f")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      cancelBatchExport.mutate({
                        projectId: props.projectId,
                        batchExportId: id,
                      });
                    }}
                  >
                    {tAuto("yes_cancel_export_f0ba97b")}{" "}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          );
        }
        return null;
      },
    },
    {
      accessorKey: "expiresAt",
      id: "expiresAt",
      header: tAuto("expires_a99be3d"),
      size: 130,
      cell: ({ row }) => {
        const { status, expiresAt, isExpired } = row.original;
        // The Action column already reads "Expired" for lapsed exports; a
        // "how long ago" timestamp adds nothing, so show the countdown only
        // while the download is still available.
        if (status !== "COMPLETED" || !expiresAt || isExpired) {
          return null;
        }
        return (
          <span title={new Date(expiresAt).toLocaleString()}>
            {formatDistanceToNow(new Date(expiresAt), { addSuffix: true })}
          </span>
        );
      },
    },
    {
      accessorKey: "format",
      id: "format",
      header: tAuto("format_041a5de"),
      size: 70,
    },
    {
      accessorKey: "user",
      id: "user",
      header: tAuto("created_by_43de2bc"),
      size: 150,
      cell: ({ row }) => {
        const user = row.getValue("user") as {
          name: string | null;
          image: string | null;
        } | null;
        return (
          <div className="flex items-center space-x-2">
            <Avatar className="h-7 w-7">
              <AvatarImage
                src={user?.image ?? undefined}
                alt={user?.name ?? tAuto("user_avatar_32e4f25")}
              />
            </Avatar>
            <span>{user?.name ?? "Unknown"}</span>
          </div>
        );
      },
    },
  ] as LangfuseColumnDef<BatchExportRow>[];

  return (
    <>
      <DataTable
        tableName="batchExports"
        columns={columns}
        data={
          batchExports.isPending
            ? { isLoading: true, isError: false }
            : batchExports.isError
              ? {
                  isLoading: false,
                  isError: true,
                  error: batchExports.error.message,
                }
              : {
                  isLoading: false,
                  isError: false,
                  data: safeExtract(batchExports.data, "exports", []),
                }
        }
        pagination={{
          totalCount: batchExports.data?.totalCount ?? null,
          onChange: setPaginationState,
          state: paginationState,
        }}
        cellPadding="comfortable"
      />
    </>
  );
}
