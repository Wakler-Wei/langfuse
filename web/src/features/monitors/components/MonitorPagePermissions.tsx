import { type ReactNode } from "react";

import { ErrorPage } from "@/src/components/error-page";
import { SupportOrUpgradePage } from "@/src/ee/features/billing/components/SupportOrUpgradePage";
import { useLangfuseV4WriteMode } from "@/src/features/organizations/hooks";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import useProjectIdFromURL from "@/src/hooks/useProjectIdFromURL";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

/** MonitorScope is the RBAC scope a monitor page can require for entry. */
type MonitorScope = "monitors:read" | "monitors:CUD";

/** MonitorPagePermissions gates a monitor page on Langfuse Cloud and a project RBAC scope. */
export function MonitorPagePermissions({
  scope,
  children,
}: {
  scope: MonitorScope;
  children: ReactNode;
}) {
  const tAuto = useAutoTranslations();
  const projectId = useProjectIdFromURL();
  const v4WriteMode = useLangfuseV4WriteMode();
  const hasAccess = useHasProjectAccess({ projectId, scope });

  if (!v4WriteMode || v4WriteMode === "legacy") {
    return (
      <ErrorPage
        title={tAuto("not_found_475c848")}
        message={tAuto("this_page_does_not_exist_75861a2")}
      />
    );
  }

  if (!hasAccess) {
    return <SupportOrUpgradePage />;
  }

  return <>{children}</>;
}
