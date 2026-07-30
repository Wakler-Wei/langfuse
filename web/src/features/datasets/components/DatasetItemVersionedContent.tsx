import { DatasetItemDiffView } from "./DatasetItemDiffView";
import type { DatasetItemDomain } from "@langfuse/shared";
import {
  stringifyDatasetItemData,
  type DatasetSchema,
} from "../utils/datasetItemUtils";
import { DatasetItemFields } from "@/src/features/datasets/components/DatasetItemFields";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type DatasetItemVersionedContentProps = {
  itemAtVersion: DatasetItemDomain | null;
  latestItem: DatasetItemDomain | null;
  isLoadingVersioned: boolean;
  isLoadingLatest: boolean;
  showDiffMode: boolean;
  itemChangedAtVersion: boolean;
  dataset: DatasetSchema | null;
};

/**
 * Renders a dataset item at a specific historical version.
 * Supports diff view comparison with the latest version.
 * Handles loading states and cases where item doesn't exist at that version.
 */
export const DatasetItemVersionedContent = ({
  itemAtVersion,
  latestItem,
  isLoadingVersioned,
  isLoadingLatest,
  showDiffMode,
  itemChangedAtVersion,
  dataset,
}: DatasetItemVersionedContentProps) => {
  const tAuto = useAutoTranslations();
  // Loading states
  if (isLoadingVersioned) {
    return (
      <div className="text-muted-foreground text-sm">
        {tAuto("loading_b04ba49")}
      </div>
    );
  }

  // Item doesn't exist at this version
  if (itemAtVersion === null) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="text-muted-foreground">
          <p className="text-lg font-bold">
            {tAuto("item_does_not_exist_at_this_version_a5698e3")}{" "}
          </p>
          <p className="mt-2 text-sm">
            {tAuto(
              "this_dataset_item_either_had_not_been_created_yet_or_833a7c8",
            )}{" "}
          </p>
        </div>
      </div>
    );
  }

  // Show diff mode if enabled and item changed at this version
  if (showDiffMode && itemChangedAtVersion) {
    if (isLoadingLatest) {
      return (
        <div className="text-muted-foreground text-sm">
          {tAuto("loading_b04ba49")}
        </div>
      );
    }

    // Can't show diff if latest doesn't exist
    if (latestItem === null) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="text-muted-foreground">
            <p className="text-lg font-bold">
              {tAuto("cannot_show_diff_9b76088")}
            </p>
            <p className="mt-2 text-sm">
              {tAuto(
                "the_latest_version_of_this_item_does_not_exist_has_b_aa00e9a",
              )}{" "}
            </p>
          </div>
        </div>
      );
    }

    return (
      <DatasetItemDiffView
        selectedVersion={itemAtVersion}
        latestVersion={latestItem}
      />
    );
  }

  // Show normal view of selected version
  return (
    <DatasetItemFields
      values={{
        input: stringifyDatasetItemData(itemAtVersion.input),
        expectedOutput: stringifyDatasetItemData(itemAtVersion.expectedOutput),
        metadata: stringifyDatasetItemData(itemAtVersion.metadata),
      }}
      dataset={dataset}
      editable={false}
      projectId={itemAtVersion.projectId}
      datasetItemId={itemAtVersion.id}
      datasetItemValidFrom={itemAtVersion.validFrom}
    />
  );
};
