import { useState } from "react";
import { useRouter } from "next/router";
import { api } from "@/src/utils/api";
import Header from "@/src/components/layouts/header";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function PersonalNotificationSettings() {
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const [isSaving, setIsSaving] = useState(false);

  const hasAccess = useHasProjectAccess({
    projectId,
    scope: "project:read",
  });

  const {
    data: preferences,
    isLoading,
    refetch,
  } = api.notificationPreferences.getForProject.useQuery(
    { projectId },
    { enabled: Boolean(projectId) },
  );

  const updatePreference = api.notificationPreferences.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleToggle = async (enabled: boolean) => {
    setIsSaving(true);
    await updatePreference.mutateAsync({
      projectId,
      channel: "EMAIL",
      type: "COMMENT_MENTION",
      enabled,
    });
    setIsSaving(false);
  };

  if (isLoading || !preferences) {
    return (
      <div>
        <Header title={tAuto("personal_notifications_06b86de")} />
        <p className="text-muted-foreground mt-4 text-sm">
          {tAuto("loading_preferences_dc2fb44")}{" "}
        </p>
      </div>
    );
  }

  const emailCommentMention = preferences.find(
    (p) => p.channel === "EMAIL" && p.type === "COMMENT_MENTION",
  );

  return (
    <div>
      <Header title={tAuto("personal_notifications_06b86de")} />
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-bold">
            {tAuto("email_notifications_1281130")}
          </h3>
          <p className="text-muted-foreground text-sm">
            {tAuto(
              "manage_your_personal_email_notification_preferences__6283b5f",
            )}{" "}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="comment-mention" className="text-base">
              {tAuto("comment_mentions_dec12bf")}{" "}
            </Label>
            <p className="text-muted-foreground text-sm">
              {tAuto(
                "receive_an_email_when_someone_mentions_you_in_a_comm_5961ce9",
              )}{" "}
            </p>
          </div>
          <Switch
            id="comment-mention"
            checked={emailCommentMention?.enabled ?? true}
            onCheckedChange={handleToggle}
            disabled={isSaving || !hasAccess}
          />
        </div>
      </div>

      {updatePreference.isError && (
        <div className="border-destructive bg-destructive/10 mt-4 rounded-lg border p-4">
          <p className="text-destructive text-sm">
            {tAuto(
              "failed_to_update_notification_preference_please_try__53cdf29",
            )}{" "}
          </p>
        </div>
      )}
    </div>
  );
}
