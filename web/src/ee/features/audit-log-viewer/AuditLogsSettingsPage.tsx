import Header from "@/src/components/layouts/header";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { AuditLogsTable } from "@/src/ee/features/audit-log-viewer/AuditLogsTable";
import { useHasEntitlement } from "@/src/features/entitlements/hooks";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function AuditLogsSettingsPage(props: { projectId: string }) {
  const tAuto = useAutoTranslations();
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "auditLogs:read",
  });
  const hasEntitlement = useHasEntitlement("audit-logs");

  const body = !hasEntitlement ? (
    <p className="text-muted-foreground text-sm">
      {tAuto(
        "audit_logs_are_an_enterprise_feature_upgrade_your_pl_8705f76",
      )}{" "}
    </p>
  ) : !hasAccess ? (
    <Alert>
      <AlertTitle>{tAuto("access_denied_1647b9d")}</AlertTitle>
      <AlertDescription>
        {tAuto(
          "contact_your_project_administrator_to_request_access_301816c",
        )}{" "}
      </AlertDescription>
    </Alert>
  ) : (
    <AuditLogsTable scope="project" projectId={props.projectId} />
  );

  return (
    <>
      <Header title={tAuto("audit_logs_344c7ff")} />
      <p className="text-muted-foreground mb-2 text-sm">
        {tAuto(
          "track_who_changed_what_in_your_project_and_when_moni_e71aed3",
        )}{" "}
      </p>
      {body}
    </>
  );
}
