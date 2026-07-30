import { env } from "@/src/env.mjs";
import { useTranslations } from "next-intl";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function CloudPrivacyNotice({
  action,
}: {
  action: "signIn" | "signUp";
}) {
  const tAuto = useAutoTranslations();
  const t = useTranslations("Auth");

  return env.NEXT_PUBLIC_LANGFUSE_CLOUD_REGION !== undefined ? (
    <div className="text-muted-foreground mx-auto mt-10 max-w-lg text-center text-xs">
      {action === "signIn" ? t("privacySignIn") : t("privacySignUp")}{" "}
      <a
        href="https://clickhouse.com/legal/clickhouse-general-terms-and-conditions"
        target="_blank"
        rel="noopener noreferrer"
        className="italic"
      >
        {tAuto("clickhouse_general_terms_and_conditions_d6ed967")}{" "}
      </a>
      ,{" "}
      <a
        href="https://clickhouse.com/legal/langfuse-cloud-addendum"
        target="_blank"
        rel="noopener noreferrer"
        className="italic"
      >
        {tAuto("langfuse_cloud_addendum_780960e")}{" "}
      </a>
      , {t("privacyAnd")}{" "}
      <a
        href="https://langfuse.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="italic"
      >
        {tAuto("langfuse_privacy_policy_375d303")}{" "}
      </a>
      . {t("privacyConfirmation")}
    </div>
  ) : null;
}
