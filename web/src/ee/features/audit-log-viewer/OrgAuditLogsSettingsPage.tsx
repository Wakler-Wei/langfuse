import Header from "@/src/components/layouts/header";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { AuditLogsTable } from "@/src/ee/features/audit-log-viewer/AuditLogsTable";
import { useHasEntitlement } from "@/src/features/entitlements/hooks";
import { useHasOrganizationAccess } from "@/src/features/rbac/utils/checkOrganizationAccess";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function OrgAuditLogsSettingsPage(props: { orgId: string }) {
  const tAuto = useAutoTranslations();
  const hasAccess = useHasOrganizationAccess({
    organizationId: props.orgId,
    scope: "auditLogs:read",
  });
  const hasEntitlement = useHasEntitlement("audit-logs");

  const body = !hasEntitlement ? (
    <p className="text-muted-foreground text-sm">
      {tAuto(
        "audit_logs_are_an_enterprise_feature_upgrade_your_pl_633ca84",
      )}{" "}
    </p>
  ) : !hasAccess ? (
    <Alert>
      <AlertTitle>{tAuto("access_denied_1647b9d")}</AlertTitle>
      <AlertDescription>
        {tAuto(
          "contact_your_organization_administrator_to_request_a_cef767c",
        )}{" "}
      </AlertDescription>
    </Alert>
  ) : (
    <AuditLogsTable scope="organization" orgId={props.orgId} />
  );

  return (
    <>
      <Header title={tAuto("organization_audit_logs_d3273e4")} />
      <p className="text-muted-foreground mb-2 text-sm">
        {tAuto(
          "track_who_changed_what_in_your_organization_and_when_a500386",
        )}{" "}
      </p>
      {body}
    </>
  );
}
