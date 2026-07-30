import React from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { type Prompt } from "@langfuse/shared";
import { type NewPromptFormSchemaType } from "./validation";
import DiffViewer from "@/src/components/DiffViewer";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type ReviewPromptDialogProps = {
  initialPrompt: Prompt;
  isLoading: boolean;
  children: React.ReactNode;
  onConfirm: () => void;
  getNewPromptValues: () => NewPromptFormSchemaType;
};

const formatMessages = (messages: any[], excludeKeys: string[] = []) => {
  return JSON.stringify(
    messages.map((m) =>
      Object.fromEntries(
        Object.entries(m)
          .filter(
            ([k]) =>
              !excludeKeys.includes(k) &&
              (k !== "type" || m.type === "placeholder"),
          )
          .sort(([a], [b]) => a.localeCompare(b)),
      ),
    ),
    null,
    2,
  );
};

export const ReviewPromptDialog: React.FC<ReviewPromptDialogProps> = (
  props,
) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const { initialPrompt, children, getNewPromptValues, onConfirm, isLoading } =
    props;
  const [newPromptValue, setNewPromptValues] =
    React.useState<NewPromptFormSchemaType | null>(null);
  const [open, setOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (open) {
      setNewPromptValues(getNewPromptValues());
    }
  }, [open, setNewPromptValues, getNewPromptValues]);

  const initialPromptContent =
    initialPrompt.type === "text"
      ? (initialPrompt.prompt as string)
      : formatMessages(initialPrompt.prompt as any[]);

  const newPromptContent =
    initialPrompt.type === "text"
      ? (newPromptValue?.textPrompt ?? "")
      : formatMessages(newPromptValue?.chatPrompt ?? [], ["id"]);

  const newConfig = JSON.stringify(
    JSON.parse(newPromptValue?.config ?? "{}"),
    null,
    2,
  );

  return (
    <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>{tAuto("review_prompt_changes_52f96de")}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span className="font-bold">{initialPrompt.name}</span>
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="max-h-[80vh] max-w-(--breakpoint-xl) space-y-6 overflow-y-auto">
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-base font-bold">
                    {tAuto("content_4f9be05")}
                  </h3>
                  <DiffViewer
                    oldString={initialPromptContent}
                    newString={newPromptContent}
                    oldLabel={`Previous content (v${initialPrompt.version})`}
                    newLabel="New content (draft)"
                  />
                </div>
                <div>
                  <h3 className="mb-2 text-base font-bold">
                    {tAuto("config_8851142")}
                  </h3>
                  <DiffViewer
                    oldString={JSON.stringify(initialPrompt.config, null, 2)}
                    newString={newConfig ?? "failed"}
                    oldLabel={`Previous config (v${initialPrompt.version})`}
                    newLabel="New config (draft)"
                  />
                </div>
              </div>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="flex flex-row">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
            className="min-w-32"
          >
            {tAuto("cancel_77dfd21")}{" "}
          </Button>
          <Button
            onClick={onConfirm}
            loading={isLoading}
            variant={newPromptValue?.isActive ? "destructive" : "default"}
            className="min-w-32"
          >
            {tAutoI18n("save_new_version_371b9aa")}{" "}
            {newPromptValue?.isActive
              ? tAutoI18n("and_promote_to_production_aa60202")
              : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
