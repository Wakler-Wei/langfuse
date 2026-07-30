import { useRouter } from "next/router";
import Page from "@/src/components/layouts/page";
import { DashboardTable } from "@/src/features/dashboard/components/DashboardTable";
import { ActionButton } from "@/src/components/ActionButton";
import { PlusIcon } from "lucide-react";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import {
  getDashboardTabs,
  DASHBOARD_TABS,
} from "@/src/features/navigation/utils/dashboard-tabs";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export default function Dashboards() {
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const { projectId } = router.query as { projectId: string };
  const hasCUDAccess = useHasProjectAccess({
    projectId,
    scope: "dashboards:CUD",
  });

  return (
    <Page
      headerProps={{
        title: tAuto("dashboards_197565b"),
        help: {
          description: tAuto(
            "manage_and_create_dashboards_for_your_project_1dcb981",
          ),
          href: "https://langfuse.com/docs/metrics/features/custom-dashboards",
        },
        tabsProps: {
          tabs: getDashboardTabs(projectId),
          activeTab: DASHBOARD_TABS.DASHBOARDS,
        },
        actionButtonsRight: (
          <ActionButton
            icon={<PlusIcon className="h-4 w-4" aria-hidden="true" />}
            hasAccess={hasCUDAccess}
            href={`/project/${projectId}/dashboards/new`}
            trackingEventName="dashboard:new_dashboard_form_open"
            variant="default"
          >
            {tAuto("new_dashboard_892bc5f")}{" "}
          </ActionButton>
        ),
      }}
    >
      <DashboardTable />
    </Page>
  );
}
