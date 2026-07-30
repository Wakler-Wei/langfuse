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
import { api } from "@/src/utils/api";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const StripeKeepPlanButton = ({
  orgId,
  stripeProductId,
  onProcessing,
  processing,
}: {
  orgId: string | undefined;
  stripeProductId: string;
  onProcessing: (id: string | null) => void;
  processing: boolean;
}) => {
  const tAuto = useAutoTranslations();
  const [_opId, setOpId] = useState<string | null>(null);

  const clearSchedule = api.cloudBilling.clearPlanSwitchSchedule.useMutation({
    onSuccess: () => {
      toast.success(tAuto("kept_current_plan_8aae731"));
      onProcessing(null);
      setOpId(null);
      setTimeout(() => window.location.reload(), 500);
    },
    onError: () => {
      onProcessing(null);
      setOpId(null);
      toast.error(tAuto("failed_to_keep_current_plan_2148b61"));
    },
  });

  if (!orgId) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full" variant="default">
          {tAuto("keep_plan_66463af")}{" "}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg">
            {tAuto("confirm_keeping_current_plan_cc0abd2")}{" "}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="text-sm">
          <p>
            {tAuto(
              "you_have_a_scheduled_plan_change_on_your_current_sub_1296cf3",
            )}{" "}
          </p>
          <p>
            {tAuto(
              "your_features_and_pricing_will_stay_as_is_usage_cont_f2e1633",
            )}{" "}
          </p>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">{tAuto("go_back_f03e2d0")}</Button>
          </DialogClose>
          <Button
            variant="default"
            onClick={() => {
              onProcessing(stripeProductId);
              // idempotency key for mutation operations with the stripe api
              let opId = _opId;
              if (!opId) {
                opId = nanoid();
                setOpId(opId);
              }
              clearSchedule.mutate({ orgId, opId });
            }}
            disabled={processing}
          >
            {processing ? tAuto("keeping_8ae5242") : tAuto("confirm_keep_plan_d0b5052")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
