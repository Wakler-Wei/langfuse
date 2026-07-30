import Link from "next/link";

import { Label } from "@/src/components/ui/label";
import { api } from "@/src/utils/api";
import { type UIModelParams } from "@langfuse/shared";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const LLMApiKeyComponent = (p: {
  projectId: string;
  modelParams: UIModelParams;
}) => {
  const tAuto = useAutoTranslations();
  const hasAccess = useHasProjectAccess({
    projectId: p.projectId,
    scope: "llmApiKeys:read",
  });

  if (!hasAccess) {
    return (
      <div>
        <Label className="text-xs font-bold">{tAuto("api_key_cf678ca")}</Label>
        <p className="text-muted-foreground text-sm">
          {tAuto(
            "llm_api_key_only_visible_to_owner_and_admin_roles_b58669f",
          )}{" "}
        </p>
      </div>
    );
  }

  const apiKeys = api.llmApiKey.all.useQuery({
    projectId: p.projectId,
  });

  if (apiKeys.isPending) {
    return (
      <div>
        <Label className="text-xs font-bold">{tAuto("api_key_cf678ca")}</Label>
        <p className="text-muted-foreground text-sm">
          {tAuto("loading_b04ba49")}
        </p>
      </div>
    );
  }

  const modelProvider = p.modelParams.provider.value;
  const apiKey = apiKeys.data?.data.find((k) => k.provider === modelProvider);

  return (
    <div className="space-y-2 text-xs">
      <Label className="text-xs font-bold">{tAuto("api_key_cf678ca")}</Label>
      <div>
        {apiKey ? (
          <Link href={`/project/${p.projectId}/settings/llm-connections`}>
            <span className="bg-input mr-2 rounded-sm p-1 text-xs">
              {apiKey.displaySecretKey}
            </span>
          </Link>
        ) : undefined}
      </div>
    </div>
  );
};
