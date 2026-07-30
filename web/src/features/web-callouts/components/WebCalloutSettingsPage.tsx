import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2, Webhook, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { ActionButton } from "@/src/components/ActionButton";
import { StatusBadge } from "@/src/components/ui/StatusBadge/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import {
  WEB_CALLOUT_BLOCKED_HEADER_NAMES,
  WEB_CALLOUT_HEADER_NAME_PATTERN,
} from "@/src/features/web-callouts/headerRules";
import { api, type RouterOutputs } from "@/src/utils/api";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type WebCalloutEndpoint = RouterOutputs["webCallouts"]["all"][number];

const webCalloutFormSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1).max(100),
    url: z.url(),
    enabled: z.boolean(),
    toastMessage: z.string().trim().min(1).max(200),
    headers: z.array(
      z.object({
        name: z.string(),
        value: z.string(),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    const seenHeaderNames = new Set<string>();

    data.headers.forEach((header, index) => {
      const name = header.name.trim();

      if (!name) {
        return;
      }

      const lowerName = name.toLowerCase();

      if (!WEB_CALLOUT_HEADER_NAME_PATTERN.test(name)) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid header name.",
          path: ["headers", index, "name"],
        });
      }

      if (WEB_CALLOUT_BLOCKED_HEADER_NAMES.has(lowerName)) {
        ctx.addIssue({
          code: "custom",
          message: "This header is set by Langfuse and cannot be customized.",
          path: ["headers", index, "name"],
        });
      }

      if (seenHeaderNames.has(lowerName)) {
        ctx.addIssue({
          code: "custom",
          message: "Header names must be unique.",
          path: ["headers", index, "name"],
        });
      }

      seenHeaderNames.add(lowerName);
    });
  });

type WebCalloutFormValues = z.infer<typeof webCalloutFormSchema>;

export function WebCalloutSettingsPage(props: { projectId: string }) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] =
    useState<WebCalloutEndpoint | null>(null);

  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "integrations:CRUD",
  });

  const endpoints = api.webCallouts.all.useQuery(
    { projectId: props.projectId },
    { enabled: hasAccess },
  );
  const utils = api.useUtils();

  const deleteMutation = api.webCallouts.delete.useMutation({
    onSuccess: async () => {
      await utils.webCallouts.invalidate();
      showSuccessToast({
        title: tAuto("callout_endpoint_deleted_b70c563"),
        description: tAuto(
          "the_endpoint_was_removed_from_this_project_d8d3f53",
        ),
      });
    },
    onError: (error) => {
      showErrorToast(
        tAutoI18n("failed_to_delete_callout_endpoint_588078f"),
        error.message,
      );
    },
  });

  if (!hasAccess) {
    return (
      <div>
        <Alert>
          <AlertTitle>{tAuto("access_denied_1647b9d")}</AlertTitle>
          <AlertDescription>
            {tAuto(
              "you_do_not_have_permission_to_manage_integrations_fo_8c728c1",
            )}{" "}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const configuredEndpoint = endpoints.data?.[0];
  const canCreateEndpoint = !configuredEndpoint;
  const addEndpointDisabledReason = endpoints.isLoading
    ? "Loading callout endpoint configuration."
    : !canCreateEndpoint
      ? "Currently you can only create one callout per project."
      : undefined;

  const openCreateDialog = () => {
    setEditingEndpoint(null);
    setDialogOpen(true);
  };

  const openEditDialog = (endpoint: WebCalloutEndpoint) => {
    setEditingEndpoint(endpoint);
    setDialogOpen(true);
  };

  return (
    <div>
      <p className="text-primary mb-4 text-sm">
        {tAutoI18n(
          "configure_a_project_level_callout_your_users_can_tri_ae2acca",
        )}{" "}
        <a
          href="https://langfuse.com/docs/observability/features/web-callouts"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          {tAuto("here_0154c0d")}{" "}
        </a>{" "}
        {tAutoI18n("for_more_info_d7f3b13")}{" "}
      </p>

      <div className="mb-4 flex justify-end">
        <WebCalloutEndpointDialog
          projectId={props.projectId}
          endpoint={editingEndpoint}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingEndpoint(null);
            }
          }}
          trigger={
            <AddEndpointButton
              disabledReason={addEndpointDisabledReason}
              onClick={openCreateDialog}
            />
          }
        />
      </div>

      <Card className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-primary">
                {tAuto("name_709a232")}
              </TableHead>
              <TableHead className="text-primary">
                {tAuto("endpoint_92ec635")}
              </TableHead>
              <TableHead className="text-primary">
                {tAuto("toast_message_86e6a56")}
              </TableHead>
              <TableHead className="text-primary">
                {tAuto("headers_520de74")}
              </TableHead>
              <TableHead className="text-primary">
                {tAuto("status_bae7d5b")}
              </TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {endpoints.data?.length === 0 ? (
              <TableRow>
                <TableCell
                  density="comfortable"
                  colSpan={6}
                  className="text-muted-foreground text-center"
                >
                  {tAuto("no_callout_endpoint_configured_e0b115d")}{" "}
                </TableCell>
              </TableRow>
            ) : (
              endpoints.data?.map((endpoint) => (
                <TableRow key={endpoint.id}>
                  <TableCell density="comfortable" className="font-bold">
                    {endpoint.name}
                  </TableCell>
                  <TableCell
                    density="comfortable"
                    className="max-w-xl font-mono break-all"
                  >
                    {endpoint.url}
                  </TableCell>
                  <TableCell density="comfortable">
                    <ToastMessageCell endpoint={endpoint} />
                  </TableCell>
                  <TableCell density="comfortable">
                    <HeaderList endpoint={endpoint} />
                  </TableCell>
                  <TableCell density="comfortable">
                    <StatusBadge
                      type={endpoint.enabled ? "active" : "disabled"}
                    />
                  </TableCell>
                  <TableCell density="comfortable" className="text-right">
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(endpoint)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {tAuto("edit_endpoint_97d697a")}
                        </TooltipContent>
                      </Tooltip>
                      <DeleteEndpointButton
                        endpoint={endpoint}
                        onDelete={(id) => {
                          deleteMutation.mutate({
                            projectId: props.projectId,
                            id,
                          });
                        }}
                        loading={deleteMutation.isPending}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function AddEndpointButton(props: {
  disabledReason?: string;
  onClick: () => void;
}) {
  const tAuto = useAutoTranslations();
  const button = (
    <Button
      disabled={Boolean(props.disabledReason)}
      className={props.disabledReason ? "pointer-events-none" : undefined}
      onClick={props.onClick}
    >
      <Plus className="mr-1 h-4 w-4" />
      {tAuto("add_endpoint_bfc1935")}{" "}
    </Button>
  );

  if (!props.disabledReason) {
    return <DialogTrigger asChild>{button}</DialogTrigger>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-not-allowed">{button}</span>
      </TooltipTrigger>
      <TooltipContent>{props.disabledReason}</TooltipContent>
    </Tooltip>
  );
}

function HeaderList(props: { endpoint: WebCalloutEndpoint }) {
  const tAuto = useAutoTranslations();
  const headers = props.endpoint.requestHeaderKeys;

  if (headers.length === 0) {
    return (
      <span className="text-muted-foreground">{tAuto("none_6eef664")}</span>
    );
  }

  return (
    <span className="font-mono text-sm break-words">{headers.join(", ")}</span>
  );
}

function ToastMessageCell(props: { endpoint: WebCalloutEndpoint }) {
  return (
    <div
      className="max-w-xs truncate text-sm"
      title={props.endpoint.toastMessage}
    >
      {props.endpoint.toastMessage}
    </div>
  );
}

function WebCalloutEndpointDialog(props: {
  projectId: string;
  endpoint: WebCalloutEndpoint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
}) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const utils = api.useUtils();
  const upsertMutation = api.webCallouts.upsert.useMutation({
    onSuccess: async () => {
      await utils.webCallouts.invalidate();
      showSuccessToast({
        title: props.endpoint
          ? tAuto("callout_endpoint_updated_ee4af48")
          : tAuto("callout_endpoint_created_db091d1"),
        description: tAuto("web_callout_configuration_was_saved_6f5eee0"),
      });
      props.onOpenChange(false);
    },
    onError: (error) => {
      showErrorToast(
        tAutoI18n("failed_to_save_callout_endpoint_1bc9a73"),
        error.message,
      );
    },
  });

  const form = useForm<WebCalloutFormValues>({
    resolver: zodResolver(webCalloutFormSchema),
    defaultValues: endpointToFormValues(props.endpoint),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "headers",
  });

  useEffect(() => {
    if (props.open) {
      form.reset(endpointToFormValues(props.endpoint));
    }
  }, [form, props.endpoint, props.open]);

  const onSubmit = (values: WebCalloutFormValues) => {
    upsertMutation.mutate({
      projectId: props.projectId,
      id: values.id,
      name: values.name,
      url: values.url,
      enabled: values.enabled,
      toastMessage: values.toastMessage,
      requestHeaders: formValuesToRequestHeaders(values),
    });
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      {props.trigger}
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {props.endpoint
              ? tAutoI18n("edit_callout_endpoint_38bc70b")
              : tAutoI18n("add_callout_endpoint_f10df05")}
          </DialogTitle>
          <DialogDescription>
            {tAutoI18n(
              "langfuse_sends_a_backend_json_post_when_a_user_click_75168c4",
            )}{" "}
            <a
              href="https://langfuse.com/docs/observability/features/web-callouts"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              {tAuto("view_docs_19abc6f")}{" "}
            </a>
            .
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <DialogBody className="min-h-0">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAuto("name_709a232")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAuto("endpoint_url_65aaaa4")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/langfuse/callout"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {tAuto(
                        "http_or_https_url_custom_ports_are_allowed_the_endpo_6e4ddff",
                      )}{" "}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel>{tAuto("enabled_df174a3")}</FormLabel>
                      <FormDescription>
                        {tAuto(
                          "shows_the_callout_action_in_trace_observation_and_se_99fd90f",
                        )}{" "}
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

              <FormField
                control={form.control}
                name="toastMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAuto("toast_message_9ca2376")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      {tAuto(
                        "shown_after_the_backend_callout_succeeds_dee7dc2",
                      )}{" "}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>{tAuto("headers_520de74")}</FormLabel>
                <FormDescription className="mb-2">
                  {tAuto(
                    "optional_headers_added_to_the_backend_post_content_t_4a53ca7",
                  )}{" "}
                </FormDescription>
                <div className="space-y-2">
                  {fields.map((field, index) => {
                    const currentHeaderName = form.watch(
                      `headers.${index}.name`,
                    );
                    const preservesExistingValue = hasExistingHeaderName(
                      props.endpoint,
                      currentHeaderName,
                    );

                    return (
                      <div
                        key={field.id}
                        className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-2"
                      >
                        <FormField
                          control={form.control}
                          name={`headers.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder={tAuto("header_name_b46f85a")}
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
                                    preservesExistingValue
                                      ? "***"
                                      : tAuto("header_value_418adf0")
                                  }
                                  type="password"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {tAuto("remove_header_3e19869")}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() =>
                    append({
                      name: "",
                      value: "",
                    })
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  {tAuto("add_header_d5a110d")}{" "}
                </Button>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => props.onOpenChange(false)}
              >
                {tAuto("cancel_77dfd21")}{" "}
              </Button>
              <Button type="submit" loading={upsertMutation.isPending}>
                {tAuto("save_endpoint_9c817f9")}{" "}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteEndpointButton(props: {
  endpoint: WebCalloutEndpoint;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  const tAuto = useAutoTranslations();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{tAuto("delete_endpoint_1240e4b")}</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tAuto("delete_callout_endpoint_0230f58")}</DialogTitle>
          <DialogDescription>
            {tAuto(
              "this_removes_the_configured_endpoint_and_hides_the_w_749ca70",
            )}{" "}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {tAuto("cancel_77dfd21")}{" "}
          </Button>
          <Button
            variant="destructive"
            loading={props.loading}
            onClick={() => {
              props.onDelete(props.endpoint.id);
              setOpen(false);
            }}
          >
            {tAuto("delete_endpoint_1240e4b")}{" "}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const endpointToFormValues = (
  endpoint: WebCalloutEndpoint | null,
): WebCalloutFormValues => ({
  id: endpoint?.id,
  name: endpoint?.name ?? "Default",
  url: endpoint?.url ?? "",
  enabled: endpoint?.enabled ?? true,
  toastMessage: endpoint?.toastMessage ?? "Callout sent",
  headers: (endpoint?.requestHeaderKeys ?? []).map((name) => ({
    name,
    value: "",
  })),
});

const formValuesToRequestHeaders = (
  values: WebCalloutFormValues,
): Record<string, string> =>
  Object.fromEntries(
    values.headers
      .filter((header) => header.name.trim())
      .map((header) => [header.name.trim(), header.value.trim()]),
  );

const hasExistingHeaderName = (
  endpoint: WebCalloutEndpoint | null,
  name: string,
) => {
  const normalizedName = name.trim().toLowerCase();
  if (!normalizedName) {
    return false;
  }

  return (
    endpoint?.requestHeaderKeys.some(
      (headerName) => headerName.toLowerCase() === normalizedName,
    ) ?? false
  );
};

export function WebCalloutIntegrationCard(props: {
  projectId: string;
  hasAccess: boolean;
}) {
  const tAuto = useAutoTranslations();
  return (
    <Card className="p-3">
      <div className="mb-4 flex items-center gap-2">
        <Webhook className="text-foreground h-5 w-5" />
        <span className="font-bold">{tAuto("web_callouts_c78f412")}</span>
      </div>
      <p className="text-primary mb-4 text-sm">
        {tAuto(
          "send_backend_callouts_from_trace_observation_and_ses_e5cb7e7",
        )}{" "}
      </p>
      <ActionButton
        variant="secondary"
        hasAccess={props.hasAccess}
        href={`/project/${props.projectId}/settings/integrations/web-callouts`}
      >
        {tAuto("configure_792c81a")}{" "}
      </ActionButton>
    </Card>
  );
}
