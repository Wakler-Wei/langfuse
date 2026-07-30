import { useRouter } from "next/router";
import { api } from "@/src/utils/api";
import { formatLocalIsoDate } from "@/src/components/LocalIsoDate";
import { BillingCurrentPlanLabel } from "./BillingCurrentPlanLabel";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const BillingPlanPeriodView = () => {
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const orgId = router.query.organizationId as string | undefined;

  const { data, isLoading } = api.cloudBilling.getSubscriptionInfo.useQuery(
    { orgId: orgId ?? "" },
    { enabled: Boolean(orgId) },
  );

  return (
    <div className="text-muted-foreground flex flex-col gap-1 text-sm">
      <BillingCurrentPlanLabel />
      <p>
        {tAuto("billing_period_1edef7b")}{" "}
        {!isLoading && data?.billingPeriod && (
          <>
            {`${formatLocalIsoDate(data.billingPeriod.start, false, "day")} - ${formatLocalIsoDate(data.billingPeriod.end, false, "day")}`}
          </>
        )}
      </p>
    </div>
  );
};
