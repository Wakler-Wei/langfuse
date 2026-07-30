import { Input } from "@/src/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { type UseFormReturn } from "react-hook-form";
import { type ActionDomain } from "@langfuse/shared";
import { api } from "@/src/utils/api";
import { SlackConnectionCard } from "@/src/features/slack/components/SlackConnectionCard";
import {
  ChannelSelector,
  type SlackChannel,
} from "@/src/features/slack/components/ChannelSelector";
import { SlackTestMessageButton } from "@/src/features/slack/components/SlackTestMessageButton";
import { useState } from "react";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

interface SlackActionFormProps {
  form: UseFormReturn<any>;
  disabled: boolean;
  projectId: string;
  action?: ActionDomain;
}

export const SlackActionForm: React.FC<SlackActionFormProps> = ({
  form,
  disabled,
  projectId,
}) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const initialChannelId = form.getValues("slack.channelId") as string;
  const initialChannelName = form.getValues("slack.channelName") as string;
  const [selectedChannel, setSelectedChannel] = useState<SlackChannel | null>(
    initialChannelId && initialChannelName
      ? { id: initialChannelId, name: initialChannelName }
      : null,
  );

  // Get Slack integration status
  const { data: integrationStatus } = api.slack.getIntegrationStatus.useQuery(
    { projectId },
    { enabled: !!projectId },
  );

  // Check user permissions
  const hasAccess = useHasProjectAccess({
    projectId,
    scope: "automations:CUD",
  });

  // Handle channel selection
  const handleChannelSelect = (channel: SlackChannel) => {
    form.setValue("slack.channelId", channel.id);
    form.setValue("slack.channelName", channel.name);
    setSelectedChannel(channel);
  };

  // Handle connection status change
  const handleConnectionChange = (connected: boolean) => {
    if (!connected) {
      // Clear channel selection when disconnected
      form.setValue("slack.channelId", "");
      form.setValue("slack.channelName", "");
      setSelectedChannel(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Slack Connection Card */}
      <SlackConnectionCard
        projectId={projectId}
        disabled={disabled}
        onConnectionChange={handleConnectionChange}
        showConnectButton={true}
      />

      {/* Channel Selection - Only show when connected */}
      {integrationStatus?.isConnected && (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="slack.channelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tAuto("channel_879f0b1")}</FormLabel>
                <FormControl>
                  <div className="max-w-md">
                    <ChannelSelector
                      projectId={projectId}
                      selectedChannelId={field.value}
                      selectedChannel={selectedChannel}
                      onChannelSelect={handleChannelSelect}
                      disabled={disabled}
                      placeholder={tAuto("select_a_channel_0e2b8f4")}
                      showRefreshButton={true}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  {tAutoI18n(
                    "select_the_slack_channel_where_notifications_will_be_ba8b2eb",
                  )}{" "}
                  <code className="bg-muted rounded px-1 py-0.5">
                    /invite @Langfuse
                  </code>{" "}
                  {tAutoI18n("in_that_channel_127a727")}{" "}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Hidden field for channel name */}
          <FormField
            control={form.control}
            name="slack.channelName"
            render={({ field }) => <Input type="hidden" {...field} />}
          />

          {/* Test Message Button - Only show when a channel is selected */}
          {selectedChannel && (
            <div className="flex items-center gap-3 pt-2">
              <SlackTestMessageButton
                projectId={projectId}
                selectedChannel={selectedChannel}
                hasAccess={hasAccess}
                disabled={disabled}
                size="sm"
                buttonText={tAuto("test_channel_887c8d8")}
                onSuccess={(channelInfo) => {
                  form.setValue("slack.channelId", channelInfo.id);
                  form.setValue(
                    "slack.channelName",
                    channelInfo.name ?? selectedChannel?.name ?? "",
                  );
                  setSelectedChannel((prev) =>
                    prev
                      ? {
                          ...prev,
                          id: channelInfo.id,
                          name: channelInfo.name ?? prev.name,
                          isPrivate: channelInfo.isPrivate ?? prev.isPrivate,
                        }
                      : prev,
                  );
                }}
              />
              <p className="text-muted-foreground text-sm">
                {tAuto(
                  "test_this_channel_to_verify_the_bot_can_send_message_4d99a64",
                )}{" "}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
