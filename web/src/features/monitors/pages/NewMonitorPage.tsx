import { useRouter } from "next/router";

import Page from "@/src/components/layouts/page";
import { MonitorForm } from "@/src/features/monitors/components/MonitorForm";
import { MonitorPagePermissions } from "@/src/features/monitors/components/MonitorPagePermissions";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

/** NewMonitorPage renders the create-monitor form for a project. */
export default function NewMonitorPage() {
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const projectId = router.query.projectId as string;

  return (
    <MonitorPagePermissions scope="monitors:CUD">
      <Page
        withPadding
        headerProps={{
          title: tAuto("new_monitor_4bd2799"),
          breadcrumb: [
            { name: "Monitors", href: `/project/${projectId}/monitors` },
          ],
        }}
      >
        <MonitorForm projectId={projectId} />
      </Page>
    </MonitorPagePermissions>
  );
}
