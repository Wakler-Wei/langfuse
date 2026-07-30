import { useRouter } from "next/router";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import Page from "@/src/components/layouts/page";
import { ActionButton } from "@/src/components/ActionButton";
import { PlusIcon } from "lucide-react";
import { DashboardWidgetTable } from "@/src/features/widgets";
import {
  getDashboardTabs,
  DASHBOARD_TABS,
} from "@/src/features/navigation/utils/dashboard-tabs";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export default function Widgets() {
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const { projectId } = router.query as { projectId: string };
  const hasCUDAccess = useHasProjectAccess({
    projectId,
    scope: "prompts:CUD",
  });

  return (
    <Page
      headerProps={{
        title: tAuto("widgets_bf8a667"),
        help: {
          description: tAuto(
            "manage_and_create_widgets_for_your_dashboard_e242bce",
          ),
          href: "https://langfuse.com/docs/metrics/features/custom-dashboards",
        },
        tabsProps: {
          tabs: getDashboardTabs(projectId),
          activeTab: DASHBOARD_TABS.WIDGETS,
        },
        actionButtonsRight: (
          <ActionButton
            icon={<PlusIcon className="h-4 w-4" aria-hidden="true" />}
            hasAccess={hasCUDAccess}
            href={`/project/${projectId}/widgets/new`}
            trackingEventName="dashboard:new_widget_form_open"
            variant="default"
          >
            {tAuto("new_widget_cf47e13")}{" "}
          </ActionButton>
        ),
      }}
    >
      <DashboardWidgetTable />
    </Page>
  );
}
