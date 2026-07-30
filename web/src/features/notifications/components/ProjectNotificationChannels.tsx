import Header from "@/src/components/layouts/header";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import { AutomationForm } from "@/src/features/automations/components/automationForm";
import { WebhookSecretRender } from "@/src/features/automations/components/WebhookSecretRender";
import { ProjectNotificationChannelsList } from "@/src/features/notifications/components/ProjectNotificationChannelsList";
import { useProjectNotificationChannels } from "@/src/features/notifications/hooks/useProjectNotificationChannels";
import { cn } from "@/src/utils/tailwind";
import {
  TriggerEventSource,
  type ActionTypes,
  type ProjectNotificationEventType,
} from "@langfuse/shared";
import { I18nText, useAutoTranslations } from "@/src/features/i18n/I18nText";

/** Project notifications route to webhooks or Slack; GitHub dispatch is not wired for this event source. */
const PROJECT_NOTIFICATION_ACTION_TYPES: ActionTypes[] = ["WEBHOOK", "SLACK"];

/** NOTIFIED_EVENTS lists the toggleable project-notification events, keyed by their eventType. */
const NOTIFIED_EVENTS: {
  value: ProjectNotificationEventType;
  title: React.ReactNode;
  description: React.ReactNode;
}[] = [
  {
    value: "blob-export-failed",
    title: <I18nText id="blob_storage_export_failed_042d4aa" />,
    description: (
      <I18nText id="sent_when_a_scheduled_blob_storage_export_fails_e00dae6" />
    ),
  },
  {
    value: "evaluator-blocked",
    title: <I18nText id="evaluator_deactivated_a14e49a" />,
    description: (
      <I18nText id="sent_when_an_evaluator_is_deactivated_due_to_an_unre_0e40314" />
    ),
  },
];

/**
 * ProjectNotificationChannels is the admin-only "Project Notifications"
 * settings section. It lists configured channels and delegates create/edit to
 * the shared <AutomationForm> scoped to the project-notification event source.
 */
export function ProjectNotificationChannels({
  projectId,
}: {
  projectId: string;
}) {
  const tAuto = useAutoTranslations();
  const {
    hasAccess,
    channels,
    isLoading,
    mode,
    editingChannel,
    webhookSecret,
    isDeleting,
    isTogglingEvent,
    isEventEnabled,
    actions,
  } = useProjectNotificationChannels(projectId);

  const hasChannels = Boolean(channels?.length);

  if (!hasAccess) return null;

  return (
    <div>
      <Header title={tAuto("project_notifications_93d8c5d")} />
      <p className="text-muted-foreground mb-4 text-sm">
        {tAuto(
          "manage_project_notifications_channel_notifications_a_0e340fb",
        )}{" "}
      </p>

      {mode === "list" ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <ProjectNotificationChannelsList
              channels={channels}
              isLoading={isLoading}
              isDeleting={isDeleting}
              onAdd={actions.openCreate}
              onEdit={actions.openEdit}
              onDelete={actions.deleteChannel}
            />
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-bold">{tAuto("events_c5497bc")}</h3>
              <p className="text-muted-foreground text-sm">
                {hasChannels
                  ? tAuto(
                      "choose_which_events_are_delivered_to_your_channels_6c44471",
                    )
                  : tAuto(
                      "configure_a_channel_above_to_enable_project_notifica_b9e8a80",
                    )}
              </p>
            </div>
            {NOTIFIED_EVENTS.map((event) => (
              <div
                key={event.value}
                className="flex items-center justify-between gap-4 rounded-lg border p-4"
              >
                <div
                  className={cn(
                    "flex flex-col gap-0.5",
                    !hasChannels && "opacity-50",
                  )}
                >
                  <p className="text-base font-bold">{event.title}</p>
                  <p className="text-muted-foreground text-sm">
                    {event.description}
                  </p>
                </div>
                <Switch
                  checked={isEventEnabled(event.value)}
                  onCheckedChange={(checked) =>
                    actions.setEventEnabled(event.value, checked)
                  }
                  disabled={!hasChannels || isTogglingEvent}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <AutomationForm
          key={editingChannel?.id ?? "create"}
          projectId={projectId}
          isEditing
          lockedEventSource={TriggerEventSource.ProjectNotification}
          allowedActionTypes={PROJECT_NOTIFICATION_ACTION_TYPES}
          automation={editingChannel ?? undefined}
          onSuccess={actions.onFormSuccess}
          onCancel={actions.closeForm}
        />
      )}

      {/* One-time webhook secret reveal after creating a webhook channel. */}
      <Dialog
        open={Boolean(webhookSecret)}
        onOpenChange={(open) => {
          if (!open) actions.dismissWebhookSecret();
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{tAuto("webhook_secret_created_d8363b1")}</DialogTitle>
            <DialogDescription>
              {tAuto(
                "copy_the_webhook_secret_below_it_will_only_be_shown__852a177",
              )}{" "}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {webhookSecret && (
              <WebhookSecretRender webhookSecret={webhookSecret} />
            )}
          </DialogBody>
          <DialogFooter>
            <Button onClick={actions.dismissWebhookSecret}>
              {"I've saved the secret"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
