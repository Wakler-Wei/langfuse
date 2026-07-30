import React from "react";
import { SplashScreen } from "@/src/components/ui/splash-screen";
import { ActionButton } from "@/src/components/ActionButton";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function UsersOnboarding() {
  const tAuto = useAutoTranslations();
  return (
    <SplashScreen
      title={tAuto("you_aren_t_tracking_users_yet_1d8af2e")}
      description={tAuto(
        "once_you_add_a_user_id_to_your_traces_you_can_correl_756121f",
      )}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/users-overview-v1.mp4"
    >
      <div className="mt-8">
        <h3 className="mb-4 text-2xl font-bold">
          {tAuto("start_tracking_users_11e459a")}
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          {tAuto("to_start_tracking_users_you_need_to_add_a_d4f3ed5")}{" "}
          <code>userId</code> {tAuto("to_your_traces_aeb6f1a")}{" "}
        </p>
        <ActionButton
          href="https://langfuse.com/docs/observability/features/users"
          variant="default"
        >
          {tAuto("read_the_docs_d4a74b5")}{" "}
        </ActionButton>
      </div>
    </SplashScreen>
  );
}
