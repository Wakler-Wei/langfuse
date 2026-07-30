import React from "react";
import { SplashScreen } from "@/src/components/ui/splash-screen";
import { ActionButton } from "@/src/components/ActionButton";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function SessionsOnboarding() {
  const tAuto = useAutoTranslations();
  return (
    <SplashScreen
      title={tAuto("you_aren_t_using_sessions_yet_9c92a68")}
      description={tAuto(
        "sessions_let_you_group_traces_that_belong_to_the_sam_3028568",
      )}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/sessions-overview-v1.mp4"
    >
      <div className="mt-8">
        <h3 className="mb-4 text-2xl font-bold">
          {tAuto("start_using_sessions_e64c596")}
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          {tAuto("to_start_using_sessions_you_need_to_add_a_4ffb4e9")}{" "}
          <code>sessionId</code> {tAuto("to_your_traces_aeb6f1a")}{" "}
        </p>
        <ActionButton
          href="https://langfuse.com/docs/observability/features/sessions"
          variant="default"
        >
          {tAuto("read_the_docs_d4a74b5")}{" "}
        </ActionButton>
      </div>
    </SplashScreen>
  );
}
