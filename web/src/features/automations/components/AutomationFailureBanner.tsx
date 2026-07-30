import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { api } from "@/src/utils/api";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

interface AutomationFailureBannerProps {
  projectId: string;
  automationId: string;
}

export const AutomationFailureBanner: React.FC<
  AutomationFailureBannerProps
> = ({ projectId, automationId }) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const [dismissed, setDismissed] = React.useState(false);

  const { data: failureData } =
    api.automations.getCountOfConsecutiveFailures.useQuery({
      projectId,
      automationId,
    });

  if (dismissed || !failureData || failureData.count < 5) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <strong>
            {tAutoI18n(
              "this_automation_was_automatically_disabled_due_to_at_2c86080",
            )}{" "}
            {failureData.count}{" "}
            {tAutoI18n("consecutive_webhook_failures_4b75902")}{" "}
          </strong>
          <div className="mt-2 text-sm">
            {tAuto(
              "check_the_execution_history_below_fix_any_issues_wit_121c2ae",
            )}{" "}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
          className="ml-4 h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};
