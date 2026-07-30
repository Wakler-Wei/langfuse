// Langfuse Cloud only

import { LocalIsoDate } from "@/src/components/LocalIsoDate";

import { useBillingInformation } from "@/src/ee/features/billing/components/useBillingInformation";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const BillingCurrentPlanLabel = () => {
  const tAuto = useAutoTranslations();
  const { planLabel, cancellation } = useBillingInformation();

  return (
    <div>
      <>
        {tAuto("current_plan_8c0491c")} {planLabel}{" "}
      </>
      {cancellation?.isCancelled && cancellation.date && (
        <>
          <span>{tAuto("will_end_on_8cabe87")} </span>
          <LocalIsoDate date={cancellation.date} accuracy="day" />
          <span>)</span>
        </>
      )}
    </div>
  );
};
