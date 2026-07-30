import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { api } from "@/src/utils/api";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import ContainerPage from "@/src/components/layouts/container-page";
import { ActionButton } from "@/src/components/ActionButton";
import { SubHeader } from "@/src/components/layouts/header";
import { Button } from "@/src/components/ui/button";
import { ApiKeyDetailContent } from "@/src/features/public-api/components/ApiKeyDetailContent";
import { useLangfuseBaseUrl } from "@/src/features/public-api/hooks/useLangfuseEnvCode";
import { type RouterOutput } from "@/src/utils/types";
import { useState } from "react";
import { useQueryProject } from "@/src/features/projects/hooks";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const TracingSetup = ({
  projectId,
  hasTracingConfigured,
}: {
  projectId: string;
  hasTracingConfigured?: boolean;
}) => {
  const tAuto = useAutoTranslations();
  const baseUrl = useLangfuseBaseUrl();
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
    try {
      await mutCreateApiKey.mutateAsync({ projectId });
    } catch (error) {
      console.error("Error creating API key:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <SubHeader title={tAuto("1_get_api_keys_d0d9d3c")} />
        {apiKeys ? (
          <ApiKeyDetailContent
            scope="project"
            secretKey={apiKeys.secretKey}
            publicKey={apiKeys.publicKey}
            baseUrl={baseUrl}
            className="mt-4"
            showMcpSection={false}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              {tAuto(
                "you_need_to_create_an_api_key_to_start_tracing_your__e7edb97",
              )}{" "}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={createApiKey}
                loading={mutCreateApiKey.isPending}
                className="self-start"
              >
                {tAuto("create_new_api_key_87fc3d3")}{" "}
              </Button>
              <ActionButton
                href={`/project/${projectId}/settings/api-keys`}
                variant="secondary"
              >
                {tAuto("manage_api_keys_85a7ad2")}{" "}
              </ActionButton>
            </div>
          </div>
        )}
      </div>

      <div>
        <SubHeader
          title={tAuto("2_add_tracing_to_your_application_73b497e")}
          status={hasTracingConfigured ? "active" : "pending"}
        />
        <p className="text-muted-foreground mb-4 text-sm">
          {tAuto(
            "langfuse_relies_on_opentelemetry_to_instrument_your__523752e",
          )}{" "}
        </p>
        <ActionButton href="https://langfuse.com/docs/observability/get-started">
          {tAuto("quickstart_guide_5ee5d76")}{" "}
        </ActionButton>
      </div>
    </div>
  );
};

export default function TracesSetupPage() {
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const { project } = useQueryProject();

  // Check if the user has tracing configured
  // Skip polling entirely if the project flag is already set in the session
  const { data: hasTracingConfigured } =
    api.traces.hasTracingConfigured.useQuery(
      { projectId },
      {
        enabled: !!projectId,
        refetchInterval: project?.hasTraces ? false : 5000,
        initialData: project?.hasTraces ? true : undefined,
        staleTime: project?.hasTraces ? Infinity : 0,
        trpc: {
          context: {
            skipBatch: true,
          },
        },
      },
    );

  const capture = usePostHogClientCapture();
  useEffect(() => {
    if (hasTracingConfigured !== undefined) {
      capture("onboarding:tracing_check_active", {
        active: hasTracingConfigured,
      });
    }
  }, [hasTracingConfigured, capture]);

  return (
    <ContainerPage
      headerProps={{
        title: tAuto("tracing_setup_1cdd2cc"),
        help: {
          description: tAuto(
            "setup_tracing_to_track_and_analyze_your_llm_calls_yo_573f723",
          ),
          href: "https://langfuse.com/docs/observability/overview",
        },
      }}
    >
      <div className="flex flex-col gap-4">
        <TracingSetup
          projectId={projectId}
          hasTracingConfigured={hasTracingConfigured ?? false}
        />
      </div>
    </ContainerPage>
  );
}
