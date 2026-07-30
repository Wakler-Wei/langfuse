import type { DatasetItemDomain } from "@langfuse/shared";
import {
  stringifyDatasetItemData,
  type DatasetSchema,
} from "../utils/datasetItemUtils";
import { DatasetItemFields } from "@/src/features/datasets/components/DatasetItemFields";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type DatasetItemViewModeContentProps = {
  item: DatasetItemDomain | null;
  isLoading: boolean;
  dataset: DatasetSchema | null;
};

/**
 * Renders the latest version of a dataset item in view mode.
 * Handles loading and not-found states.
 */
export const DatasetItemViewModeContent = ({
  item,
  isLoading,
  dataset,
}: DatasetItemViewModeContentProps) => {
  const tAuto = useAutoTranslations();
  if (isLoading) {
    return (
      <div className="text-muted-foreground text-sm">
        {tAuto("loading_b04ba49")}
      </div>
    );
  }

  if (item === null) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="text-muted-foreground">
          <p className="text-lg font-bold">
            {tAuto("dataset_item_not_found_48533f3")}
          </p>
          <p className="mt-2 text-sm">
            {tAuto(
              "this_dataset_item_does_not_exist_or_has_been_deleted_c2be705",
            )}{" "}
          </p>
        </div>
      </div>
    );
  }

  return (
    <DatasetItemFields
      values={{
        input: stringifyDatasetItemData(item.input),
        expectedOutput: stringifyDatasetItemData(item.expectedOutput),
        metadata: stringifyDatasetItemData(item.metadata),
      }}
      dataset={dataset}
      editable={false}
      projectId={item.projectId}
      datasetItemId={item.id}
    />
  );
};
