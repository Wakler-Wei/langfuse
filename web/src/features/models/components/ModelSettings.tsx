import Header from "@/src/components/layouts/header";
import ModelTable from "@/src/components/table/use-cases/models";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function ModelsSettings(props: { projectId: string }) {
  const tAuto = useAutoTranslations();
  return (
    <>
      <Header title={tAuto("model_definitions_77038cb")} />
      <p className="mb-2 text-sm">
        {tAuto(
          "a_configuration_that_stores_pricing_information_for__389bd9c",
        )}{" "}
      </p>
      <ModelTable projectId={props.projectId} />
    </>
  );
}
