import { env } from "@/src/env.mjs";
import { useTranslations } from "next-intl";

export function CloudPrivacyNotice({
  action,
}: {
  action: "signIn" | "signUp";
}) {
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
        ClickHouse General Terms and Conditions
      </a>
      ,{" "}
      <a
        href="https://clickhouse.com/legal/langfuse-cloud-addendum"
        target="_blank"
        rel="noopener noreferrer"
        className="italic"
      >
        Langfuse Cloud Addendum
      </a>
      , {t("privacyAnd")}{" "}
      <a
        href="https://langfuse.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="italic"
      >
        Langfuse Privacy Policy
      </a>
      . {t("privacyConfirmation")}
    </div>
  ) : null;
}
