import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { AIFeaturesDisabledNotice } from "@/src/features/organizations/components/AIFeaturesDisabledNotice";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function InAppAgentDisabledDialog({
  open,
  onOpenChange,
  organizationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
}) {
  const tAuto = useAutoTranslations();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tAuto("ai_features_are_disabled_58d7f74")}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <AIFeaturesDisabledNotice organizationId={organizationId}>
            {tAuto(
              "the_langfuse_assistant_requires_ai_features_to_be_en_8df9c29",
            )}{" "}
          </AIFeaturesDisabledNotice>
        </DialogBody>
        <DialogFooter>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              {tAuto("close_bbfa773")}{" "}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
