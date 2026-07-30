import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { api } from "@/src/utils/api";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { toast } from "sonner";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

interface DeleteSpendAlertDialogProps {
  orgId: string;
  alertId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteSpendAlertDialog({
  orgId,
  alertId,
  open,
  onOpenChange,
  onSuccess,
}: DeleteSpendAlertDialogProps) {
  const tAuto = useAutoTranslations();
  const [isDeleting, setIsDeleting] = useState(false);
  const capture = usePostHogClientCapture();

  const deleteMutation = api.spendAlerts.deleteSpendAlert.useMutation();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync({
        orgId,
        id: alertId,
      });
      capture("spend_alert:deleted", {
        orgId,
        alertId,
      });
      toast.success(tAuto("spend_alert_deleted_successfully_e3838ff"));
      onSuccess();
    } catch (error) {
      console.error("Failed to delete spend alert:", error);
      toast.error(
        tAuto("failed_to_delete_spend_alert_please_try_again_dd5d456"),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tAuto("delete_spend_alert_8e85aef")}</DialogTitle>
          <DialogDescription>
            {tAuto(
              "are_you_sure_you_want_to_delete_this_spend_alert_thi_6f460ba",
            )}{" "}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
          >
            {tAuto("cancel_77dfd21")}{" "}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? tAuto("deleting_e16cac6") : tAuto("delete_alert_a9bc553")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
