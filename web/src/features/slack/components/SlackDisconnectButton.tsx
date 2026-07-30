import React, { useState } from "react";
import { Unlink, AlertTriangle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { api } from "@/src/utils/api";
import Spinner from "@/src/components/design-system/Spinner/Spinner";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

/**
 * Props for the SlackDisconnectButton component
 */
interface SlackDisconnectButtonProps {
  /** Project ID for the Slack integration */
  projectId: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Button variant */
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "destructive"
    | "ghost"
    | "link";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Custom button text */
  buttonText?: string;
  /** Callback when disconnection is successful */
  onSuccess?: () => void;
  /** Callback when disconnection fails */
  onError?: (error: Error) => void;
  /** Whether to show confirmation dialog */
  showConfirmation?: boolean;
  /** Whether to show the button text */
  showText?: boolean;
}

/**
 * A button component that handles disconnecting the Slack integration.
 *
 * This component handles:
 * - Showing a confirmation dialog before disconnecting
 * - Calling the disconnect API endpoint
 * - Providing loading states during the disconnection process
 * - Displaying appropriate success/error messages
 * - Calling success/error callbacks
 *
 * The component includes safety measures to prevent accidental disconnection:
 * - Confirmation dialog with clear warning about consequences
 * - Information about what happens when disconnecting
 * - Option to cancel the operation
 *
 * @param projectId - The project ID for the Slack integration
 * @param disabled - Whether the button should be disabled
 * @param variant - Button variant (default: "destructive")
 * @param size - Button size (default: "sm")
 * @param buttonText - Custom button text (default: "Disconnect")
 * @param onSuccess - Callback when disconnection is successful
 * @param onError - Callback when disconnection fails
 * @param showConfirmation - Whether to show confirmation dialog (default: true)
 * @param showText - Whether to show the button text (default: true)
 */
export const SlackDisconnectButton: React.FC<SlackDisconnectButtonProps> = ({
  projectId,
  disabled = false,
  variant = "destructive",
  size = "sm",
  buttonText = "Disconnect",
  onSuccess,
  onError,
  showConfirmation = true,
  showText = true,
}) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Disconnect mutation
  const disconnectMutation = api.slack.disconnect.useMutation({
    onSuccess: () => {
      setIsDisconnecting(false);
      setIsDialogOpen(false);

      showSuccessToast({
        title: tAuto("slack_disconnected_047d906"),
        description: tAuto(
          "successfully_disconnected_from_your_slack_workspace_7d4762e",
        ),
      });

      onSuccess?.();
    },
    onError: (error: any) => {
      setIsDisconnecting(false);

      const errorMessage = error.message || "Failed to disconnect from Slack";

      showErrorToast(tAutoI18n("disconnection_failed_6cd18ea"), errorMessage);

      onError?.(new Error(errorMessage));
    },
  });

  // Handle disconnect action
  const handleDisconnect = async () => {
    if (isDisconnecting) return;

    setIsDisconnecting(true);

    try {
      await disconnectMutation.mutateAsync({ projectId });
    } catch (error) {
      // Error handling is done in the mutation callbacks
      console.error("Disconnect error:", error);
    }
  };

  // Handle button click
  const handleClick = () => {
    if (showConfirmation) {
      setIsDialogOpen(true);
    } else {
      handleDisconnect();
    }
  };

  const buttonContent = (
    <>
      {isDisconnecting ? (
        <div className={showText ? "mr-2" : ""}>
          <Spinner size="sm" />
        </div>
      ) : (
        <Unlink className={showText ? "mr-2 h-4 w-4" : "h-4 w-4"} />
      )}
      {showText && (isDisconnecting ? "Disconnecting..." : buttonText)}
    </>
  );

  if (showConfirmation) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            disabled={disabled || isDisconnecting}
          >
            {buttonContent}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive h-5 w-5" />
              {tAuto("disconnect_slack_integration_1da24e7")}{" "}
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                {tAuto(
                  "are_you_sure_you_want_to_disconnect_your_slack_works_ed8ce78",
                )}{" "}
              </p>
              <div className="bg-muted space-y-2 rounded-md p-3">
                <p className="text-sm font-bold">
                  {tAuto("this_will_a291220")}
                </p>
                <ul className="ml-4 space-y-1 text-sm">
                  <li>
                    {tAuto("remove_the_bot_from_your_slack_workspace_6f3c3ea")}
                  </li>
                  <li>
                    {tAuto("disable_all_existing_slack_automations_84e7012")}
                  </li>
                  <li>
                    {tAuto("stop_all_future_slack_notifications_befe7e3")}
                  </li>
                  <li>
                    {tAuto("delete_stored_workspace_credentials_d9e24ec")}
                  </li>
                </ul>
              </div>
              <p className="text-muted-foreground text-sm">
                You can reconnect at any time, but you&apos;ll need to
                reconfigure your automations.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isDisconnecting}
            >
              {tAuto("cancel_77dfd21")}{" "}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <>
                  <div className="mr-2">
                    <Spinner size="sm" />
                  </div>
                  {tAuto("disconnecting_257ea73")}{" "}
                </>
              ) : (
                <>
                  <Unlink className="mr-2 h-4 w-4" />
                  {tAuto("disconnect_ed28e06")}{" "}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || isDisconnecting}
    >
      {buttonContent}
    </Button>
  );
};
