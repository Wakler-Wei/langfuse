import { Card } from "@/src/components/ui/card";
import { CodeView } from "@/src/components/ui/CodeJsonViewer";
import Header from "@/src/components/layouts/header";
import { useUiCustomization } from "@/src/ee/features/ui-customization/useUiCustomization";
import { env } from "@/src/env.mjs";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function HostNameProject() {
  const tAuto = useAutoTranslations();
  const uiCustomization = useUiCustomization();
  return (
    <div>
      <Header title={tAuto("host_name_11e8539")} />
      <Card className="mb-4 p-3">
        <div className="">
          <div className="mb-2 text-sm">
            {tAuto(
              "when_connecting_to_langfuse_use_this_hostname_baseur_1465920",
            )}{" "}
          </div>
          <CodeView
            content={`${uiCustomization?.hostname ?? window.origin}${env.NEXT_PUBLIC_BASE_PATH ?? ""}`}
          />
        </div>
      </Card>
    </div>
  );
}
