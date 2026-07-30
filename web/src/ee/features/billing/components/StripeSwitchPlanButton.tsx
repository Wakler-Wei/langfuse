import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { ActionButton } from "@/src/components/ActionButton";
import { planLabels } from "@langfuse/shared";
import { api } from "@/src/utils/api";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const StripeSwitchPlanButton = ({
  orgId,
  currentPlan,
  newPlanTitle,
  isLegacySubscription,
  isUpgrade,
  stripeProductId,
  onProcessing,
  processing,
}: {
  orgId: string | undefined;
  currentPlan: keyof typeof planLabels | undefined;
  newPlanTitle: string | undefined;
  isLegacySubscription: boolean;
  isUpgrade: boolean;
  stripeProductId: string;
  onProcessing: (id: string | null) => void;
  processing: boolean;
}) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const [_opId, setOpId] = useState<string | null>(null);

  const mutChangePlan =
    api.cloudBilling.changeStripeSubscriptionProduct.useMutation({
      onSuccess: () => {
        toast.success(tAuto("plan_changed_successfully_c6ff1a4"));
        onProcessing(null);
        setOpId(null);
        setTimeout(() => window.location.reload(), 500);
      },
      onError: () => {
        onProcessing(null);
        setOpId(null);
        toast.error(tAuto("failed_to_change_plan_c666de7"));
      },
    });

  if (!orgId) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">{tAuto("change_plan_5dccc31")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg">
            {tAutoI18n("confirm_your_change_89bec04")}{" "}
            {planLabels[currentPlan ?? "cloud:hobby"]} → {newPlanTitle}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="text-sm">
          {isLegacySubscription ? (
            <>
              <p>
                {tAuto(
                  "we_will_end_your_current_subscription_now_and_start__82eb020",
                )}{" "}
              </p>
              <p>
                {tAuto(
                  "you_will_receive_an_invoice_today_that_includes_1_th_6c6ac15",
                )}{" "}
              </p>
              <p>
                {tAuto(
                  "by_confirming_you_accept_the_immediate_invoice_and_p_10f1e4c",
                )}{" "}
              </p>
            </>
          ) : isUpgrade ? (
            <>
              <p>
                {tAuto(
                  "you_will_be_charged_a_prorated_base_fee_today_for_th_86a6a34",
                )}{" "}
              </p>
              <p>
                {tAuto(
                  "example_if_your_plan_is_199_month_and_you_upgrade_ha_e7935f3",
                )}{" "}
              </p>
              <p>
                {tAuto(
                  "by_confirming_you_accept_the_prorated_charge_and_imm_fba849e",
                )}{" "}
              </p>
            </>
          ) : (
            <>
              <p>
                {tAuto(
                  "no_charge_is_made_today_you_stay_on_your_current_pla_909c153",
                )}{" "}
              </p>
              <p>
                {tAuto(
                  "usage_continues_to_be_billed_under_your_current_plan_60d5319",
                )}{" "}
              </p>
            </>
          )}
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">{tAuto("cancel_77dfd21")}</Button>
          </DialogClose>
          <ActionButton
            onClick={() => {
              onProcessing(stripeProductId);
              // idempotency key for mutation operations with the stripe api
              let opId = _opId;
              if (!opId) {
                opId = nanoid();
                setOpId(opId);
              }
              mutChangePlan.mutate({ orgId, stripeProductId, opId });
            }}
            loading={processing}
          >
            {tAuto("confirm_04a2122")}{" "}
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
