import { useRouter } from "next/router";
import { useState } from "react";

import { ErrorPage } from "@/src/components/error-page";
import Page from "@/src/components/layouts/page";
import { MonitorForm } from "@/src/features/monitors/components/MonitorForm";
import { MonitorPagePermissions } from "@/src/features/monitors/components/MonitorPagePermissions";
import { api, type APIError } from "@/src/utils/api";
import { type Monitor } from "@langfuse/shared/monitors";
import {
  type AutoTranslator,
  useAutoTranslations,
} from "@/src/features/i18n/I18nText";

/** EditMonitorPage gates the edit-monitor route and defers all data fetching to EditMonitorPageContent so blocked users never trigger the monitor query. */
export default function EditMonitorPage() {
  return (
    <MonitorPagePermissions scope="monitors:read">
      <EditMonitorPageRouter />
    </MonitorPagePermissions>
  );
}

/** EditMonitorPageRouter fetches data and renders loading, error and editor pages based on the state of the query */
function EditMonitorPageRouter() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const monitorId = router.query.monitorId as string;

  const { data, error, isPending } = api.monitors.get.useQuery(
    { projectId, id: monitorId },
    { enabled: Boolean(monitorId) },
  );

  if (isPending) {
    return <EditMonitorLoadingPage projectId={projectId} />;
  }

  if (error) {
    return <GetMonitorErrorPage error={error} />;
  }

  return <EditMonitorFormPage monitor={data} />;
}

/** EditMonitorFormPage renders the edit monitors form */
const EditMonitorFormPage = ({ monitor }: { monitor: Monitor }) => {
  const tAuto = useAutoTranslations();
  const [liveName, setLiveName] = useState(monitor.name);

  return (
    <Page
      withPadding
      headerProps={getHeaderProps(tAuto, monitor.projectId, liveName)}
    >
      <MonitorForm
        projectId={monitor.projectId}
        monitor={monitor}
        onNameChange={setLiveName}
      />
    </Page>
  );
};

/** GetMonitorErrorPage renders the error message returned by the api.monitors.get method */
const GetMonitorErrorPage = ({ error }: { error: APIError }) => {
  const tAuto = useAutoTranslations();
  if (error?.data?.code == "NOT_FOUND") {
    return (
      <ErrorPage
        title={tAuto("monitor_not_found_dbab210")}
        message={tAuto(
          "this_monitor_doesn_t_exist_or_has_been_deleted_94bf26a",
        )}
      />
    );
  }

  return (
    <ErrorPage
      title={tAuto("monitor_could_not_be_edited_67217bf")}
      message={error.message}
    />
  );
};

/** EditMonitorLoadingPage renders a loading page while the monitor is loading */
const EditMonitorLoadingPage = ({ projectId }: { projectId: string }) => {
  const tAuto = useAutoTranslations();
  return (
    <Page withPadding headerProps={getHeaderProps(tAuto, projectId)}>
      <></>
    </Page>
  );
};

/** getHeaderProps returns the page header properties for the EditMonitors page */
const getHeaderProps = (
  tAuto: AutoTranslator,
  projectId: string,
  monitorName?: string,
) => ({
  title: tAuto("edit_monitor_value0_e322c52", {
    value0: monitorName ? ` - ${monitorName}` : "",
  }),
  breadcrumb: [
    {
      name: tAuto("monitors_08cc506"),
      href: `/project/${projectId}/monitors`,
    },
  ],
});
