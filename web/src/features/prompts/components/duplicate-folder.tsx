import { Button } from "@/src/components/ui/button";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { api } from "@/src/utils/api";
import { useState } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { Checkbox } from "@/src/components/design-system/Checkbox/Checkbox";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import useProjectIdFromURL from "@/src/hooks/useProjectIdFromURL";
import { Copy } from "lucide-react";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { useEntitlementLimit } from "@/src/features/entitlements/hooks";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

enum CopySettings {
  LATEST_ONLY = "latest_only",
  ALL_VERSIONS = "all_versions",
}

const formSchema = z.object({
  targetPath: z.string().min(1, "Target folder path is required"),
  copySettings: z.enum(CopySettings),
  rewritePromptReferences: z.boolean(),
});

export function DuplicateFolder({ folderPath }: { folderPath: string }) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const projectId = useProjectIdFromURL();
  const utils = api.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAccess = useHasProjectAccess({ projectId, scope: "prompts:CUD" });
  const promptLimit = useEntitlementLimit("prompt-management-count-prompts");
  const capture = usePostHogClientCapture();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetPath: `${folderPath}-copy`,
      copySettings: CopySettings.LATEST_ONLY,
      rewritePromptReferences: false,
    },
  });

  const mutDuplicateFolder = api.prompts.duplicateFolder.useMutation({
    onSuccess: () => {
      utils.prompts.invalidate();
      setError(null);
      setIsOpen(false);
      form.reset();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const allPromptNames = api.prompts.allNames.useQuery(
    { projectId: projectId as string },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      enabled: hasAccess && isOpen,
    },
  );

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!projectId) return;
    capture("prompt_detail:duplicate_form_submit");
    setError(null);
    mutDuplicateFolder.mutate({
      projectId,
      sourcePath: folderPath,
      targetPath: values.targetPath,
      isSingleVersion: values.copySettings === CopySettings.LATEST_ONLY,
      rewritePromptReferences: values.rewritePromptReferences,
    });
  }

  return (
    <Dialog
      open={hasAccess && isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          form.reset();
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          disabled={!hasAccess}
          title={tAuto("duplicate_folder_including_prompts_593f61b")}
          onClick={() => capture("prompt_detail:duplicate_button_click")}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] min-h-0 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="break-all">
            Duplicate Folder &quot;
            <i className="font-normal">
              {folderPath.split("/").pop() ?? folderPath}
            </i>
            &quot;
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex h-full flex-1 flex-col gap-4"
          >
            <DialogBody>
              <p className="text-muted-foreground text-sm">
                {tAutoI18n("copy_all_prompts_from_f55304b")}{" "}
                <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-bold break-all">
                  {folderPath}/
                </code>{" "}
                {tAutoI18n("to_a_new_folder_path_8458669")}{" "}
              </p>
              <FormField
                control={form.control}
                name="targetPath"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel>{tAuto("target_folder_path_d6f4bbc")}</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="copySettings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAuto("version_settings_63a04fc")}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        {...field}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-y-0 space-x-3">
                          <FormControl>
                            <RadioGroupItem value={CopySettings.LATEST_ONLY} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {tAuto(
                              "copy_only_the_latest_version_of_each_prompt_1013e4a",
                            )}{" "}
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-y-0 space-x-3">
                          <FormControl>
                            <RadioGroupItem value={CopySettings.ALL_VERSIONS} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {tAuto("copy_all_versions_and_labels_503f5b5")}{" "}
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rewritePromptReferences"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        {tAuto(
                          "rewrite_prompt_references_in_this_folder_19f5d33",
                        )}{" "}
                      </FormLabel>
                      <FormDescription>
                        {tAutoI18n("update_references_like_ac48eea")}{" "}
                        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
                          {folderPath}/...
                        </code>{" "}
                        {tAutoI18n("to_point_at_0d9842c")}{" "}
                        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
                          {form.watch("targetPath") || `${folderPath}-copy`}/...
                        </code>{" "}
                        {tAutoI18n(
                          "when_the_referenced_prompt_is_also_copied_96a1bc6",
                        )}{" "}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              {form.watch("copySettings") === CopySettings.LATEST_ONLY &&
                form.watch("rewritePromptReferences") && (
                  <p className="text-muted-foreground text-sm">
                    {tAuto(
                      "when_copying_latest_only_labels_referenced_within_th_9b8cf89",
                    )}{" "}
                  </p>
                )}
              {error && (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <p className="font-bold">{tAuto("error_787aa16")}</p>
                  <p className="whitespace-pre-wrap">{error}</p>
                </div>
              )}
            </DialogBody>
            <DialogFooter>
              <Button
                type="submit"
                loading={mutDuplicateFolder.isPending}
                disabled={
                  !!(
                    promptLimit &&
                    allPromptNames.data &&
                    allPromptNames.data.length >= promptLimit
                  )
                }
                className="mt-auto w-full"
              >
                {tAuto("duplicate_972d573")}{" "}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
