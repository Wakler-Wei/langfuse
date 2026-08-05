import { Button } from "@/src/components/ui/button";
import { useState } from "react";
import {
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type ModernSessionSaveViewDialogContentProps = {
  isSaving: boolean;
  onCancel: () => void;
  onSave: (viewName: string) => void;
};

export function ModernSessionSaveViewDialogContent({
  isSaving,
  onCancel,
  onSave,
}: ModernSessionSaveViewDialogContentProps) {
  const tAuto = useAutoTranslations();
  const [viewName, setViewName] = useState("");
  const saveView = () => onSave(viewName.trim());

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{tAuto("save_as_new_view_c74b1e2")}</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <div>
          <label
            htmlFor="modern-session-view-name"
            className="mb-2 block text-sm font-bold"
          >
            {tAuto("view_name_f13b6b7")}{" "}
          </label>
          <Input
            id="modern-session-view-name"
            value={viewName}
            onChange={(event) => setViewName(event.target.value)}
            placeholder={tAuto("name_this_view_0353893")}
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter" && viewName.trim() && !isSaving) {
                saveView();
              }
            }}
          />
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          {tAuto("cancel_77dfd21")}{" "}
        </Button>
        <Button
          loading={isSaving}
          disabled={!viewName.trim()}
          onClick={saveView}
        >
          {tAuto("save_view_b419058")}{" "}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
