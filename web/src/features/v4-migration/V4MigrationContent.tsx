/* eslint-disable @repo/no-style-props */
import { type ReactNode, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  BotMessageSquare,
  ChevronRight,
  Copy,
  LibraryBig,
  LifeBuoy,
  TriangleAlert,
} from "lucide-react";
import { useInAppAiAgent } from "@/src/features/in-app-agent/components/InAppAiAgentProvider";
import { useSupportDrawer } from "@/src/features/support-chat/SupportDrawerProvider";
import { Button } from "@/src/components/ui/button";
import { CodeView } from "@/src/components/ui/CodeJsonViewer";
import { RainbowButton } from "@/src/components/magicui/rainbow-button";
import { Separator } from "@/src/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { cn } from "@/src/utils/tailwind";
import {
  formatSdkUpgradeRequirement,
  formatSdkVersion,
  type V4MigrationSdkState,
} from "@/src/features/v4-migration/sdkVersionStatus";
import { useProjectV4MigrationData } from "@/src/features/v4-migration/hooks/useV4MigrationData";
import {
  getProjectMigrationReadiness,
  V4_MIGRATION_LOOKBACK_DAYS,
  type MigrationActionState,
  type MigrationCountState,
} from "@/src/features/v4-migration/migrationData";
import { useV4Beta } from "@/src/features/events/hooks/useV4Beta";
import { numberFormatter } from "@/src/utils/numbers";
import { formatCompactRelativeTime } from "@/src/utils/dates";
import { useProject } from "@/src/features/projects/hooks";
import { V4PreviewToggleRow } from "@/src/features/events/components/V4SidebarToggle";
import {
  useEvalUpgradeAssistantPlan,
  V4_CODING_AGENT_PROMPT,
} from "@/src/features/v4-migration/useV4UpgradeAssistantSupport";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { api } from "@/src/utils/api";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

// Single source of truth for the v4-migration copy and content. Both surfaces
// (side panel and modal) render these components — edit copy here only.

const V4_DOCS_URL = "https://langfuse.com/docs/v4";
const SDK_UPGRADE_URL =
  "https://langfuse.com/docs/observability/sdk/upgrade-path";
const OTEL_V4_MIGRATION_URL =
  "https://langfuse.com/integrations/native/opentelemetry/migration-to-v4";
const DEPRECATED_API_MIGRATION_URL =
  "https://langfuse.com/faq/all/deprecated-api-migration";
const OBSERVATIONS_DATA_MODEL_URL =
  "https://langfuse.com/docs/observability/data-model#observations-and-traces";
const DEPRECATED_INTEGRATION_MIGRATION_URLS: Record<string, string> = {
  PostHog:
    "https://langfuse.com/integrations/analytics/posthog#migrate-export-source",
  Mixpanel:
    "https://langfuse.com/integrations/analytics/mixpanel#migrate-export-source",
  "Blob Storage":
    "https://langfuse.com/docs/api-and-data-platform/features/export-to-blob-storage#upgrade-path",
};
const EXPERIMENT_OTEL_INGESTION_URL =
  "https://langfuse.com/integrations/native/opentelemetry/experiments";

// Copies the agent migration prompt to the clipboard with toast + analytics;
// shared by the panel/modal header CTA and the status page.
export function useCopyMigrationPrompt() {
  const tAuto = useAutoTranslations();
  const capture = usePostHogClientCapture();

  return async () => {
    capture("v4_migration:coding_agent_prompt_copied");
    await navigator.clipboard.writeText(V4_CODING_AGENT_PROMPT);
    showSuccessToast({
      title: tAuto("prompt_copied_cbd262b"),
      description: tAuto(
        "paste_it_into_cursor_codex_or_another_coding_agent_522a9d9",
      ),
    });
  };
}

function Chip({
  children,
  variant,
}: {
  children: ReactNode;
  variant: "warning" | "success";
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap",
        variant === "warning"
          ? "bg-light-yellow text-dark-yellow"
          : "bg-light-green text-dark-green",
      )}
    >
      {children}
    </span>
  );
}

function Section({
  title,
  chip,
  children,
}: {
  title: string;
  chip: ReactNode;
  children: ReactNode;
}) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="group flex w-full items-center gap-2.5 py-1.5 text-left">
        <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-90" />
        <span className="flex-1 text-sm">{title}</span>
        {chip}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-0.5 pb-3.5 pl-6.5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function MonoValue({ children }: { children: ReactNode }) {
  return <span className="text-foreground font-bold">{children}</span>;
}

function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("text-dark-blue hover:underline", className)}
    >
      {children}
    </a>
  );
}

function ApiKeyCopyField({
  label,
  value,
}: {
  label: ReactNode;
  value: string;
}) {
  const truncatedValue = `${value.slice(0, 8)}…${value.slice(-4)}`;

  return (
    <div className="flex min-w-0 items-stretch overflow-hidden rounded-md border">
      <div className="bg-muted text-muted-foreground flex w-24 shrink-0 items-center justify-center border-r text-xs font-bold">
        {label}
      </div>
      <CodeView
        content={truncatedValue}
        originalContent={value}
        className="min-w-0 flex-1 [&>div]:rounded-none [&>div]:border-0"
        lineWrap={false}
      />
    </div>
  );
}

function MigrationCountChip({
  state,
  affectedLabel,
}: {
  state: MigrationCountState;
  affectedLabel: string;
}) {
  const tAuto = useAutoTranslations();
  if (state.status === "loading") {
    return <Chip variant="warning">{tAuto("checking_97876b8")}</Chip>;
  }
  if (state.status === "error") {
    return <Chip variant="warning">{tAuto("check_failed_0ddb840")}</Chip>;
  }
  if (state.count === 0) {
    return <Chip variant="success">{tAuto("up_to_date_82fb1d5")}</Chip>;
  }
  return (
    <Chip variant="warning">
      {state.count} {affectedLabel}
    </Chip>
  );
}

function MigrationActionChip({ state }: { state: MigrationActionState }) {
  const tAuto = useAutoTranslations();
  if (state.status === "loading") {
    return <Chip variant="warning">{tAuto("checking_97876b8")}</Chip>;
  }
  if (state.status === "error") {
    return <Chip variant="warning">{tAuto("check_failed_0ddb840")}</Chip>;
  }
  return state.result === "required" ? (
    <Chip variant="warning">{tAuto("update_required_f440d88")}</Chip>
  ) : state.result === "sdk_usage_inconclusive" ? (
    <Chip variant="warning">{tAuto("needs_review_33a506c")}</Chip>
  ) : (
    <Chip variant="success">{tAuto("up_to_date_82fb1d5")}</Chip>
  );
}

function V4MigrationSdkSection({ sdk }: { sdk: V4MigrationSdkState }) {
  const tAuto = useAutoTranslations();
  const detectedSdkSeries = sdk.sdkUsageSeries.filter(
    (series) => series.canonicalSdkName !== null,
  );
  const chip =
    sdk.status === "latest" ? (
      <Chip variant="success">{tAuto("up_to_date_82fb1d5")}</Chip>
    ) : sdk.status === "otel_realtime" ? (
      <Chip variant="success">{tAuto("otel_real_time_c9d51a9")}</Chip>
    ) : sdk.status === "no_data" ? (
      <Chip variant="success">{tAuto("no_data_detected_05ecc63")}</Chip>
    ) : sdk.status === "checking" ? (
      <Chip variant="warning">{tAuto("checking_97876b8")}</Chip>
    ) : sdk.status === "otel_header_required" ? (
      <Chip variant="warning">{tAuto("otel_header_required_be25ba5")}</Chip>
    ) : sdk.status === "unknown" ? (
      <Chip variant="warning">{tAuto("needs_review_33a506c")}</Chip>
    ) : sdk.status === "error" ? (
      <Chip variant="warning">{tAuto("check_failed_0ddb840")}</Chip>
    ) : (
      <Chip variant="warning">
        {sdk.upgradeRequiredCount} {tAuto("outdated_b85a517")}
      </Chip>
    );

  return (
    <Section title={tAuto("tracing_instrumentation_177ec8c")} chip={chip}>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {sdk.status === "checking" ? (
          tAuto("checking_the_latest_traces_for_this_project_76a5a59")
        ) : sdk.status === "otel_header_required" ? (
          <>
            OTel data is arriving through the delayed ingestion path. Set the{" "}
            <MonoValue>x-langfuse-ingestion-version</MonoValue> header to{" "}
            <MonoValue>4</MonoValue> on the OTLP exporter to use real-time
            ingestion.{" "}
            <ExternalLink href={OTEL_V4_MIGRATION_URL}>
              OpenTelemetry migration guide
            </ExternalLink>
            .
          </>
        ) : sdk.status === "otel_realtime" ? (
          tAuto("otel_data_is_using_real_time_ingestion_no_ingestion__7417d49")
        ) : sdk.status === "no_data" ? (
          tAuto(
            "no_ingestion_data_was_detected_in_the_last_value0_da_03f09e6",
            { value0: String((V4_MIGRATION_LOOKBACK_DAYS as unknown) ?? "") },
          )
        ) : sdk.status === "unknown" ? (
          tAuto("we_could_not_recognize_every_detected_sdk_version_ve_f5b0c7d")
        ) : sdk.status === "error" ? (
          tAuto("we_could_not_check_the_latest_traces_for_this_projec_7a67462")
        ) : sdk.status === "latest" ? (
          tAuto("all_detected_langfuse_sdk_versions_are_up_to_date_0c24a50")
        ) : (
          <>
            {sdk.upgradeRequiredCount} detected SDK{" "}
            {sdk.upgradeRequiredCount === 1
              ? "configuration needs"
              : "configurations need"}{" "}
            an update.{" "}
            <ExternalLink href={SDK_UPGRADE_URL}>Upgrade the SDK</ExternalLink>{" "}
            for real-time data and the latest tracing experience.
          </>
        )}
      </p>
      {detectedSdkSeries.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {detectedSdkSeries.map((series) => {
            const sdkLabel = formatSdkVersion({
              language: series.canonicalSdkName ?? series.sdkName,
              version: series.sdkVersion,
            });
            const publicKey =
              series.publicKey.length > 18
                ? `${series.publicKey.slice(0, 9)}…${series.publicKey.slice(-6)}`
                : series.publicKey || "No API key";

            return (
              <li
                key={`${series.sdkName}:${series.sdkVersion}:${series.publicKey}`}
                className="text-muted-foreground flex flex-wrap items-baseline gap-x-1.5 text-xs"
              >
                <MonoValue>{sdkLabel}</MonoValue>
                <span title={series.publicKey || undefined}>{publicKey}</span>
                <span>
                  {tAuto("last_seen_f8bfa44")}{" "}
                  {formatCompactRelativeTime(new Date(series.lastSeen))}
                </span>
                {series.v4MigrationStatus === "upgrade_required" &&
                  !series.upgradeCompleted && (
                    <span className="text-dark-yellow">
                      · {formatSdkUpgradeRequirement(series.canonicalSdkName)}
                    </span>
                  )}
                {series.upgradeCompleted && (
                  <span>{tAuto("upgrade_completed_2722d43")}</span>
                )}
                {series.v4MigrationStatus === "unknown" && (
                  <span className="text-dark-yellow">
                    {tAuto("version_not_recognized_e4537ab")}{" "}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

// Title, description, and the primary agent CTA. The CTA is two-step: the
// first click reveals the prompt so users can see what they hand to their
// agent, the second click copies it.
export function V4MigrationHeaderContent({
  projectName,
  projectId,
  onNavigate,
  titleRowClassName,
}: {
  projectName?: string;
  projectId?: string;
  /** Fires when an internal link is followed so the surface can close. */
  onNavigate?: () => void;
  /** Extra classes on the title row. The modal host passes a right gutter:
   *  its dialog floats a fallback close button over the body's top-right
   *  corner (the title is sr-only, so there is no DialogHeader row), which
   *  would otherwise overlap the right-aligned status link. */
  titleRowClassName?: string;
}) {
  const tAuto = useAutoTranslations();
  const capture = usePostHogClientCapture();
  const handleCopyPrompt = useCopyMigrationPrompt();
  const [promptVisible, setPromptVisible] = useState(false);

  // Same queries as V4MigrationDetailsContent below, so react-query dedupes
  // them. Only claim the project needs migrating once the checks confirm it —
  // a fully migrated project shows the v4 value prop without a status claim.
  const { organization } = useProject(projectId ?? null);
  const migrationData = useProjectV4MigrationData({
    projectId,
    orgId: organization?.id,
    enabled: Boolean(projectId),
  });
  const needsMigration =
    Boolean(projectId) &&
    getProjectMigrationReadiness(migrationData) === "action-needed";

  const [generatedKeys, setGeneratedKeys] = useState<{
    projectId: string;
    secretKey: string;
    publicKey: string;
  } | null>(null);
  const generatedKeysForProject =
    generatedKeys?.projectId === projectId ? generatedKeys : null;

  const utils = api.useUtils();
  const mutCreateProjectApiKey = api.projectApiKeys.create.useMutation({
    onSuccess: () => utils.projectApiKeys.invalidate(),
  });
  const hasApiKeyCreateAccess = useHasProjectAccess({
    projectId,
    scope: "apiKeys:CUD",
  });

  const handleShowPrompt = () => {
    capture("v4_migration:coding_agent_prompt_viewed");
    setPromptVisible(true);
    if (
      !projectId ||
      !hasApiKeyCreateAccess ||
      mutCreateProjectApiKey.isPending
    )
      return;

    mutCreateProjectApiKey
      .mutateAsync({
        projectId,
        note: "v4-migration-key",
      })
      .then(({ secretKey, publicKey }) => {
        setGeneratedKeys({
          projectId,
          secretKey,
          publicKey,
        });
        capture(`project_settings:api_key_create`);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <>
      <div
        className={cn(
          "mb-1.5 flex items-baseline justify-between gap-2",
          titleRowClassName,
        )}
      >
        <p className="min-w-0 text-lg font-bold">
          {projectName ? (
            <>Migrate {projectName} to v4</>
          ) : (
            tAuto("migrate_to_v4_5967566")
          )}
        </p>
        <Link
          href="/v4-migration"
          onClick={() => {
            capture("v4_migration:panel_status_link_clicked");
            onNavigate?.();
          }}
          className="shrink-0 text-sm underline"
        >
          {tAuto("view_status_0efd573")}{" "}
        </Link>
      </div>
      <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
        <ExternalLink href={V4_DOCS_URL} className="text-inherit underline">
          {tAuto("langfuse_v4_98d761d")}{" "}
        </ExternalLink>{" "}
        {tAuto("is_here_real_time_up_to_165_faster_plus_new_dashboar_236e1f0")}{" "}
        {needsMigration &&
          " This project still uses the previous setup, which stops working soon."}
      </p>
      <div className="flex flex-col gap-2">
        {promptVisible && (
          <div className="bg-muted/50 max-h-44 overflow-y-auto rounded-md border p-3">
            <code className="text-muted-foreground font-mono text-xs leading-5 break-words whitespace-pre-wrap">
              {V4_CODING_AGENT_PROMPT}
            </code>
          </div>
        )}
        <RainbowButton
          className="w-full"
          onClick={promptVisible ? handleCopyPrompt : handleShowPrompt}
        >
          {promptVisible ? (
            <>
              <Copy className="mr-1.5 h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate" title="Copy prompt">
                Copy prompt
              </span>
            </>
          ) : (
            <span className="min-w-0 truncate" title="Update SDK with agents">
              Update SDK with agents
            </span>
          )}
        </RainbowButton>
        {promptVisible &&
          projectId &&
          hasApiKeyCreateAccess &&
          generatedKeysForProject && (
            <div className="mt-1 flex flex-col gap-2">
              <p className="text-muted-foreground text-sm leading-relaxed">
                {tAuto(
                  "if_you_are_setting_up_the_langfuse_cli_or_skills_for_3801954",
                )}{" "}
              </p>
              <div className="flex flex-col gap-2">
                <ApiKeyCopyField
                  label={tAuto("public_key_affb45c")}
                  value={generatedKeysForProject.publicKey}
                />
                <ApiKeyCopyField
                  label={tAuto("secret_key_341f53d")}
                  value={generatedKeysForProject.secretKey}
                />
              </div>
            </div>
          )}
      </div>
    </>
  );
}

// The "Want to review first?" and "What happens if I don't update" groups.
// onNavigate fires when an internal link is followed so the hosting surface
// (panel or modal) can close itself.
export function V4MigrationDetailsContent({
  onNavigate,
  projectId: projectIdProp,
}: {
  onNavigate?: () => void;
  /** Project the content links point at; falls back to the route project. */
  projectId?: string;
}) {
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const capture = usePostHogClientCapture();
  const { openWithMode: openSupportDrawerWithMode } = useSupportDrawer();

  const routeProjectId = router.query.projectId;
  const projectId =
    projectIdProp ??
    (typeof routeProjectId === "string" ? routeProjectId : undefined);
  const { organization } = useProject(projectId ?? null);
  const migrationData = useProjectV4MigrationData({
    projectId,
    orgId: organization?.id,
    enabled: Boolean(projectId),
  });
  const { canToggleV4 } = useV4Beta();

  const handleEmailEngineer = () => {
    capture("v4_migration:contact_support_clicked");
    onNavigate?.();
    openSupportDrawerWithMode("form", { topic: "V4 Migration" });
  };
  const { setOpen: setAgentOpen, submit: submitAgentMessage } =
    useInAppAiAgent();
  const upgradePlan = useEvalUpgradeAssistantPlan({
    projectId,
    orgId: organization?.id,
    enabled: Boolean(projectId),
  });
  const evalsUrl =
    typeof projectId === "string" ? `/project/${projectId}/evals` : undefined;
  const handleMigrateEvalsWithAgent = async () => {
    capture("v4_migration:migrate_evals_with_agent_clicked");
    onNavigate?.();
    if (evalsUrl) {
      await router.push(evalsUrl).catch(() => undefined);
    }
    setAgentOpen(true);
    await submitAgentMessage(upgradePlan.assistantPrompt, {
      newConversation: true,
    });
  };
  const integrationsUrl =
    typeof projectId === "string"
      ? `/project/${projectId}/settings/integrations`
      : undefined;

  return (
    <>
      {/* The toggle row hides itself when the session cannot toggle v4
          (legacy/events_only write mode, post-rollout auto-enrollment), so the
          copy describing it must hide on the same condition. */}
      {canToggleV4 && (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-base font-bold">
                <LibraryBig className="h-4 w-4 shrink-0" />{" "}
                {tAuto("want_to_review_first_90df113")}{" "}
              </div>
              <V4PreviewToggleRow projectId={projectId} />
            </div>
            <p className="text-muted-foreground text-sm">
              {tAuto(
                "the_latest_sdk_no_longer_sets_trace_input_and_output_7ebeff0",
              )}{" "}
              <ExternalLink
                href={OBSERVATIONS_DATA_MODEL_URL}
                className="text-inherit underline"
              >
                {tAuto("infers_them_from_observations_12cbd7c")}{" "}
              </ExternalLink>
              . Use this toggle to compare both views while you upgrade.
            </p>
          </div>

          <Separator />
        </>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-base font-bold">
            <TriangleAlert className="h-4 w-4 shrink-0" /> What happens if I
            don&apos;t update?
          </div>
          <a
            href={V4_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => capture("v4_migration:panel_docs_link_clicked")}
            className="text-foreground shrink-0 text-sm underline"
          >
            {tAuto("documentation_9e9cf32")}{" "}
          </a>
        </div>
        <p className="text-muted-foreground text-sm">
          {tAuto("some_features_will_stop_working_soon_be6da4b")}{" "}
        </p>
        <div>
          <V4MigrationSdkSection sdk={migrationData.sdk} />

          <Section
            title={tAuto("evals_40b90ed")}
            chip={
              <MigrationCountChip
                state={migrationData.evals}
                affectedLabel="deprecated"
              />
            }
          >
            {migrationData.evals.status === "loading" ? (
              <p className="text-muted-foreground text-sm">
                Checking configured evals…
              </p>
            ) : migrationData.evals.status === "error" ? (
              <p className="text-muted-foreground text-sm">
                We could not check configured evals. Try again later.
              </p>
            ) : migrationData.evals.count > 0 ? (
              <>
                <p className="text-muted-foreground mb-2 text-sm">
                  {migrationData.evals.count} configured{" "}
                  {migrationData.evals.count === 1
                    ? "eval targets"
                    : "evals target"}{" "}
                  trace input/output, which{" "}
                  <span className="text-dark-yellow">
                    {migrationData.evals.count === 1 ? "stops" : "stop"} running
                    soon
                  </span>
                  . Repointing {migrationData.evals.count === 1 ? "it" : "them"}{" "}
                  at observations or experiments requires minimal changes
                  {upgradePlan.showAssistantButton
                    ? upgradePlan.mode === "evals-ready"
                      ? " — the assistant can do it for you"
                      : " — the assistant can help you choose the upgrade order"
                    : ""}
                  .
                </p>
                <div className="flex items-center gap-3">
                  {upgradePlan.showAssistantButton && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMigrateEvalsWithAgent}
                    >
                      <BotMessageSquare className="mr-1.5 h-4 w-4" />
                      Migrate with assistant
                    </Button>
                  )}
                  {evalsUrl ? (
                    <Link
                      href={evalsUrl}
                      onClick={onNavigate}
                      className="text-dark-blue text-sm hover:underline"
                    >
                      Review deprecated evals
                    </Link>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                No deprecated evals detected.
              </p>
            )}
          </Section>

          <Section
            title={tAuto("experiments_e8f296b")}
            chip={<MigrationActionChip state={migrationData.experiments} />}
          >
            {migrationData.experiments.status === "loading" ? (
              <p className="text-muted-foreground text-sm">
                Checking experiment instrumentation…
              </p>
            ) : migrationData.experiments.status === "error" ? (
              <p className="text-muted-foreground text-sm">
                We could not check experiment instrumentation. Try again later.
              </p>
            ) : migrationData.experiments.result !== "not_required" ? (
              <p className="text-muted-foreground text-sm">
                {migrationData.experimentInstrumentationUpgradePath ===
                "api" ? (
                  <>
                    This project called the deprecated{" "}
                    <MonoValue>POST /dataset-run-items</MonoValue>. Replace this
                    direct API call with OTel experiment instrumentation. See
                    the{" "}
                    <ExternalLink href={EXPERIMENT_OTEL_INGESTION_URL}>
                      OTel experiment instrumentation guide
                    </ExternalLink>{" "}
                    for more details.
                  </>
                ) : migrationData.experiments.result ===
                  "sdk_usage_inconclusive" ? (
                  <>
                    This project called{" "}
                    <MonoValue>POST /dataset-run-items</MonoValue> with an SDK
                    version that supports the experiment runner. Review that you
                    are using the experiment runner SDK and not the deprecated{" "}
                    <>
                      <>
                        <code className="bg-muted px-1 font-mono text-sm">
                          .link()
                        </code>{" "}
                        method. This warning will{" "}
                      </>
                      disappear once you{" "}
                    </>
                    upgrade to latest SDK version.
                  </>
                ) : (
                  <>
                    This project called{" "}
                    <MonoValue>POST /dataset-run-items</MonoValue> with an
                    outdated SDK.{" "}
                    <ExternalLink href={SDK_UPGRADE_URL}>
                      Upgrade the SDK
                    </ExternalLink>{" "}
                    and use the experiment runner method.
                  </>
                )}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                No experiment instrumentation updates required.
              </p>
            )}
          </Section>

          <Section
            title={tAuto("deprecated_apis_600c4c3")}
            chip={
              <MigrationCountChip
                state={migrationData.apis}
                affectedLabel="deprecated"
              />
            }
          >
            {migrationData.apis.status === "loading" ? (
              <p className="text-muted-foreground text-sm">
                Checking public API usage…
              </p>
            ) : migrationData.apis.status === "error" ? (
              <p className="text-muted-foreground text-sm">
                We could not check public API usage. Try again later.
              </p>
            ) : migrationData.apiUsage.length > 0 ? (
              <>
                <p className="text-muted-foreground mb-2 text-sm">
                  You&apos;ve called these deprecated endpoints in the last{" "}
                  {V4_MIGRATION_LOOKBACK_DAYS} days. They stop working soon; the{" "}
                  <ExternalLink href={DEPRECATED_API_MIGRATION_URL}>
                    migration guide
                  </ExternalLink>{" "}
                  maps each endpoint to its replacement.
                </p>
                <div className="flex flex-col">
                  {migrationData.apiUsage.map((usage) => (
                    <div
                      key={usage.endpoint}
                      className="flex flex-wrap items-baseline justify-between gap-x-2 py-0.5"
                    >
                      <ExternalLink
                        href={DEPRECATED_API_MIGRATION_URL}
                        className="text-sm"
                      >
                        {usage.endpoint}
                      </ExternalLink>
                      <span
                        className="text-muted-foreground text-xs whitespace-nowrap"
                        title={`Last seen at ${usage.lastSeen}`}
                      >
                        {numberFormatter(usage.count, 0, 2)} calls · last seen{" "}
                        {formatCompactRelativeTime(new Date(usage.lastSeen))}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                No deprecated public API usage detected in the last{" "}
                {V4_MIGRATION_LOOKBACK_DAYS} days.
              </p>
            )}
          </Section>

          <Section
            title={tAuto("deprecated_integrations_cf5eee9")}
            chip={
              <MigrationCountChip
                state={migrationData.exports}
                affectedLabel="deprecated"
              />
            }
          >
            {migrationData.exports.status === "loading" ? (
              <p className="text-muted-foreground text-sm">
                Checking integrations…
              </p>
            ) : migrationData.exports.status === "error" ? (
              <p className="text-muted-foreground text-sm">
                We could not check integrations. Try again later.
              </p>
            ) : migrationData.legacyIntegrations.length > 0 ? (
              <>
                <p className="text-muted-foreground mb-2 text-sm">
                  These exports still read from the old data source. Switching
                  them over can change what downstream consumers receive, so
                  worth a quick check.
                </p>
                <div className="flex flex-col">
                  {migrationData.legacyIntegrations.map((name) => (
                    <div
                      key={name}
                      className="flex items-baseline gap-1.5 py-0.5"
                    >
                      {integrationsUrl ? (
                        <Link
                          href={integrationsUrl}
                          onClick={onNavigate}
                          className="text-dark-blue text-sm hover:underline"
                        >
                          {name}
                        </Link>
                      ) : (
                        <span className="text-sm">{name}</span>
                      )}
                      <span className="text-muted-foreground text-xs">·</span>
                      <ExternalLink
                        href={
                          DEPRECATED_INTEGRATION_MIGRATION_URLS[name] ??
                          V4_DOCS_URL
                        }
                        className="text-xs"
                      >
                        Migration guide
                      </ExternalLink>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                No deprecated integration exports detected.
              </p>
            )}
          </Section>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-base font-bold">
          <LifeBuoy className="h-4 w-4 shrink-0" />{" "}
          {tAuto("contact_us_4832e45")}{" "}
        </div>
        <p className="text-muted-foreground text-sm">
          Need a hand with the update? We&apos;re here to help!
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="min-w-0 flex-1">
            <a
              href="https://cal.com/team/langfuse/welcome-to-langfuse"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => capture("v4_migration:contact_book_call_clicked")}
            >
              <span
                className="min-w-0 truncate"
                title={tAuto("book_a_call_4e0f5e5")}
              >
                {tAuto("book_a_call_4e0f5e5")}{" "}
              </span>
            </a>
          </Button>
          <Button
            variant="outline"
            className="min-w-0 flex-1"
            onClick={handleEmailEngineer}
          >
            <span
              className="min-w-0 truncate"
              title={tAuto("email_an_engineer_fc4bcd6")}
            >
              {tAuto("email_an_engineer_fc4bcd6")}{" "}
            </span>
          </Button>
        </div>
      </div>
    </>
  );
}
