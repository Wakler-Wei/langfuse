import { Database, Plus } from "lucide-react";
import type { DatasetChoiceStepProps } from "./types";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function DatasetChoiceStep(props: DatasetChoiceStepProps) {
  const tAuto = useAutoTranslations();
  const { onSelectMode } = props;

  return (
    <div className="grid grid-cols-2 gap-6 p-6">
      {/* Existing Dataset Card */}
      <button
        type="button"
        onClick={() => onSelectMode("select")}
        className="hover:border-tertiary hover:bg-accent flex flex-col items-center rounded-lg border-2 p-8 text-center transition-all"
      >
        <div className="bg-primary/10 mb-4 rounded-full p-4">
          <Database className="text-primary h-8 w-8" />
        </div>
        <h3 className="mb-2 text-lg font-bold">
          {tAuto("existing_dataset_a1ccf56")}
        </h3>
        <p className="text-muted-foreground text-sm">
          {tAuto("add_to_a_dataset_that_already_exists_e72e570")}{" "}
        </p>
      </button>

      {/* New Dataset Card */}
      <button
        type="button"
        onClick={() => onSelectMode("create")}
        className="hover:border-tertiary hover:bg-accent flex flex-col items-center rounded-lg border-2 p-8 text-center transition-all"
      >
        <div className="bg-primary/10 mb-4 rounded-full p-4">
          <Plus className="text-primary h-8 w-8" />
        </div>
        <h3 className="mb-2 text-lg font-bold">
          {tAuto("new_dataset_e1abdfb")}
        </h3>
        <p className="text-muted-foreground text-sm">
          {tAuto("create_a_new_dataset_for_these_observations_e8878d8")}{" "}
        </p>
      </button>
    </div>
  );
}
