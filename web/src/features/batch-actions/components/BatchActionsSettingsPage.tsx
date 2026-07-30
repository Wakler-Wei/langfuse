import Header from "@/src/components/layouts/header";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { SettingsTableCard } from "@/src/components/layouts/settings-table-card";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { BatchActionsTable } from "./BatchActionsTable";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function BatchActionsSettingsPage(props: { projectId: string }) {
  const tAuto = useAutoTranslations();
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "datasets:CUD",
  });

  return (
    <>
      <Header title={tAuto("batch_actions_494f6a3")} />
      <p className="mb-4 text-sm">
        {tAuto(
          "track_the_status_of_bulk_operations_performed_on_tab_10ebec0",
        )}{" "}
      </p>
      {hasAccess ? (
        <SettingsTableCard>
          <BatchActionsTable projectId={props.projectId} />
        </SettingsTableCard>
      ) : (
        <Alert>
          <AlertTitle>{tAuto("access_denied_1647b9d")}</AlertTitle>
          <AlertDescription>
            {tAuto(
              "you_do_not_have_permission_to_view_batch_actions_65dc82b",
            )}{" "}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
