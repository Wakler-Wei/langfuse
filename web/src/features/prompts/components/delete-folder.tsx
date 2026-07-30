import { Button } from "@/src/components/ui/button";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { api } from "@/src/utils/api";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogBody,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import useProjectIdFromURL from "@/src/hooks/useProjectIdFromURL";
import { Trash, Folder, FileText } from "lucide-react";
import Spinner from "@/src/components/design-system/Spinner/Spinner";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function DeleteFolder({ folderPath }: { folderPath: string }) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const projectId = useProjectIdFromURL();
  const utils = api.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const hasAccess = useHasProjectAccess({ projectId, scope: "prompts:CUD" });

  const prompts = api.prompts.all.useQuery(
    {
      projectId: projectId as string,
      pathPrefix: folderPath,
      page: 0,
      limit: 100, // Fetch up to 100 prompts to show in the list
      filter: [],
      orderBy: { column: "createdAt", order: "DESC" },
    },
    {
      enabled: isOpen && !!projectId,
    },
  );

  const mutDeleteFolder = api.prompts.delete.useMutation({
    onSuccess: () => {
      utils.prompts.invalidate();
      setError(null);
      setIsOpen(false);
      setConfirmName("");
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const folderName = folderPath.split("/").pop() ?? folderPath;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setConfirmName("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="xs" disabled={!hasAccess}>
          <Trash className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="break-all">
            Delete All Prompts in Folder &quot;
            <i className="font-normal">{folderName}</i>&quot;
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-muted-foreground text-sm">
            {tAutoI18n("this_action_permanently_deletes_the_folder_7f772ca")}{" "}
            <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-bold break-all">
              {folderPath}
            </code>{" "}
            {tAutoI18n("and_cffa50a")}{" "}
            <b>{tAuto("all_prompts_inside_it_recursively_dda6d48")}</b>. This
            cannot be undone. If a prompt is still used in your application,
            your application will break.
          </p>

          <div className="bg-muted/50 rounded-md border p-4">
            <h4 className="mb-2 text-sm font-bold">
              {tAuto("prompts_to_delete_462aca6")}
            </h4>
            {prompts.isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" variant="muted" />
              </div>
            ) : prompts.isError ? (
              <div className="py-2 text-xs text-red-500">
                {tAutoI18n("failed_to_load_prompts_3be6924")}{" "}
                {prompts.error.message}
              </div>
            ) : (
              <ul className="max-h-32 space-y-1 overflow-y-auto text-xs">
                {prompts.data?.prompts.map((p) => (
                  <li
                    key={`${p.row_type}-${p.id}`}
                    className="text-muted-foreground flex items-center gap-2"
                  >
                    {p.row_type === "folder" ? (
                      <Folder className="h-3 w-3 text-blue-500" />
                    ) : (
                      <FileText className="h-3 w-3" />
                    )}
                    <span className="break-all">
                      {folderPath}/{p.name}
                    </span>
                  </li>
                ))}
                {(prompts.data?.totalCount ?? 0) > 100 && (
                  <li className="text-muted-foreground pt-1 italic">
                    {tAutoI18n("and_a01e33f")}{" "}
                    {(prompts.data?.totalCount ?? 0) - 100}{" "}
                    {tAutoI18n("more_prompts_45eed41")}{" "}
                  </li>
                )}
                {prompts.data?.prompts.length === 0 && (
                  <li className="text-muted-foreground italic">
                    {tAuto("no_prompts_found_in_this_folder_9cf9076")}{" "}
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">
              {tAuto(
                "to_confirm_type_the_full_path_of_the_folder_to_delet_7116cc1",
              )}{" "}
            </label>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={tAuto("folder_to_delete_full_path_b0b1446")}
              className="h-9"
            />
          </div>

          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p className="font-bold">{tAuto("error_787aa16")}</p>
              <p className="whitespace-pre-wrap">{error}</p>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsOpen(false)}
          >
            {tAuto("cancel_77dfd21")}{" "}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={confirmName !== folderPath || mutDeleteFolder.isPending}
            loading={mutDeleteFolder.isPending}
            onClick={() => {
              if (!projectId) return;
              mutDeleteFolder.mutate({
                projectId,
                pathPrefix: folderPath,
              });
            }}
          >
            {tAuto("delete_folder_28807e5")}{" "}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
