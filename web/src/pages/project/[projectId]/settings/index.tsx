import Header from "@/src/components/layouts/header";
import { ApiKeyList } from "@/src/features/public-api/components/ApiKeyList";
import { DeleteProjectButton } from "@/src/features/projects/components/DeleteProjectButton";
import { HostNameProject } from "@/src/features/projects/components/HostNameProject";
import RenameProject from "@/src/features/projects/components/RenameProject";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { LlmApiKeyList } from "@/src/features/public-api/components/LLMApiKeyList";
import { PagedSettingsContainer } from "@/src/components/PagedSettingsContainer";
import { useQueryProject } from "@/src/features/projects/hooks";
import { MembershipInvitesPage } from "@/src/features/rbac/components/MembershipInvitesPage";
import { MembersTable } from "@/src/features/rbac/components/MembersTable";
import { JSONView } from "@/src/components/ui/CodeJsonViewer";
import { PostHogLogo } from "@/src/components/PosthogLogo";
import { MixpanelLogo } from "@/src/components/MixpanelLogo";
import { Card } from "@/src/components/ui/card";
import { TransferProjectButton } from "@/src/features/projects/components/TransferProjectButton";
import { useHasEntitlement } from "@/src/features/entitlements/hooks";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { useRouter } from "next/router";
import { SettingsDangerZone } from "@/src/components/SettingsDangerZone";
import { ActionButton } from "@/src/components/ActionButton";
import { BatchExportsSettingsPage } from "@/src/features/batch-exports/components/BatchExportsSettingsPage";
import { BatchActionsSettingsPage } from "@/src/features/batch-actions/components/BatchActionsSettingsPage";
import { AuditLogsSettingsPage } from "@/src/ee/features/audit-log-viewer/AuditLogsSettingsPage";
import { ModelsSettings } from "@/src/features/models/components/ModelSettings";
import ConfigureRetention from "@/src/features/projects/components/ConfigureRetention";
import ContainerPage from "@/src/components/layouts/container-page";
import ProtectedLabelsSettings from "@/src/features/prompts/components/ProtectedLabelsSettings";
import { SiSlack } from "react-icons/si";
import { ScoreConfigSettings } from "@/src/features/score-configs/components/ScoreConfigSettings";
import { env } from "@/src/env.mjs";
import { PersonalNotificationSettings } from "@/src/features/notifications/components/PersonalNotificationSettings";
import { ProjectNotificationChannels } from "@/src/features/notifications/components/ProjectNotificationChannels";
import { WebCalloutIntegrationCard } from "@/src/features/web-callouts/components/WebCalloutSettingsPage";
import { DeveloperToolsSettings } from "@/src/features/developer-tools/components/DeveloperToolsSettings";
import {
  I18nText,
  type AutoTranslator,
  useAutoTranslations,
} from "@/src/features/i18n/I18nText";

type ProjectSettingsPage = {
  title: React.ReactNode;
  slug: string;
  show?: boolean | (() => boolean);
  cmdKKeywords?: string[];
} & ({ content: React.ReactNode } | { href: string });

export function useProjectSettingsPages(): ProjectSettingsPage[] {
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const { project, organization } = useQueryProject();
  const showBillingSettings = useHasEntitlement("cloud-billing");
  const showRetentionSettings = useHasEntitlement("data-retention");
  const showProtectedLabelsSettings = useHasEntitlement(
    "prompt-protected-labels",
  );
  if (!project || !organization || !router.query.projectId) {
    return [];
  }

  return getProjectSettingsPages({
    tAuto,
    project,
    organization,
    showBillingSettings,
    showRetentionSettings,
    showLLMConnectionsSettings: true,
    showProtectedLabelsSettings,
  });
}

export const getProjectSettingsPages = ({
  tAuto,
  project,
  organization,
  showBillingSettings,
  showRetentionSettings,
  showLLMConnectionsSettings,
  showProtectedLabelsSettings,
}: {
  tAuto: AutoTranslator;
  project: { id: string; name: string; metadata: Record<string, unknown> };
  organization: { id: string; name: string; metadata: Record<string, unknown> };
  showBillingSettings: boolean;
  showRetentionSettings: boolean;
  showLLMConnectionsSettings: boolean;
  showProtectedLabelsSettings: boolean;
}): ProjectSettingsPage[] => [
  {
    title: tAuto("general_9239ee2"),
    slug: "index",
    cmdKKeywords: ["name", "id", "delete", "transfer", "ownership"],
    content: (
      <div className="flex flex-col gap-6">
        <HostNameProject />
        <RenameProject />
        {showRetentionSettings && <ConfigureRetention />}
        <div>
          <Header title={tAuto("debug_information_431bd43")} />
          <JSONView
            title={tAuto("metadata_251edc0")}
            json={{
              project: {
                name: project.name,
                id: project.id,
                ...project.metadata,
              },
              org: {
                name: organization.name,
                id: organization.id,
                ...organization.metadata,
              },
              ...(env.NEXT_PUBLIC_LANGFUSE_CLOUD_REGION && {
                cloudRegion: env.NEXT_PUBLIC_LANGFUSE_CLOUD_REGION,
              }),
            }}
          />
        </div>
        <SettingsDangerZone
          items={[
            {
              title: <I18nText id="transfer_ownership_a6819ec" />,
              description: (
                <I18nText id="transfer_this_project_to_another_organization_where__bc1c45c" />
              ),
              button: <TransferProjectButton />,
            },
            {
              title: <I18nText id="delete_this_project_a4da9b6" />,
              description: (
                <I18nText id="once_you_delete_a_project_there_is_no_going_back_ple_43d01a4" />
              ),
              button: <DeleteProjectButton />,
            },
          ]}
        />
      </div>
    ),
  },
  {
    title: tAuto("api_keys_e18ffc8"),
    slug: "api-keys",
    cmdKKeywords: ["auth", "public key", "secret key"],
    content: (
      <div className="flex flex-col gap-6">
        <ApiKeyList entityId={project.id} scope="project" />
      </div>
    ),
  },
  {
    title: tAuto("mcp_cli_38b1ba7"),
    slug: "developer-tools",
    cmdKKeywords: [
      "mcp",
      "cli",
      "skill",
      "agent",
      "model context protocol",
      "command line",
      "claude code",
      "cursor",
    ],
    content: <DeveloperToolsSettings projectId={project.id} />,
  },
  {
    title: tAuto("llm_connections_96dfc0b"),
    slug: "llm-connections",
    cmdKKeywords: [
      "llm",
      "provider",
      "openai",
      "anthropic",
      "azure",
      "playground",
      "evaluation",
      "endpoint",
      "api",
    ],
    content: (
      <div className="flex flex-col gap-6">
        <LlmApiKeyList projectId={project.id} />
      </div>
    ),
    show: showLLMConnectionsSettings,
  },
  {
    title: tAuto("model_definitions_77038cb"),
    slug: "models",
    cmdKKeywords: ["cost", "token"],
    content: <ModelsSettings projectId={project.id} />,
  },
  {
    title: tAuto("protected_prompt_labels_b2fccc6"),
    slug: "protected-prompt-labels",
    cmdKKeywords: ["prompt", "label", "protect", "lock"],
    content: <ProtectedLabelsSettings projectId={project.id} />,
    show: showProtectedLabelsSettings,
  },
  {
    title: tAuto("scores_configs_b6a4844"),
    slug: "scores",
    cmdKKeywords: ["config"],
    content: <ScoreConfigSettings projectId={project.id} />,
  },
  {
    title: tAuto("members_1cb449c"),
    slug: "members",
    cmdKKeywords: ["invite", "user"],
    content: (
      <div>
        <Header title={tAuto("project_members_75fd3aa")} />
        <MembersTable
          orgId={organization.id}
          project={{ id: project.id, name: project.name }}
          showSettingsCard
        />
        <div>
          <MembershipInvitesPage
            orgId={organization.id}
            projectId={project.id}
          />
        </div>
      </div>
    ),
  },
  {
    title: tAuto("integrations_a7881ca"),
    slug: "integrations",
    cmdKKeywords: ["posthog", "mixpanel", "analytics", "callback", "webhook"],
    content: <Integrations projectId={project.id} />,
  },
  {
    title: tAuto("exports_0e16537"),
    slug: "exports",
    cmdKKeywords: ["csv", "download", "json", "batch"],
    content: <BatchExportsSettingsPage projectId={project.id} />,
  },
  {
    title: tAuto("batch_actions_494f6a3"),
    slug: "batch-actions",
    cmdKKeywords: ["bulk", "batch", "action", "dataset", "delete"],
    content: <BatchActionsSettingsPage projectId={project.id} />,
  },
  {
    title: tAuto("audit_logs_344c7ff"),
    slug: "audit-logs",
    cmdKKeywords: ["trail"],
    content: <AuditLogsSettingsPage projectId={project.id} />,
  },
  {
    title: tAuto("notifications_753a22b"),
    slug: "notifications",
    cmdKKeywords: ["inbox", "email", "mention", "alert", "slack", "webhook"],
    content: (
      <div className="flex flex-col gap-6">
        <PersonalNotificationSettings />
        <ProjectNotificationChannels projectId={project.id} />
      </div>
    ),
  },
  {
    title: tAuto("billing_abaec45"),
    slug: "billing",
    href: `/organization/${organization.id}/settings/billing`,
    show: showBillingSettings,
  },
  {
    title: tAuto("organization_settings_514d77c"),
    slug: "organization",
    href: `/organization/${organization.id}/settings`,
  },
];

export default function SettingsPage() {
  const tAuto = useAutoTranslations();
  const { project, organization } = useQueryProject();
  const router = useRouter();
  const pages = useProjectSettingsPages();

  if (!project || !organization) return null;

  return (
    <ContainerPage
      headerProps={{
        title: tAuto("project_settings_6461d2a"),
      }}
    >
      <PagedSettingsContainer
        activeSlug={router.query.page as string | undefined}
        pages={pages}
      />
    </ContainerPage>
  );
}

const Integrations = (props: { projectId: string }) => {
  const tAuto = useAutoTranslations();
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "integrations:CRUD",
  });

  const allowBlobStorageIntegration = useHasEntitlement(
    "scheduled-blob-exports",
  );

  return (
    <div>
      <Header title={tAuto("integrations_a7881ca")} />
      <div className="space-y-6">
        <Card className="p-3">
          {}
          <PostHogLogo className="text-foreground mb-4 w-40" />
          <p className="text-primary mb-4 text-sm">
            {tAuto(
              "we_have_teamed_up_with_posthog_oss_product_analytics_ca88b01",
            )}{" "}
          </p>
          <div className="flex items-center gap-2">
            <ActionButton
              variant="secondary"
              hasAccess={hasAccess}
              href={`/project/${props.projectId}/settings/integrations/posthog`}
            >
              {tAuto("configure_792c81a")}{" "}
            </ActionButton>
            <Button asChild variant="ghost">
              <Link
                href="https://langfuse.com/integrations/analytics/posthog"
                target="_blank"
              >
                {tAuto("integration_docs_aca3483")}{" "}
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-3">
          <MixpanelLogo className="text-foreground mb-4 w-20" />
          <p className="text-primary mb-4 text-sm">
            {tAuto(
              "integrate_with_mixpanel_to_sync_your_langfuse_traces_37e583e",
            )}{" "}
          </p>
          <div className="flex items-center gap-2">
            <ActionButton
              variant="secondary"
              hasAccess={hasAccess}
              href={`/project/${props.projectId}/settings/integrations/mixpanel`}
            >
              {tAuto("configure_792c81a")}{" "}
            </ActionButton>
            <Button asChild variant="ghost">
              <Link
                href="https://langfuse.com/integrations/analytics/mixpanel"
                target="_blank"
              >
                {tAuto("integration_docs_aca3483")}{" "}
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-3">
          <span className="font-bold">{tAuto("blob_storage_79bffc1")}</span>
          <p className="text-primary mb-4 text-sm">
            {tAuto(
              "configure_scheduled_exports_of_your_trace_data_to_s3_1e41e80",
            )}{" "}
          </p>
          <div className="flex items-center gap-2">
            <ActionButton
              variant="secondary"
              hasAccess={hasAccess}
              hasEntitlement={allowBlobStorageIntegration}
              href={`/project/${props.projectId}/settings/integrations/blobstorage`}
            >
              {tAuto("configure_792c81a")}{" "}
            </ActionButton>
            <Button asChild variant="ghost">
              <Link
                href="https://langfuse.com/docs/query-traces#blob-storage"
                target="_blank"
              >
                {tAuto("integration_docs_aca3483")}{" "}
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-3">
          <div className="mb-4 flex items-center gap-2">
            <SiSlack className="text-foreground h-5 w-5" />
            <span className="font-bold">Slack</span>
          </div>
          <p className="text-primary mb-4 text-sm">
            {tAuto(
              "connect_a_slack_workspace_and_create_channel_automat_7d00cd2",
            )}{" "}
          </p>
          <div className="flex items-center gap-2">
            <ActionButton
              variant="secondary"
              hasAccess={hasAccess}
              href={`/project/${props.projectId}/settings/integrations/slack`}
            >
              {tAuto("configure_792c81a")}{" "}
            </ActionButton>
          </div>
        </Card>

        <WebCalloutIntegrationCard
          projectId={props.projectId}
          hasAccess={hasAccess}
        />
      </div>
    </div>
  );
};
