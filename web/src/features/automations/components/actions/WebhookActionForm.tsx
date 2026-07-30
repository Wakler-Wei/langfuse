import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { X, Plus, RefreshCw, Lock, LockOpen } from "lucide-react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import {
  type ActionDomain,
  type ActionDomainWithSecrets,
  AvailableWebhookApiSchema,
  type SafeWebhookActionConfig,
  WebhookDefaultHeaders,
  WebhookProtectedHeaders,
} from "@langfuse/shared";
import { api } from "@/src/utils/api";
import { useState } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { WebhookSecretRender } from "../WebhookSecretRender";
import { CodeView } from "@/src/components/ui/CodeJsonViewer";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const webhookSchema = z.object({
  url: z.url(),
  headers: z.array(
    z.object({
      name: z.string().refine(
        (name) => {
          if (!name.trim()) return true; // Allow empty names (will be filtered out)
          return !WebhookProtectedHeaders.includes(name.trim().toLowerCase());
        },
        {
          message:
            "This header is automatically added by Langfuse and cannot be customized",
        },
      ),
      value: z.string(),
      displayValue: z.string(),
      isSecret: z.boolean(),
      wasSecret: z.boolean(),
    }),
  ),
  apiVersion: AvailableWebhookApiSchema,
});

export type WebhookFormValues = z.infer<typeof webhookSchema>;

interface WebhookActionFormProps {
  form: UseFormReturn<any>;
  disabled: boolean;
  projectId: string;
  action?: ActionDomain | ActionDomainWithSecrets;
}

export const WebhookActionForm: React.FC<WebhookActionFormProps> = ({
  form,
  disabled,
  projectId,
  action,
}) => {
  const tAuto = useAutoTranslations();
  const {
    fields: headerFields,
    append: appendHeader,
    remove: removeHeader,
  } = useFieldArray({
    control: form.control,
    name: "webhook.headers",
  });

  // Filter out headers managed by Langfuse from the user-editable headers
  const customHeaderFields = headerFields.filter((field, index) => {
    const headerName = form.watch(`webhook.headers.${index}.name`);
    return !WebhookProtectedHeaders.includes(headerName?.toLowerCase());
  });

  // Function to add a new header pair
  const addHeader = () => {
    appendHeader({
      name: "",
      value: "",
      displayValue: "",
      isSecret: false,
      wasSecret: false,
    });
  };

  // Function to toggle secret status of a header
  const toggleHeaderSecret = (index: number) => {
    const currentValue = form.watch(`webhook.headers.${index}.isSecret`);
    form.setValue(`webhook.headers.${index}.isSecret`, !currentValue);
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="webhook.url"
        rules={{ required: "Webhook URL is required" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center">
              {tAuto("webhook_url_fa7517b")}{" "}
              <span className="text-destructive ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="https://example.com/webhook"
                {...field}
                disabled={disabled}
              />
            </FormControl>
            <FormDescription>
              {tAuto(
                "the_http_url_to_call_when_the_trigger_fires_we_will__1062c9b",
              )}{" "}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="webhook.apiVersion.prompt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tAuto("api_version_05bdcc6")}</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={tAuto("select_api_version_caa1b34")}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="v1">{tAuto("v1_5a6df72")}</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              {tAuto(
                "the_api_version_to_use_for_the_webhook_payload_forma_4c5a82e",
              )}{" "}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <FormLabel>{tAuto("headers_520de74")}</FormLabel>

        {/* Default Headers Section */}
        <div className="mb-4">
          <FormDescription className="mb-2">
            {tAuto(
              "default_headers_automatically_added_by_langfuse_9e73659",
            )}{" "}
          </FormDescription>
          {Object.entries({
            ...WebhookDefaultHeaders,
            "x-langfuse-signature": `t=<timestamp>,v1=<signature>`,
          }).map(([key, value]) => (
            <div
              key={key}
              className="mb-2 grid grid-cols-[1fr_1fr_auto_auto] gap-2"
            >
              <FormItem>
                <FormControl>
                  <Input value={key} disabled={true} className="bg-muted/50" />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormControl>
                  <Input
                    value={value}
                    disabled={true}
                    className="bg-muted/50"
                  />
                </FormControl>
              </FormItem>
            </div>
          ))}
        </div>

        {/* Custom Headers Section */}
        <FormDescription className="mb-2">
          {tAuto(
            "optional_custom_headers_to_include_in_the_webhook_re_9b95da3",
          )}{" "}
        </FormDescription>

        {customHeaderFields.map((field) => {
          // Find the original index in the headerFields array
          const originalIndex = headerFields.findIndex(
            (f) => f.id === field.id,
          );
          const isSecret = form.watch(
            `webhook.headers.${originalIndex}.isSecret`,
          );
          const displayValue = form.watch(
            `webhook.headers.${originalIndex}.displayValue`,
          );

          return (
            <div
              key={field.id}
              className="mb-2 grid grid-cols-[1fr_1fr_auto_auto] gap-2"
            >
              <FormField
                control={form.control}
                name={`webhook.headers.${originalIndex}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder={tAuto("header_name_37d8ce7")}
                        {...field}
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`webhook.headers.${originalIndex}.value`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder={
                          isSecret && displayValue
                            ? displayValue
                            : displayValue || tAuto("value_8dce170")
                        }
                        {...field}
                        disabled={disabled}
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
                onClick={() => toggleHeaderSecret(originalIndex)}
                disabled={disabled}
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
                onClick={() => removeHeader(originalIndex)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          onClick={addHeader}
          disabled={disabled}
          className="mt-2"
        >
          <Plus className="mr-1 h-4 w-4" />
          {tAuto("add_custom_header_0f3ccd0")}{" "}
        </Button>
      </div>

      {/* Webhook Secret Section */}
      <div>
        <FormLabel>{tAuto("webhook_secret_095d92f")}</FormLabel>
        <FormDescription className="mb-2">
          {tAuto(
            "use_this_secret_to_verify_webhook_signatures_for_sec_9ac68bd",
          )}{" "}
        </FormDescription>

        {action?.id ? (
          <div className="rounded-md border p-3">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <CodeView
                  className="bg-muted/50"
                  content={
                    (action.config as SafeWebhookActionConfig).displaySecretKey
                  }
                  defaultCollapsed={false}
                />
              </div>
              <div className="flex gap-2">
                <RegenerateWebhookSecretButton
                  projectId={projectId}
                  action={action}
                />
              </div>
            </div>
            <div className="text-muted-foreground mt-1 text-xs">
              {tAuto(
                "secret_is_encrypted_and_can_only_be_viewed_when_gene_baebcb8",
              )}{" "}
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 text-muted-foreground rounded-md border p-3 text-sm">
            {tAuto(
              "webhook_secret_will_be_generated_when_the_automation_5a76ac0",
            )}{" "}
          </div>
        )}
      </div>
    </div>
  );
};

export const RegenerateWebhookSecretButton = ({
  projectId,
  action,
}: {
  projectId: string;
  action: ActionDomain | ActionDomainWithSecrets;
}) => {
  const tAuto = useAutoTranslations();
  const [showConfirmPopover, setShowConfirmPopover] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [regeneratedSecret, setRegeneratedSecret] = useState<string | null>(
    null,
  );

  const utils = api.useUtils();
  const regenerateSecretMutation =
    api.automations.regenerateWebhookSecret.useMutation({
      onSuccess: (data) => {
        showSuccessToast({
          title: tAuto("webhook_secret_regenerated_d311e59"),
          description: tAuto(
            "your_webhook_secret_has_been_successfully_regenerate_1bf2850",
          ),
        });
        setRegeneratedSecret(data.webhookSecret);
        setShowRegenerateDialog(true);
        utils.automations.invalidate();
      },
    });

  // Function to regenerate webhook secret
  const handleRegenerateSecret = async () => {
    if (!action?.id) return;
    try {
      await regenerateSecretMutation.mutateAsync({
        projectId,
        actionId: action.id,
      });
      setShowConfirmPopover(false);
    } catch (error) {
      console.error("Failed to regenerate webhook secret:", error);
    }
  };

  return (
    <>
      <Popover open={showConfirmPopover} onOpenChange={setShowConfirmPopover}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={regenerateSecretMutation.isPending}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${regenerateSecretMutation.isPending ? "animate-spin" : ""}`}
            />
            {tAuto("regenerate_b04c991")}{" "}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <h2 className="mb-3 font-bold">{tAuto("please_confirm_3a799cc")}</h2>
          <p className="mb-3 max-w-sm text-sm">
            {tAuto(
              "this_action_will_invalidate_the_current_webhook_secr_7ef6c2a",
            )}{" "}
          </p>
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmPopover(false)}
              disabled={regenerateSecretMutation.isPending}
            >
              {tAuto("cancel_77dfd21")}{" "}
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={regenerateSecretMutation.isPending}
              onClick={handleRegenerateSecret}
            >
              {tAuto("regenerate_secret_722cf63")}{" "}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Regenerate Secret Dialog */}
      <Dialog
        open={showRegenerateDialog}
        onOpenChange={setShowRegenerateDialog}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {tAuto("webhook_secret_regenerated_d311e59")}
            </DialogTitle>
            <DialogDescription>
              {tAuto(
                "your_webhook_secret_has_been_regenerated_please_copy_1b98298",
              )}{" "}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {regeneratedSecret && (
              <WebhookSecretRender webhookSecret={regeneratedSecret} />
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowRegenerateDialog(false);
                setRegeneratedSecret(null);
              }}
            >
              {"I've saved the secret"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Function to convert the array of header objects to a Record for API
export const formatWebhookHeaders = (
  headers: {
    name: string;
    value: string;
    displayValue: string;
    isSecret: boolean;
    wasSecret: boolean;
  }[],
): Record<string, { secret: boolean; value: string }> => {
  const requestHeaders: Record<string, { secret: boolean; value: string }> = {};
  headers.forEach((header) => {
    if (header.name.trim()) {
      // Exclude managed headers; they are added automatically by the API.
      if (!WebhookProtectedHeaders.includes(header.name.trim().toLowerCase())) {
        requestHeaders[header.name.trim()] = {
          secret: header.isSecret || false,
          value: header.value.trim(),
        };
      }
    }
  });

  return requestHeaders;
};
