import React from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { api } from "@/src/utils/api";
import { SlackConnectButton } from "@/src/features/slack/components/SlackConnectButton";
import { SlackDisconnectButton } from "@/src/features/slack/components/SlackDisconnectButton";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

/**
 * Props for the SlackConnectionCard component
 */
interface SlackConnectionCardProps {
  /** Project ID for the Slack integration */
  projectId: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Optional callback when connection status changes */
  onConnectionChange?: (connected: boolean) => void;
  /** Whether to show the connect button in the card */
  showConnectButton?: boolean;
}

/**
 * A reusable card component that displays Slack connection status and management controls.
 *
 * This component handles:
 * - Displaying current connection status
 * - Showing team information when connected
 * - Providing connection and disconnection actions
 * - Handling error states with appropriate messaging
 *
 * The component automatically fetches the integration status and updates when the connection changes.
 *
 * @param projectId - The project ID for the Slack integration
 * @param disabled - Whether the component should be disabled
 * @param onConnectionChange - Optional callback when connection status changes
 * @param showConnectButton - Whether to show the connect button in the card (default: true)
 */
export const SlackConnectionCard: React.FC<SlackConnectionCardProps> = ({
  projectId,
  disabled = false,
  onConnectionChange,
  showConnectButton = true,
}) => {
  const tAuto = useAutoTranslations();
  // Get Slack integration status
  const {
    data: integrationStatus,
    isLoading,
    refetch: refetchStatus,
    error: statusError,
  } = api.slack.getIntegrationStatus.useQuery(
    { projectId },
    {
      enabled: !!projectId,
      // Refetch every 30 seconds to keep status up to date
      refetchInterval: 30000,
    },
  );

  // Handle connection status change
  const handleConnectionChange = (connected: boolean) => {
    refetchStatus();
    onConnectionChange?.(connected);
  };

  // Handle loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {tAuto("slack_connection_f4fb414")}{" "}
          </CardTitle>
          <CardDescription>
            {tAuto("checking_connection_status_8562917")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>{tAuto("loading_b04ba49")}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (statusError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {tAuto("slack_connection_f4fb414")}{" "}
          </CardTitle>
          <CardDescription>
            {tAuto("error_loading_connection_status_75660e3")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {tAuto(
                "failed_to_load_slack_integration_status_please_try_a_363f434",
              )}{" "}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Handle not connected state
  if (!integrationStatus?.isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {tAuto("slack_connection_f4fb414")}{" "}
          </CardTitle>
          <CardDescription>
            {tAuto(
              "connect_your_slack_workspace_to_send_notifications_5521c16",
            )}{" "}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrationStatus?.error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{integrationStatus.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              {tAuto(
                "connect_your_slack_workspace_to_enable_real_time_not_2ab965a",
              )}{" "}
            </p>

            {showConnectButton && (
              <SlackConnectButton
                projectId={projectId}
                disabled={disabled}
                onSuccess={() => handleConnectionChange(true)}
                onError={(error: Error) => {
                  console.error("Slack connection error:", error);
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle connected state
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {tAuto("slack_connection_f4fb414")}{" "}
        </CardTitle>
        <CardDescription>
          {tAuto("connected_to_your_slack_workspace_5e7d0c6")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm font-bold">
            {tAuto("connected_c2f9b7b")}
          </span>
        </div>

        {/* Team Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">
              {tAuto("workspace_92b51a9")}
            </span>
            <Badge variant="secondary" className="text-xs">
              {integrationStatus.teamName}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">
              {tAuto("team_id_20647fb")}
            </span>
            <Badge variant="outline" className="font-mono text-xs">
              {integrationStatus.teamId}
            </Badge>
          </div>

          {integrationStatus.botUserId && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">
                {tAuto("bot_user_4ecb6c0")}
              </span>
              <Badge variant="outline" className="font-mono text-xs">
                {integrationStatus.botUserId}
              </Badge>
            </div>
          )}
        </div>

        {/* Management Actions */}
        <div className="flex gap-2 pt-2">
          <SlackDisconnectButton
            projectId={projectId}
            disabled={disabled}
            onSuccess={() => handleConnectionChange(false)}
            onError={(error: Error) => {
              console.error("Slack disconnection error:", error);
            }}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchStatus()}
            disabled={disabled}
          >
            {tAuto("refresh_status_28a0e95")}{" "}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
