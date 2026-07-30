// Langfuse Cloud only
import { useMemo } from "react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";

import { useSupportDrawer } from "@/src/features/support-chat/SupportDrawerProvider";
import { useV4MigrationPanel } from "@/src/features/v4-migration/V4MigrationPanelProvider";
import { StripeCustomerPortalButton } from "./StripeCustomerPortalButton";
import { BillingSwitchPlanDialog } from "./BillingSwitchPlanDialog";
import { useBillingInformation } from "./useBillingInformation";
import { StripeCancellationButton } from "./StripeCancellationButton";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const BillingActionButtons = () => {
  const tAuto = useAutoTranslations();
  const { organization, hasValidPaymentMethod, isLoading } =
    useBillingInformation();
  const { setOpen } = useSupportDrawer();
  const { setOpen: setMigrationPanelOpen } = useV4MigrationPanel();

  // Show pricing page button
  const shouldDisableChangePlan = useMemo(() => {
    if (!organization?.cloudConfig?.stripe?.activeSubscriptionId) {
      return false; // always show for hobby plan users
    }
    return !hasValidPaymentMethod;
  }, [
    organization?.cloudConfig?.stripe?.activeSubscriptionId,
    hasValidPaymentMethod,
  ]);

  // Do not show checkout or customer portal if manual plan is set in cloud config
  if (organization?.cloudConfig?.plan) {
    return (
      <div className="mt-4 flex flex-row items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            setMigrationPanelOpen(false);
            setOpen(true);
          }}
        >
          {tAuto("change_plan_via_support_4fa91bb")}{" "}
        </Button>
        <Button variant="secondary" asChild>
          <Link href="https://langfuse.com/pricing" target="_blank">
            {tAuto("compare_plans_a4c41c6")}{" "}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="flex flex-row items-center gap-2">
        {/* Always show – also for people who are currently on hobby plan */}
        <BillingSwitchPlanDialog disabled={shouldDisableChangePlan} />

        {organization?.cloudConfig?.stripe?.activeSubscriptionId && (
          <>
            <StripeCustomerPortalButton
              orgId={organization.id}
              title={tAuto("update_billing_details_92e60fe")}
              variant="secondary"
            />
            <StripeCancellationButton
              orgId={organization.id}
              variant="secondary"
            />
          </>
        )}
        <Button variant="secondary" asChild>
          <Link href="https://langfuse.com/pricing" target="_blank">
            {tAuto("compare_plans_a4c41c6")}{" "}
          </Link>
        </Button>
      </div>
      {organization?.cloudConfig?.stripe?.activeSubscriptionId &&
        !hasValidPaymentMethod &&
        !isLoading && (
          <p className="text-sm text-red-600">
            {tAuto(
              "you_do_not_have_a_valid_payment_method_please_update_63916d4",
            )}{" "}
          </p>
        )}
    </div>
  );
};
