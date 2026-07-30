import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Trash } from "lucide-react";
import { api } from "@/src/utils/api";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

interface DeleteAutomationButtonProps {
  projectId: string;
  automationId: string;
  onSuccess?: () => void;
  variant?: "icon" | "button"; // "icon" for list view, "button" for form view
}

export const DeleteAutomationButton: React.FC<DeleteAutomationButtonProps> = ({
  projectId,
  automationId,
  onSuccess,
  variant = "icon",
}) => {
  const tAuto = useAutoTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const utils = api.useUtils();
  const hasAccess = useHasProjectAccess({
    projectId,
    scope: "automations:CUD",
  });

  const deleteAutomationMutation = api.automations.deleteAutomation.useMutation(
    {
      onSuccess: () => {
        showSuccessToast({
          title: tAuto("automation_deleted_b842ddd"),
          description: tAuto(
            "the_automation_has_been_deleted_successfully_dbbd13b",
          ),
        });

        if (onSuccess) {
          onSuccess();
        }

        utils.automations.invalidate();
      },
    },
  );

  return (
    <Popover open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
      <PopoverTrigger asChild>
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={!hasAccess}
          >
            <Trash className="h-4 w-4" />
            <span className="sr-only">{tAuto("delete_f6fdbe4")}</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="border-light-red flex items-center"
            disabled={!hasAccess}
          >
            <span className="text-dark-red">{tAuto("delete_f6fdbe4")}</span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent>
        <h2 className="mb-3 font-bold">{tAuto("please_confirm_3a799cc")}</h2>
        <p className="mb-3 text-sm">
          {tAuto(
            "this_action_permanently_deletes_this_automation_and__b210948",
          )}{" "}
        </p>
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="destructive"
            loading={deleteAutomationMutation.isPending}
            onClick={() => {
              deleteAutomationMutation.mutateAsync({
                projectId,
                automationId,
              });
              setIsOpen(false);
            }}
          >
            {tAuto("delete_automation_06d6caa")}{" "}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
