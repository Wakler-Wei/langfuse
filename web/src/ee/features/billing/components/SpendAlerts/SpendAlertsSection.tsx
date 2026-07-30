import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Plus } from "lucide-react";
import { SpendAlertsTable } from "./SpendAlertsTable";
import { SpendAlertDialog } from "./SpendAlertDialog";
import { useHasOrganizationAccess } from "@/src/features/rbac/utils/checkOrganizationAccess";
import { useHasEntitlement } from "@/src/features/entitlements/hooks";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

interface SpendAlertsSectionProps {
  orgId: string;
}

export function SpendAlertsSection({ orgId }: SpendAlertsSectionProps) {
  const tAuto = useAutoTranslations();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const hasAccess = useHasOrganizationAccess({
    organizationId: orgId,
    scope: "langfuseCloudBilling:CRUD",
  });

  const hasEntitlement = useHasEntitlement("cloud-spend-alerts");

  if (!hasEntitlement) {
    return null;
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between pt-4">
          <div>
            <h3 className="font-bold">{tAuto("spend_alerts_0ff10bb")}</h3>
            <p className="text-muted-foreground max-w-prose text-sm">
              Get notified when your organization&apos;s spending exceeds
              configured thresholds. Alerts may be delayed by up to 90 minutes.
            </p>
            <p className="text-muted-foreground max-w-prose text-sm"></p>
          </div>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {tAuto("create_alert_2263828")}{" "}
          </Button>
        </div>

        <SpendAlertsTable orgId={orgId} key={refetchTrigger} />
      </div>

      <SpendAlertDialog
        orgId={orgId}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          setRefetchTrigger((prev) => prev + 1); // Trigger refetch
        }}
      />
    </>
  );
}
