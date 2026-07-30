import { TrashIcon } from "lucide-react";
import { useState } from "react";
import Header from "@/src/components/layouts/header";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { api } from "@/src/utils/api";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { CreateLLMApiKeyDialog } from "./CreateLLMApiKeyDialog";
import { UpdateLLMApiKeyDialog } from "./UpdateLLMApiKeyDialog";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function LlmApiKeyList(props: { projectId: string }) {
  const tAuto = useAutoTranslations();
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "llmApiKeys:read",
  });

  const apiKeys = api.llmApiKey.all.useQuery(
    {
      projectId: props.projectId,
    },
    {
      enabled: hasAccess,
    },
  );

  const hasExtraHeaderKeys = apiKeys.data?.data.some(
    (key) => key.extraHeaderKeys.length > 0,
  );

  if (!hasAccess) {
    return (
      <div>
        <Header title={tAuto("llm_connections_96dfc0b")} />
        <Alert>
          <AlertTitle>{tAuto("access_denied_1647b9d")}</AlertTitle>
          <AlertDescription>
            {tAuto(
              "you_do_not_have_permission_to_view_llm_api_keys_for__ff8ce77",
            )}{" "}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div id="llm-api-keys">
      <Header title={tAuto("llm_connections_96dfc0b")} />
      <p className="mb-4 text-sm">
        {tAuto(
          "connect_your_llm_services_to_enable_evaluations_and__139900e",
        )}{" "}
      </p>
      <Card className="mb-4 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-primary md:table-cell">
                {tAuto("provider_7ceee3f")}{" "}
              </TableHead>
              <TableHead className="text-primary md:table-cell">
                {tAuto("adapter_e6b4616")}{" "}
              </TableHead>
              <TableHead className="text-primary md:table-cell">
                {tAuto("base_url_1dbd61f")}{" "}
              </TableHead>
              <TableHead className="text-primary">
                {tAuto("api_key_47acd20")}
              </TableHead>
              {hasExtraHeaderKeys ? (
                <TableHead className="text-primary">
                  {tAuto("extra_headers_229b310")}
                </TableHead>
              ) : null}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody className="text-muted-foreground">
            {apiKeys.data?.data.length === 0 ? (
              <TableRow>
                <TableCell
                  density="comfortable"
                  colSpan={6}
                  className="text-center"
                >
                  {tAuto("none_6eef664")}{" "}
                </TableCell>
              </TableRow>
            ) : (
              apiKeys.data?.data.map((apiKey) => (
                <TableRow
                  key={apiKey.id}
                  className="hover:bg-primary-foreground cursor-default"
                  onClick={() => setEditingKeyId(apiKey.id)}
                >
                  <TableCell density="comfortable" className="font-mono">
                    {apiKey.provider}
                  </TableCell>
                  <TableCell density="comfortable" className="font-mono">
                    {apiKey.adapter}
                  </TableCell>
                  <TableCell
                    density="comfortable"
                    className="max-w-md overflow-auto font-mono"
                  >
                    {apiKey.baseURL ?? "default"}
                  </TableCell>
                  <TableCell density="comfortable" className="font-mono">
                    {apiKey.displaySecretKey}
                  </TableCell>
                  {hasExtraHeaderKeys ? (
                    <TableCell density="comfortable">
                      {" "}
                      {apiKey.extraHeaderKeys.join(", ")}{" "}
                    </TableCell>
                  ) : null}
                  <TableCell density="comfortable" className="text-right">
                    <div
                      className="flex justify-end space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <UpdateLLMApiKeyDialog
                        apiKey={apiKey}
                        projectId={props.projectId}
                        open={editingKeyId === apiKey.id}
                        onOpenChange={(open: boolean) => {
                          if (open) {
                            setEditingKeyId(apiKey.id);
                          } else {
                            setEditingKeyId(null);
                          }
                        }}
                      />
                      <DeleteApiKeyButton
                        projectId={props.projectId}
                        apiKeyId={apiKey.id}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      <CreateLLMApiKeyDialog open={open} setOpen={setOpen} />
    </div>
  );
}

// show dialog to let user confirm that this is a destructive action
function DeleteApiKeyButton(props: { projectId: string; apiKeyId: string }) {
  const tAuto = useAutoTranslations();
  const capture = usePostHogClientCapture();
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "llmApiKeys:delete",
  });

  const utils = api.useUtils();
  const mutDeleteApiKey = api.llmApiKey.delete.useMutation({
    onSuccess: () => utils.llmApiKey.invalidate(),
  });
  const [open, setOpen] = useState(false);

  if (!hasAccess) return null;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="ghost" size="icon">
          <TrashIcon className="h-4 w-4" />
        </Button>
      }
      title={tAuto("delete_llm_connection_e311052")}
      description={tAuto(
        "are_you_sure_you_want_to_delete_this_connection_this_176b09f",
      )}
      confirmLabel="Permanently delete"
      loading={mutDeleteApiKey.isPending}
      onConfirm={() => {
        mutDeleteApiKey
          .mutateAsync({
            projectId: props.projectId,
            id: props.apiKeyId,
          })
          .then(() => {
            capture("project_settings:llm_api_key_delete");
            setOpen(false);
          })
          .catch((error) => {
            console.error(error);
          });
      }}
    />
  );
}
