import { Button } from "@/src/components/ui/button";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { api } from "@/src/utils/api";
import { Trash } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import useProjectIdFromURL from "@/src/hooks/useProjectIdFromURL";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function DeletePrompt({ promptName }: { promptName: string }) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const projectId = useProjectIdFromURL();
  const utils = api.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAccess = useHasProjectAccess({ projectId, scope: "prompts:CUD" });

  const mutDeletePrompt = api.prompts.delete.useMutation({
    onSuccess: () => {
      utils.prompts.invalidate();
      setError(null);
      setIsOpen(false);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  return (
    <Popover open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="xs" disabled={!hasAccess}>
          <Trash className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <h2 className="mb-3 font-bold">{tAuto("please_confirm_3a799cc")}</h2>
        <p className="mb-3 text-sm">
          {tAutoI18n(
            "this_action_permanently_deletes_this_prompt_all_requ_59193c6",
          )}{" "}
          <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-bold">
            {promptName}
          </code>{" "}
          {tAutoI18n("will_error_54d053c")}{" "}
        </p>
        {error && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p className="font-bold">{tAuto("error_787aa16")}</p>
            <p className="whitespace-pre-wrap">{error}</p>
          </div>
        )}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="destructive"
            loading={mutDeletePrompt.isPending}
            onClick={() => {
              if (!projectId) {
                console.error("Project ID is missing");
                return;
              }
              setError(null);

              mutDeletePrompt.mutate({
                projectId,
                promptName,
              });
            }}
          >
            {tAuto("delete_prompt_4179910")}{" "}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
