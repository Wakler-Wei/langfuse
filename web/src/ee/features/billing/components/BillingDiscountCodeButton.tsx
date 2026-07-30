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
import { Input } from "@/src/components/ui/input";
import { api } from "@/src/utils/api";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const BillingDiscountCodeButton = ({
  orgId,
}: {
  orgId: string | undefined;
}) => {
  const tAuto = useAutoTranslations();
  const [code, setCode] = useState("");
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [opId, setOpId] = useState<string | null>(null);

  const utils = api.useUtils();

  const mutation = api.cloudBilling.applyPromotionCode.useMutation({
    onSuccess: async () => {
      toast.success(tAuto("promotion_code_applied_8839e86"));
      setProcessing(false);
      setOpen(false);
      setCode("");
      setOpId(null);
      await Promise.all([
        utils.cloudBilling.getSubscriptionInfo.invalidate(),
        utils.cloudBilling.getInvoices.invalidate(),
      ]);
    },
    onError: (err) => {
      setProcessing(false);
      toast.error(
        err.message || tAuto("failed_to_apply_promotion_code_4039674"),
      );
    },
  });

  if (!orgId) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          {tAuto("add_promotion_code_0737112")}{" "}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg">
            {tAuto("add_promotion_code_0737112")}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-3 text-sm">
          <p>
            {tAuto(
              "enter_a_valid_promotion_code_to_apply_it_to_your_sub_a5f4168",
            )}
          </p>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="PROMO2025"
            disabled={processing}
          />
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" disabled={processing}>
              {tAuto("cancel_77dfd21")}{" "}
            </Button>
          </DialogClose>
          <Button
            variant="default"
            disabled={processing || !code.trim()}
            onClick={() => {
              setProcessing(true);
              let id = opId;
              if (!id) {
                id = nanoid();
                setOpId(id);
              }
              mutation.mutate({ orgId, code: code.trim(), opId: id });
            }}
          >
            {processing ? tAuto("applying_e578c27") : tAuto("apply_cfea419")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
