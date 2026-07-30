import { DatasetForm } from "@/src/features/datasets/components/DatasetForm";
import type { DatasetCreateStepProps } from "./types";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function DatasetCreateStep(props: DatasetCreateStepProps) {
  const tAuto = useAutoTranslations();
  const { projectId, formRef, onDatasetCreated, onValidationChange } = props;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-bold">
          {tAuto("create_new_dataset_a73ff6b")}
        </h3>
        <p className="text-muted-foreground text-sm">
          {tAuto("fill_in_the_details_to_create_a_new_dataset_fb1b75a")}{" "}
        </p>
      </div>

      <DatasetForm
        ref={formRef}
        projectId={projectId}
        mode="create"
        redirectOnSuccess={false}
        showFooter={false}
        onCreateDatasetSuccess={onDatasetCreated}
        onValidationChange={onValidationChange}
      />
    </div>
  );
}
