// Langfuse Cloud only

import Header from "@/src/components/layouts/header";
import { useHasEntitlement } from "@/src/features/entitlements/hooks";
import { useRouter } from "next/router";
import { useHasOrganizationAccess } from "@/src/features/rbac/utils/checkOrganizationAccess";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";

import { BillingUsageChart } from "./BillingUsageChart";
import { BillingActionButtons } from "./BillingActionButtons";
import { BillingScheduleNotification } from "./BillingScheduleNotification";
import { BillingInvoiceTable } from "./BillingInvoiceTable";
import { BillingDiscountView } from "./BillingDiscountView";
import { BillingPlanPeriodView } from "@/src/ee/features/billing/components/BillingPlanPeriodView";
import { useIsCloudBillingAvailable } from "@/src/ee/features/billing/utils/isCloudBilling";
import { SpendAlertsSection } from "./SpendAlerts/SpendAlertsSection";
import { useBillingInformation } from "./useBillingInformation";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const BillingSettings = () => {
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const orgId = router.query.organizationId as string | undefined;
  const hasAccess = useHasOrganizationAccess({
    organizationId: orgId,
    scope: "langfuseCloudBilling:CRUD",
  });

  const isCloudBillingAvailable = useIsCloudBillingAvailable();
  const isCloudBillingEntitled = useHasEntitlement("cloud-billing");
  const isSpendAlertEntitled = useHasEntitlement("cloud-spend-alerts");
  const { hasActiveSubscription } = useBillingInformation();

  // Don't render billing settings if cloud billing is not available
  if (!isCloudBillingAvailable) {
    return null;
  }

  // Handle conditional rendering without early returns
  if (!isCloudBillingEntitled) {
    return null;
  }

  if (!hasAccess) {
    return (
      <Alert>
        <AlertTitle>{tAuto("access_denied_1647b9d")}</AlertTitle>
        <AlertDescription>
          {tAuto(
            "you_do_not_have_permission_to_view_the_billing_setti_016701b",
          )}{" "}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <BillingScheduleNotification />

      <Header title={tAuto("usage_billing_f262a4a")} />
      <div className="space-y-6">
        <BillingUsageChart />
        <BillingPlanPeriodView />
        <BillingDiscountView />
        <BillingActionButtons />
        <BillingInvoiceTable />
        {isSpendAlertEntitled && orgId && hasActiveSubscription && (
          <SpendAlertsSection orgId={orgId} />
        )}
      </div>
    </div>
  );
};
