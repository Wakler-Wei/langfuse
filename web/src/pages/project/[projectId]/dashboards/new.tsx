import { useState } from "react";
import { useRouter } from "next/router";
import { api } from "@/src/utils/api";
import Page from "@/src/components/layouts/page";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export default function NewDashboard() {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const { projectId } = router.query as { projectId: string };

  // State for new dashboard
  const [dashboardName, setDashboardName] = useState(() =>
    tAuto("new_dashboard_892bc5f"),
  );
  const [dashboardDescription, setDashboardDescription] = useState("");

  // Check project access
  const hasCUDAccess = useHasProjectAccess({
    projectId,
    scope: "dashboards:CUD",
  });

  // Mutation for creating a new dashboard
  const createDashboard = api.dashboard.createDashboard.useMutation({
    onSuccess: (data) => {
      showSuccessToast({
        title: tAuto("dashboard_created_15b8043"),
        description: tAuto(
          "your_new_dashboard_has_been_created_successfully_aadca31",
        ),
      });
      // Navigate to the newly created dashboard
      router.push(`/project/${projectId}/dashboards/${data.id}`);
    },
    onError: (error) => {
      showErrorToast(
        tAutoI18n("error_creating_dashboard_4c1633e"),
        error.message,
      );
    },
  });

  // Handle form submission
  const handleCreateDashboard = () => {
    if (dashboardName.trim()) {
      createDashboard.mutate({
        projectId,
        name: dashboardName,
        description: dashboardDescription,
      });
    } else {
      showErrorToast(
        tAutoI18n("validation_error_e157cd0"),
        tAutoI18n("dashboard_name_is_required_8428939"),
      );
    }
  };

  return (
    <Page
      withPadding
      headerProps={{
        title: tAuto("create_dashboard_fa4fb55"),
        help: {
          description: tAuto("create_a_new_dashboard_for_your_project_eb5147d"),
        },
        actionButtonsRight: (
          <>
            <Button
              variant="outline"
              onClick={() => router.push(`/project/${projectId}/dashboards`)}
            >
              {tAuto("cancel_77dfd21")}{" "}
            </Button>
            <Button
              onClick={handleCreateDashboard}
              disabled={
                !dashboardName.trim() ||
                createDashboard.isPending ||
                !hasCUDAccess
              }
              loading={createDashboard.isPending}
            >
              {tAuto("create_6e157c5")}{" "}
            </Button>
          </>
        ),
      }}
    >
      <div className="mx-auto my-8 max-w-xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="dashboard-name">
            {tAuto("dashboard_name_51e39d4")}
          </Label>
          <Input
            id="dashboard-name"
            value={dashboardName}
            onChange={(e) => {
              setDashboardName(e.target.value);
            }}
            placeholder={tAuto("enter_dashboard_name_e7c7083")}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dashboard-description">
            {tAuto("description_55f8ebc")}
          </Label>
          <Textarea
            id="dashboard-description"
            value={dashboardDescription}
            onChange={(e) => {
              setDashboardDescription(e.target.value);
            }}
            placeholder={tAuto(
              "describe_the_purpose_of_this_dashboard_optional_but__19c3013",
            )}
            rows={4}
          />
        </div>

        <div className="text-muted-foreground text-sm">
          <p>
            {tAuto(
              "after_creating_the_dashboard_you_can_add_widgets_to__70c83af",
            )}{" "}
          </p>
        </div>
      </div>
    </Page>
  );
}
