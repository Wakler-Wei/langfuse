import React from "react";
import { CodeView } from "@/src/components/ui/CodeJsonViewer";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const WebhookSecretRender = ({
  webhookSecret,
}: {
  webhookSecret: string;
}) => {
  const tAuto = useAutoTranslations();
  return (
    <>
      <div className="mb-4">
        <div className="font-bold">{tAuto("webhook_secret_095d92f")}</div>
        <div className="my-2 text-sm">
          {tAuto(
            "this_secret_can_only_be_viewed_once_you_can_regenera_a24ab17",
          )}{" "}
        </div>
        <CodeView content={webhookSecret} defaultCollapsed={false} />
      </div>
    </>
  );
};
