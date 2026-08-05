/* eslint-disable @repo/no-style-props */
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
import { useBillingInformation } from "./useBillingInformation";
import { api } from "@/src/utils/api";
import { useState } from "react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const StripeCancellationButton = ({
  orgId,
  variant,
  className,
}: {
  orgId: string | undefined;
  variant: "secondary" | "default";
  className?: string;
}) => {
  const tAuto = useAutoTranslations();
  const { cancellation } = useBillingInformation();
  const [loading, setLoading] = useState(false);
  const [_opId, setOpId] = useState<string | null>(null);

  const cancelMutation = api.cloudBilling.cancelStripeSubscription.useMutation({
    onSuccess: () => {
      toast.success(
        tAuto("subscription_will_be_cancelled_at_period_end_e6029d3"),
      );
      setLoading(false);
      setOpId(null);
      setTimeout(() => window.location.reload(), 500);
    },
    onError: () => {
      setLoading(false);
      setOpId(null);
      toast.error(tAuto("failed_to_cancel_subscription_9291c45"));
    },
  });

  const reactivateMutation =
    api.cloudBilling.reactivateStripeSubscription.useMutation({
      onSuccess: () => {
        toast.success(tAuto("subscription_reactivated_dd218c9"));
        setLoading(false);
        setOpId(null);
        setTimeout(() => window.location.reload(), 500);
      },
      onError: () => {
        setLoading(false);
        setOpId(null);
        toast.error(tAuto("failed_to_reactivate_subscription_9c80a2c"));
      },
    });

  if (!orgId) return null;

  const onReactivate = async () => {
    try {
      setLoading(true);
      // idempotency key for mutation operations with the stripe api
      let opId = _opId;
      if (!opId) {
        opId = nanoid();
        setOpId(opId);
      }
      await reactivateMutation.mutateAsync({ orgId, opId });
    } catch (_e) {
      toast.error(tAuto("failed_to_reactivate_subscription_9c80a2c"));
    }
  };

  const onCancel = async () => {
    try {
      setLoading(true);
      // idempotency key for mutation operations with the stripe api
      let opId = _opId;
      if (!opId) {
        opId = nanoid();
        setOpId(opId);
      }
      await cancelMutation.mutateAsync({ orgId, opId });
    } catch (_e) {
      toast.error(tAuto("failed_to_cancel_subscription_9291c45"));
    }
  };

  // Reactivate with confirm dialog
  if (cancellation?.isCancelled) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant={variant}
            disabled={loading}
            title={tAuto("reactivate_subscription_edcac5f")}
            className={className}
          >
            {loading ? tAuto("working_13b7bfc") : tAuto("reactivate_subscription_edcac5f")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg">
              {tAuto(
                "confirm_reactivation_keep_your_subscription_4a52b11",
              )}{" "}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="text-sm">
            <p>
              {tAuto(
                "reactivating_removes_the_scheduled_cancellation_your_8942d51",
              )}{" "}
            </p>
            <p>
              {tAuto(
                "your_features_and_usage_billing_remain_unchanged_by__c40e450",
              )}{" "}
            </p>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">{tAuto("cancel_77dfd21")}</Button>
            </DialogClose>
            <Button variant="default" onClick={onReactivate} disabled={loading}>
              {loading ? tAuto("reactivating_de49ddf") : tAuto("confirm_reactivation_bc76c8a")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Cancel with confirm dialog
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          disabled={loading}
          title={tAuto("cancel_subscription_58b2bd1")}
        >
          {tAuto("cancel_subscription_58b2bd1")}{" "}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg">
            {tAuto("confirm_cancellation_cb645f2")}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="text-sm">
          <p>
            {tAuto(
              "your_subscription_will_not_renew_you_will_retain_acc_f32c1ee",
            )}{" "}
          </p>
          <p>
            {tAuto(
              "usage_during_the_remainder_of_the_period_is_still_bi_071118a",
            )}{" "}
          </p>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">
              {tAuto("keep_subscription_c8974fd")}
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={onCancel} disabled={loading}>
            {loading ? tAuto("cancelling_cee1848") : tAuto("confirm_cancellation_cb645f2")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
