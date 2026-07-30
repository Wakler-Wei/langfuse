import { AlertCircle, Settings } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

interface NoModelConfiguredAlertProps {
  projectId: string;
}

export function NoModelConfiguredAlert({
  projectId,
}: NoModelConfiguredAlertProps) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  return (
    <div className="p-4">
      <Alert
        variant="default"
        className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20"
      >
        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
        <AlertTitle className="text-yellow-800 dark:text-yellow-400">
          {tAuto("no_model_configured_c16c2a4")}{" "}
        </AlertTitle>
        <AlertDescription className="text-yellow-700 dark:text-yellow-500">
          {tAutoI18n(
            "to_use_the_playground_you_need_to_configure_a_model__3f80c29",
          )}{" "}
          <Link
            href={`/project/${projectId}/settings/llm-connections`}
            className="font-bold underline underline-offset-4 hover:text-yellow-900 dark:hover:text-yellow-300"
          >
            <Settings className="inline h-3 w-3" />{" "}
            {tAuto("llm_connection_settings_db66c20")}{" "}
          </Link>{" "}
          {tAutoI18n(
            "to_add_an_llm_api_key_and_configure_your_models_46e6b37",
          )}{" "}
        </AlertDescription>
      </Alert>
    </div>
  );
}
