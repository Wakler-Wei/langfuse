import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { ExternalLinkIcon } from "lucide-react";
import { api } from "@/src/utils/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { type DashboardPlacement } from "@/src/features/widgets/components/DashboardGrid";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

/**
 * Clone-first flow for Langfuse-managed (read-only) dashboards: any edit
 * attempt routes here instead of being blocked. Confirming clones the
 * dashboard into the project (optionally carrying the attempted change via
 * `pendingDefinition` and setting the clone as the project's Home) and
 * navigates to the editable copy.
 */
export function CloneFirstDialog({
  open,
  onOpenChange,
  projectId,
  dashboardId,
  dashboardName,
  setAsHome = false,
  pendingDefinition,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  dashboardId: string;
  dashboardName: string;
  /** Set the clone as this project's Home dashboard in the same gesture. */
  setAsHome?: boolean;
  /** The attempted edit (e.g. moved/removed tile) to apply to the clone. */
  pendingDefinition?: { widgets: DashboardPlacement[] } | null;
  /** Called when the user dismisses without cloning (revert the attempt). */
  onCancel?: () => void;
}) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const utils = api.useUtils();
  const capture = usePostHogClientCapture();

  // Detect existing copies of this dashboard so we can offer navigating to
  // one instead of accumulating "(Clone)" duplicates.
  const dashboards = api.dashboard.allDashboards.useQuery(
    {
      projectId,
      page: 1,
      limit: 500,
      orderBy: { column: "updatedAt", order: "DESC" },
    },
    { enabled: open },
  );
  const existingClone = useMemo(() => {
    const clonePattern = new RegExp(
      `^${dashboardName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\(Clone( \\d+)?\\)$`,
    );
    return dashboards.data?.dashboards.find(
      (d) => d.owner === "PROJECT" && clonePattern.test(d.name),
    );
  }, [dashboards.data?.dashboards, dashboardName]);

  const cloneDashboard = api.dashboard.cloneDashboard.useMutation({
    onSuccess: (data) => {
      utils.dashboard.invalidate();
      capture("dashboard:clone_dashboard", {
        source: "clone_first_dialog",
        set_as_home: setAsHome,
        had_pending_change: Boolean(pendingDefinition),
      });
      showSuccessToast({
        title: tAuto("editable_copy_created_0c57616"),
        description: setAsHome
          ? tAuto("the_copy_is_now_this_project_s_home_dashboard_f50c510")
          : tAuto("you_are_now_working_on_your_own_copy_7d19db8"),
        duration: 3000,
      });
      onOpenChange(false);
      if (data?.id) {
        router.push(
          `/project/${projectId}/dashboards/${encodeURIComponent(data.id)}`,
        );
      }
    },
    onError: (e) => {
      showErrorToast(tAutoI18n("failed_to_create_copy_cbac8d3"), e.message);
    },
  });

  const handleConfirm = () => {
    cloneDashboard.mutate({
      projectId,
      dashboardId,
      definition: pendingDefinition ?? undefined,
      setAsHome,
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    // Keep the dialog open while the clone is in flight (it navigates on
    // success); closing mid-flight would revert the grid and then surprise-
    // navigate.
    if (!nextOpen && cloneDashboard.isPending) return;
    if (!nextOpen) {
      capture("dashboard:clone_first_cancelled", {
        dashboard_id: dashboardId,
        had_pending_change: Boolean(pendingDefinition),
      });
      onCancel?.();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {tAuto("create_your_editable_copy_c735d73")}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="text-muted-foreground grid gap-3 py-4 text-sm">
            <p>
              <span className="text-foreground font-bold">
                &ldquo;{dashboardName}&rdquo;
              </span>{" "}
              is maintained by Langfuse and can&rsquo;t be edited directly.
              We&rsquo;ll create your own editable copy in this project
              {pendingDefinition
                ? tAutoI18n("with_your_change_applied_f70d0b9")
                : ""}
              {setAsHome
                ? tAutoI18n("and_show_it_on_your_home_page_from_now_on_1e37d72")
                : ""}
              .
            </p>
            <p>
              {tAuto(
                "langfuse_maintained_tiles_on_the_copy_can_be_rearran_e2a9273",
              )}{" "}
            </p>
            {existingClone && (
              <div className="bg-muted/50 flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                <span>
                  {tAutoI18n("you_already_have_a_copy_764e443")}{" "}
                  <span className="text-foreground font-bold">
                    &ldquo;{existingClone.name}&rdquo;
                  </span>
                  {pendingDefinition
                    ? tAutoI18n(
                        "opening_it_will_discard_your_attempted_change_f9f6b03",
                      )
                    : ""}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => {
                    capture("dashboard:clone_open_existing_click", {
                      dashboard_id: dashboardId,
                      existing_clone_id: existingClone.id,
                      had_pending_change: Boolean(pendingDefinition),
                    });
                    onOpenChange(false);
                    onCancel?.();
                    router.push(
                      `/project/${projectId}/dashboards/${encodeURIComponent(existingClone.id)}`,
                    );
                  }}
                >
                  <ExternalLinkIcon size={14} className="mr-1" />
                  {tAuto("open_it_instead_d7ff091")}{" "}
                </Button>
              </div>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <div className="flex gap-2">
            <Button
              onClick={() => handleOpenChange(false)}
              variant="outline"
              type="button"
              disabled={cloneDashboard.isPending}
            >
              {tAuto("cancel_77dfd21")}{" "}
            </Button>
            <Button
              onClick={handleConfirm}
              type="button"
              loading={cloneDashboard.isPending}
            >
              {tAuto("create_my_copy_fda008e")}{" "}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
