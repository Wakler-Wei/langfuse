import { ActionButton } from "@/src/components/ActionButton";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { SplashScreen } from "@/src/components/ui/splash-screen";
import { copyTextToClipboard } from "@/src/utils/clipboard";
import { ApiKeyDetailContent } from "@/src/features/public-api/components/ApiKeyDetailContent";
import { useLangfuseBaseUrl } from "@/src/features/public-api/hooks/useLangfuseEnvCode";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { api } from "@/src/utils/api";
import { type RouterOutput } from "@/src/utils/types";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { Check, Copy, LockIcon, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";
import { useTranslations } from "next-intl";

const SKILLS_INSTALL_COMMAND =
  "Install the Langfuse AI skill from github.com/langfuse/skills and use it to add tracing to this application with Langfuse following best practices.";
const MANUAL_TRACING_DOCS_URL =
  "https://langfuse.com/docs/observability/get-started";

function CopyableSnippet({
  value,
  onCopy,
}: {
  value: string;
  onCopy?: () => void;
}) {
  const tAuto = useAutoTranslations();
  const tSetup = useTranslations("Setup");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyTextToClipboard(value);
      onCopy?.();
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      toast.error(tAuto("failed_to_copy_to_clipboard_23e4dc8"));
    }
  };

  return (
    <div className="bg-muted/50 flex items-center gap-4 rounded-2xl border p-5 shadow-xs">
      <code className="min-w-0 flex-1 font-mono text-xs leading-6 break-words whitespace-pre-wrap sm:text-sm">
        {value}
      </code>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-2"
        onClick={() => handleCopy()}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? tSetup("copied") : tSetup("copyPrompt")}
      </Button>
    </div>
  );
}

export function TracesSetupOnboardingCard({
  projectId,
}: {
  projectId: string;
}) {
  const tAuto = useAutoTranslations();
  const tSetup = useTranslations("Setup");
  const capture = usePostHogClientCapture();
  const baseUrl = useLangfuseBaseUrl();
  const hasApiKeyCreateAccess = useHasProjectAccess({
    projectId,
    scope: "apiKeys:CUD",
  });
  const [apiKeys, setApiKeys] = useState<
    RouterOutput["projectApiKeys"]["create"] | null
  >(null);
  const utils = api.useUtils();
  const mutCreateApiKey = api.projectApiKeys.create.useMutation({
    onSuccess: (data) => {
      utils.projectApiKeys.invalidate();
      setApiKeys(data);
    },
  });

  const createApiKey = async () => {
    capture("onboarding:tracing_api_key_create_clicked");

    try {
      await mutCreateApiKey.mutateAsync({ projectId });
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error(tAuto("failed_to_create_api_key_5e78089"));
    }
  };

  return (
    <SplashScreen
      waitingFor={tSetup("waitingForFirstTrace")}
      title={tAuto(
        "time_to_log_your_first_trace_it_only_takes_a_minute_175e656",
      )}
      description={tAuto(
        "get_your_api_keys_first_then_ask_your_coding_agent_t_b6b51e9",
      )}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/traces-overview-v1.mp4"
      videoPosition="bottom"
      steps={[
        {
          title: tAuto("create_api_keys_e5f0bf3"),
          description: tAuto(
            "your_application_needs_api_keys_to_send_traces_to_la_ca265ed",
          ),
          content: apiKeys ? (
            <ApiKeyDetailContent
              scope="project"
              secretKey={apiKeys.secretKey}
              publicKey={apiKeys.publicKey}
              baseUrl={baseUrl}
              className="mt-1"
              showMcpSection={false}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {hasApiKeyCreateAccess ? (
                <Button
                  onClick={createApiKey}
                  loading={mutCreateApiKey.isPending}
                  className="self-start"
                >
                  {tAuto("create_new_api_key_87fc3d3")}{" "}
                </Button>
              ) : (
                <Button disabled className="self-start">
                  <LockIcon
                    className="mr-2 -ml-0.5 h-4 w-4"
                    aria-hidden="true"
                  />
                  {tAuto("create_new_api_key_87fc3d3")}{" "}
                </Button>
              )}
              <ActionButton
                href={`/project/${projectId}/settings/api-keys`}
                variant="secondary"
              >
                {tAuto("manage_api_keys_85a7ad2")}{" "}
              </ActionButton>
            </div>
          ),
        },
        {
          title: tAuto("add_tracing_with_your_coding_agent_2a169b0"),
          badge: (
            <Badge variant="tertiary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {tAuto("recommended_9ef9375")}{" "}
            </Badge>
          ),
          description: tAuto(
            "paste_this_prompt_into_claude_cursor_copilot_or_anot_888eef1",
          ),
          content: (
            <>
              <CopyableSnippet
                value={SKILLS_INSTALL_COMMAND}
                onCopy={() =>
                  capture("onboarding:tracing_agent_prompt_copy_clicked", {
                    projectId,
                  })
                }
              />
              <div className="mt-3">
                <Link
                  href={MANUAL_TRACING_DOCS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex text-sm underline underline-offset-4 hover:no-underline"
                  onClick={() =>
                    capture("onboarding:tracing_manual_docs_link_clicked", {
                      href: MANUAL_TRACING_DOCS_URL,
                      projectId,
                    })
                  }
                >
                  {tAuto(
                    "or_follow_our_docs_to_set_up_tracing_manually_28ad2b0",
                  )}{" "}
                </Link>
              </div>
            </>
          ),
        },
        {
          title: tAuto("run_your_app_traces_will_appear_here_3a40e52"),
          description: tAuto(
            "once_your_app_makes_an_llm_call_traces_show_up_withi_413285b",
          ),
        },
      ]}
    />
  );
}
