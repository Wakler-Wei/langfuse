// Langfuse Cloud only

import { api } from "@/src/utils/api";
import { useQueryOrganization } from "@/src/features/organizations/hooks";
import { Card } from "@/src/components/ui/card";
import { numberFormatter, compactNumberFormatter } from "@/src/utils/numbers";
import { type Plan } from "@langfuse/shared";
import { MAX_EVENTS_FREE_PLAN } from "@/src/ee/features/billing/constants";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const BillingUsageChart = () => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const organization = useQueryOrganization();

  const usage = api.cloudBilling.getUsage.useQuery(
    {
      orgId: organization?.id as string,
    },
    {
      enabled: organization !== undefined,
      trpc: {
        context: {
          skipBatch: true,
        },
      },
    },
  );

  const hobbyPlanLimit =
    organization?.cloudConfig?.monthlyObservationLimit ?? MAX_EVENTS_FREE_PLAN;
  const plan: Plan = organization?.plan ?? "cloud:hobby";
  const usageType = usage.data?.usageType
    ? usage.data.usageType.charAt(0).toUpperCase() +
      usage.data.usageType.slice(1)
    : "Events";

  if (usage.data === null) {
    // Might happen in dev mode if STRIPE_SECRET_KEY is not set
    // This avoids errors for all developers not working on or testing the billing features
    return null;
  }

  return (
    <div>
      <Card className="p-3">
        {usage.data !== undefined ? (
          <>
            <p className="text-muted-foreground text-sm">
              {usage.data.billingPeriod
                ? tAutoI18n(
                    "consumed_value0_in_current_billing_period_updated_ab_814d55a",
                    { value0: String((usageType as unknown) ?? "") },
                  )
                : tAutoI18n("consumed_value0_last_30d_f3c7256", {
                    value0: String((usageType as unknown) ?? ""),
                  })}
            </p>
            <div className="text-3xl font-bold">
              {numberFormatter(usage.data.usageCount, 0)}
            </div>
            {plan === "cloud:hobby" && (
              <>
                <div className="mt-4 flex justify-between">
                  <span className="text-sm">{`${numberFormatter((usage.data.usageCount / hobbyPlanLimit) * 100)}%`}</span>
                  <span className="text-sm">
                    {tAutoI18n("plan_limit_750c4cf")}{" "}
                    {compactNumberFormatter(hobbyPlanLimit)}
                  </span>
                </div>
                <div
                  className="bg-muted mt-3 h-2 w-full overflow-hidden rounded-full"
                  role="progressbar"
                  aria-valuenow={Math.min(
                    (usage.data.usageCount / hobbyPlanLimit) * 100,
                    100,
                  )}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        (usage.data.usageCount / hobbyPlanLimit) * 100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <span className="text-muted-foreground text-sm">
            {tAuto("loading_might_take_a_moment_3198fdd")}{" "}
          </span>
        )}
      </Card>
    </div>
  );
};
