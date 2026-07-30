import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, LockOpen, Plus, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import { Button } from "@/src/components/ui/button";
import {
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import { api } from "@/src/utils/api";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { CodeMirrorEditor } from "@/src/components/editor/CodeMirrorEditor";
import { CodeView } from "@/src/components/ui/CodeJsonViewer";
import { type Prisma, WebhookProtectedHeaders } from "@langfuse/shared";
import { Skeleton } from "@/src/components/ui/skeleton";
import { getFormattedPayload } from "@/src/features/experiments/utils/format";
import Spinner from "@/src/components/design-system/Spinner/Spinner";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

const RemoteExperimentSetupSchema = z.object({
  url: z.url(),
  defaultPayload: z.string(),
  enabled: z.boolean(),
  signingEnabled: z.boolean(),
  headers: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
      isSecret: z.boolean(),
      displayValue: z.string().optional(),
    }),
  ),
});

type RemoteExperimentSetupForm = z.infer<typeof RemoteExperimentSetupSchema>;

export const RemoteExperimentUpsertForm = ({
  projectId,
  datasetId,
  existingRemoteExperiment,
  setShowRemoteExperimentUpsertForm,
  onBack,
}: {
  projectId: string;
  datasetId: string;
  existingRemoteExperiment?: {
    url: string;
    payload: Prisma.JsonValue;
    enabled?: boolean;
    displaySecretKey?: string | null;
    displayHeaders?: Record<string, { secret: boolean; value: string }>;
  } | null;
  setShowRemoteExperimentUpsertForm: (show: boolean) => void;
  onBack?: () => void;
}) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const hasDatasetAccess = useHasProjectAccess({
    projectId,
    scope: "datasets:CUD",
  });

  const dataset = api.datasets.byId.useQuery({
    projectId,
    datasetId,
  });
  const utils = api.useUtils();

  // Set when the mutation generated a new signing secret; shown exactly once.
  const [oneTimeSecret, setOneTimeSecret] = useState<string | null>(null);

  const form = useForm<RemoteExperimentSetupForm>({
    resolver: zodResolver(RemoteExperimentSetupSchema),
    defaultValues: {
      url: existingRemoteExperiment?.url || "",
      defaultPayload: getFormattedPayload(existingRemoteExperiment?.payload),
      enabled: existingRemoteExperiment?.enabled ?? true,
      signingEnabled: Boolean(existingRemoteExperiment?.displaySecretKey),
      headers: Object.entries(
        existingRemoteExperiment?.displayHeaders ?? {},
      ).map(([name, header]) => ({
        name,
        value: "",
        isSecret: header.secret,
        displayValue: header.value,
      })),
    },
  });

  const {
    fields: headerFields,
    append: appendHeader,
    remove: removeHeader,
  } = useFieldArray({
    control: form.control,
    name: "headers",
  });

  const upsertRemoteExperimentMutation =
    api.datasets.upsertRemoteExperiment.useMutation({
      onSuccess: (data) => {
        showSuccessToast({
          title: tAuto("setup_successfully_5fb0976"),
          description: tAuto("your_changes_have_been_saved_7471bd6"),
        });
        utils.datasets.getRemoteExperiment.invalidate({
          projectId,
          datasetId,
        });
        if (data.unencryptedSecretKey) {
          setOneTimeSecret(data.unencryptedSecretKey);
        } else {
          setShowRemoteExperimentUpsertForm(false);
        }
      },
      onError: (error) => {
        showErrorToast(
          error.message || tAutoI18n("failed_to_setup_52b8c93"),
          tAutoI18n("please_check_your_url_and_config_and_try_again_24b461c"),
        );
      },
    });

  const deleteRemoteExperimentMutation =
    api.datasets.deleteRemoteExperiment.useMutation({
      onSuccess: () => {
        showSuccessToast({
          title: tAuto("deleted_successfully_e6cf5e5"),
          description: tAuto(
            "the_remote_dataset_run_trigger_has_been_removed_from_a875904",
          ),
        });
        setShowRemoteExperimentUpsertForm(false);
        utils.datasets.getRemoteExperiment.invalidate({
          projectId,
          datasetId,
        });
      },
      onError: (error) => {
        showErrorToast(
          error.message ||
            tAutoI18n("failed_to_delete_remote_dataset_run_trigger_5781c25"),
          tAutoI18n("please_try_again_83a6fd7"),
        );
      },
    });

  const onSubmit = (data: RemoteExperimentSetupForm) => {
    if (data.defaultPayload.trim()) {
      try {
        JSON.parse(data.defaultPayload);
      } catch {
        form.setError("defaultPayload", {
          message: "Invalid JSON format",
        });
        return;
      }
    }

    const requestHeaders: Record<string, { secret: boolean; value: string }> =
      {};
    for (const [index, header] of data.headers.entries()) {
      const name = header.name.trim();
      if (!name) continue;
      if (WebhookProtectedHeaders.includes(name.toLowerCase())) {
        form.setError(`headers.${index}.name`, {
          message: `"${name}" is set by Langfuse and cannot be overridden`,
        });
        return;
      }
      requestHeaders[name] = {
        secret: header.isSecret,
        value: header.value,
      };
    }

    upsertRemoteExperimentMutation.mutate({
      projectId,
      datasetId,
      url: data.url,
      defaultPayload: data.defaultPayload,
      enabled: data.enabled,
      signingEnabled: data.signingEnabled,
      requestHeaders,
    });
  };

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure you want to delete this remote dataset run trigger?",
      )
    ) {
      deleteRemoteExperimentMutation.mutate({
        projectId,
        datasetId,
      });
    }
  };

  if (!hasDatasetAccess) {
    return null;
  }

  if (dataset.isPending) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (oneTimeSecret) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{tAuto("save_your_signing_secret_f322dc5")}</DialogTitle>
          <DialogDescription>
            {tAuto(
              "langfuse_signs_every_remote_experiment_request_with__26550c3",
            )}{" "}
            <code>x-langfuse-signature</code>{" "}
            {tAuto(
              "header_store_it_in_your_service_to_verify_that_reque_6ab1433",
            )}{" "}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <CodeView content={oneTimeSecret} defaultCollapsed={false} />
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            onClick={() => setShowRemoteExperimentUpsertForm(false)}
          >
            {"I've saved the secret"}
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <Button
          variant="ghost"
          onClick={() => {
            if (onBack) {
              onBack();
            } else {
              setShowRemoteExperimentUpsertForm(false);
            }
          }}
          className="inline-block self-start"
        >
          {tAuto("back_c32ae9f")}{" "}
        </Button>
        <DialogTitle>
          {existingRemoteExperiment
            ? tAutoI18n("edit_remote_experiment_trigger_1f6c4b7")
            : tAutoI18n("set_up_remote_experiment_trigger_in_ui_1458dff")}
        </DialogTitle>
        <DialogDescription>
          {tAutoI18n(
            "enable_your_team_to_run_custom_experiments_on_datase_e671ecb",
          )}{" "}
          <strong>
            {dataset.isSuccess ? (
              <>&quot;{dataset.data?.name}&quot;</>
            ) : (
              <Spinner size="sm" display="inline" />
            )}
          </strong>
          . Configure a webhook URL to trigger remote custom experiments from
          UI. We will send dataset info (name, id) and config to your service,
          which can run against the dataset and post results to Langfuse.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DialogBody>
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormDescription>
                    {tAuto(
                      "the_url_that_will_be_called_when_the_remote_experime_d4f2f9c",
                    )}{" "}
                  </FormDescription>
                  <FormControl>
                    <Input
                      placeholder="https://your-service.com/webhook"
                      {...field}
                    />
                  </FormControl>
                  {field.value.startsWith("http://") && (
                    <p className="text-dark-yellow text-sm">
                      {tAuto(
                        "this_endpoint_uses_plain_http_the_payload_and_all_he_2277547",
                      )}{" "}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultPayload"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAuto("default_config_41a1958")}</FormLabel>
                  <FormDescription>
                    {tAuto(
                      "set_a_default_config_that_will_be_sent_to_the_remote_948db2b",
                    )}{" "}
                  </FormDescription>
                  <CodeMirrorEditor
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    editable
                    mode="json"
                    minHeight={200}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="signingEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{tAuto("sign_requests_1396411")}</FormLabel>
                    <FormDescription>
                      {field.value
                        ? existingRemoteExperiment?.displaySecretKey
                          ? tAutoI18n(
                              "requests_include_an_x_langfuse_signature_header_so_y_55e1ba2",
                            )
                          : tAutoI18n(
                              "a_signing_secret_will_be_generated_when_you_save_and_0db99d0",
                            )
                        : tAutoI18n(
                            "requests_will_be_sent_without_an_x_langfuse_signatur_d66e790",
                          )}
                    </FormDescription>
                    {field.value &&
                      existingRemoteExperiment?.displaySecretKey && (
                        <div className="pt-2">
                          <CodeView
                            className="bg-muted/50"
                            content={existingRemoteExperiment.displaySecretKey}
                            defaultCollapsed={true}
                          />
                          <div className="text-muted-foreground mt-1 text-xs">
                            {tAuto(
                              "secret_is_encrypted_and_can_only_be_viewed_when_gene_bda7abd",
                            )}{" "}
                          </div>
                        </div>
                      )}
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Accordion type="single" collapsible>
              <AccordionItem value="advanced" className="border-b-0">
                <AccordionTrigger className="justify-start gap-2 py-2 text-sm font-bold [&>svg]:order-first [&>svg]:-rotate-90 [&[data-state=open]>svg]:rotate-0">
                  {tAuto("advanced_options_a73a2ce")}{" "}
                </AccordionTrigger>
                <AccordionContent className="space-y-6 px-1 pt-2">
                  <div>
                    <FormLabel>{tAuto("custom_headers_85321ee")}</FormLabel>
                    <FormDescription className="mb-2">
                      {tAuto(
                        "optional_headers_to_include_in_the_request_e_g_for_a_1e182ba",
                      )}{" "}
                    </FormDescription>

                    {headerFields.map((field, index) => {
                      const isSecret = form.watch(`headers.${index}.isSecret`);
                      const displayValue = form.watch(
                        `headers.${index}.displayValue`,
                      );

                      return (
                        <div
                          key={field.id}
                          className="mb-2 grid grid-cols-[1fr_1fr_auto_auto] gap-2"
                        >
                          <FormField
                            control={form.control}
                            name={`headers.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder={tAuto("header_name_37d8ce7")}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`headers.${index}.value`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder={
                                      displayValue || tAuto("value_8dce170")
                                    }
                                    {...field}
                                    type={isSecret ? "password" : "text"}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              form.setValue(
                                `headers.${index}.isSecret`,
                                !isSecret,
                              )
                            }
                            title={
                              isSecret
                                ? tAuto("make_header_public_845cff2")
                                : tAuto("make_header_secret_4e2161a")
                            }
                          >
                            {isSecret ? (
                              <Lock className="h-4 w-4 text-orange-500" />
                            ) : (
                              <LockOpen className="text-muted-foreground h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeHeader(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        appendHeader({
                          name: "",
                          value: "",
                          isSecret: false,
                          displayValue: "",
                        })
                      }
                      className="mt-2"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      {tAuto("add_custom_header_0f3ccd0")}{" "}
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>{tAuto("enabled_df174a3")}</FormLabel>
                          <FormDescription>
                            {field.value
                              ? tAutoI18n(
                                  "trigger_is_active_you_can_disable_anytime_to_pause_w_7e1d821",
                                )
                              : tAutoI18n(
                                  "trigger_is_paused_enable_to_allow_running_remote_exp_781d979",
                                )}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </DialogBody>

          <DialogFooter>
            <div className="flex w-full justify-between">
              {existingRemoteExperiment && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteRemoteExperimentMutation.isPending}
                >
                  {deleteRemoteExperimentMutation.isPending && (
                    <div className="mr-2">
                      <Spinner size="sm" />
                    </div>
                  )}
                  {tAutoI18n("delete_f6fdbe4")}{" "}
                </Button>
              )}
              <Button
                type="submit"
                className="ml-auto"
                disabled={upsertRemoteExperimentMutation.isPending}
              >
                {upsertRemoteExperimentMutation.isPending ? (
                  <div className="mr-2">
                    <Spinner size="sm" />
                  </div>
                ) : null}
                {existingRemoteExperiment
                  ? tAutoI18n("update_fb91e24")
                  : tAutoI18n("set_up_a5041fd")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};
