import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/src/components/ui/alert";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const SupportOrUpgradePage = () => {
  const tAuto = useAutoTranslations();
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{tAuto("access_restricted_13a4143")}</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              {tAuto("this_feature_requires_additional_permissions_648130b")}
            </p>
            <p>
              {tAuto(
                "contact_your_system_project_administrator_for_access_27f3f89",
              )}{" "}
            </p>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};
