import Link from "next/link";
import { ChevronRight, Github, Plus, Slack, Webhook } from "lucide-react";

import { ActionButton } from "@/src/components/ActionButton";
import { Button } from "@/src/components/ui/button";
import { SplashScreen } from "@/src/components/ui/splash-screen";
import { automationCreateHref } from "@/src/features/automations/components/automationForm";
import { type ActionTypes } from "@langfuse/shared";
import { I18nText, useAutoTranslations } from "@/src/features/i18n/I18nText";

/** OnboardingChannel describes one notification-channel CTA shown in step 1 of the splash. */
type OnboardingChannel = {
  actionType: ActionTypes;
  label: React.ReactNode;
  icon: React.ReactNode;
};

/** channels enumerates the three notification channels presented to a first-time user. */
const channels: OnboardingChannel[] = [
  {
    actionType: "SLACK",
    label: <I18nText id="connect_slack_cc7f4b6" />,
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- brand icon retained for parity with MonitorAutomationsPanel.
    icon: <Slack className="h-4 w-4" aria-hidden="true" />,
  },
  {
    actionType: "WEBHOOK",
    label: <I18nText id="connect_webhooks_0baefce" />,
    icon: <Webhook className="h-4 w-4" aria-hidden="true" />,
  },
  {
    actionType: "GITHUB_DISPATCH",
    label: <I18nText id="connect_github_actions_3ef2ad5" />,
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- see Slack note above.
    icon: <Github className="h-4 w-4" aria-hidden="true" />,
  },
];

/** MonitorsOnboarding renders the splash shown on /monitors when the project has no monitors yet. */
export function MonitorsOnboarding({
  projectId,
  hasCUDAccess,
}: {
  projectId: string;
  hasCUDAccess: boolean;
}) {
  const tAuto = useAutoTranslations();
  return (
    <div className="mx-auto w-full max-w-xl pt-12">
      <SplashScreen
        title={tAuto("catch_issues_before_they_impact_your_users_42e04ed")}
        description={tAuto(
          "get_notified_when_cost_quality_latency_or_other_key__5aa3fcc",
        )}
        steps={[
          {
            title: tAuto("choose_where_alerts_should_go_ff782fd"),
            description: tAuto(
              "send_alerts_to_slack_webhooks_or_github_actions_so_y_1118017",
            ),
            content: (
              <div className="flex flex-col gap-2">
                {channels.map((channel) => (
                  <Button
                    key={channel.actionType}
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full justify-between gap-2 px-6 py-5"
                  >
                    <Link
                      href={automationCreateHref(
                        projectId,
                        channel.actionType,
                        `/project/${projectId}/monitors`,
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {channel.icon}
                        {channel.label}
                      </span>
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                ))}
              </div>
            ),
          },
          {
            title: tAuto("decide_what_to_monitor_55cb784"),
            description: tAuto(
              "create_monitors_for_sudden_cost_spikes_quality_drops_023e8c6",
            ),
            content: (
              <ActionButton
                hasAccess={hasCUDAccess}
                icon={<Plus className="h-4 w-4" aria-hidden="true" />}
                href={`/project/${projectId}/monitors/new`}
                variant="default"
                size="lg"
              >
                {tAuto("create_monitor_9b65cfd")}{" "}
              </ActionButton>
            ),
          },
        ]}
      />
    </div>
  );
}
