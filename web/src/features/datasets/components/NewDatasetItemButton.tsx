import { PlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useState } from "react";
import { NewDatasetItemForm } from "@/src/features/datasets/components/NewDatasetItemForm";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { ActionButton } from "@/src/components/ActionButton";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const NewDatasetItemButton = (props: {
  projectId: string;
  datasetId?: string;
}) => {
  const tAuto = useAutoTranslations();
  const [open, setOpen] = useState(false);
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "datasets:CUD",
  });
  return (
    <Dialog open={hasAccess && open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionButton
          variant="outline"
          hasAccess={hasAccess}
          trackingEventName="dataset_item:new_form_open"
          icon={<PlusIcon className="h-4 w-4" aria-hidden="true" />}
        >
          {tAuto("new_item_4a91d6d")}{" "}
        </ActionButton>
      </DialogTrigger>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>{tAuto("create_new_dataset_item_0545c1d")}</DialogTitle>
        </DialogHeader>
        <NewDatasetItemForm
          projectId={props.projectId}
          datasetId={props.datasetId}
          onFormSuccess={() => setOpen(false)}
          className="h-full overflow-y-auto"
        />
      </DialogContent>
    </Dialog>
  );
};
