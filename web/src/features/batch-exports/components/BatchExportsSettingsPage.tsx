import Header from "@/src/components/layouts/header";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { BatchExportsTable } from "@/src/features/batch-exports/components/BatchExportsTable";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { SettingsTableCard } from "@/src/components/layouts/settings-table-card";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function BatchExportsSettingsPage(props: { projectId: string }) {
  const tAuto = useAutoTranslations();
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "batchExports:read",
  });

  return (
    <>
      <Header title={tAuto("exports_0e16537")} />
      <p className="mb-4 text-sm">
        {tAuto(
          "export_large_datasets_in_your_preferred_format_via_t_bf2bdc0",
        )}{" "}
      </p>
      {hasAccess ? (
        <SettingsTableCard>
          <BatchExportsTable projectId={props.projectId} />
        </SettingsTableCard>
      ) : (
        <Alert>
          <AlertTitle>{tAuto("access_denied_1647b9d")}</AlertTitle>
          <AlertDescription>
            {tAuto(
              "you_do_not_have_permission_to_view_batch_exports_63927fc",
            )}{" "}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
