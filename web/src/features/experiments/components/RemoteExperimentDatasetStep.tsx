import { useState } from "react";
import { CheckIcon, ChevronDown } from "lucide-react";

import Spinner from "@/src/components/design-system/Spinner/Spinner";
import { Button } from "@/src/components/ui/button";
import {
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  InputCommand,
  InputCommandEmpty,
  InputCommandGroup,
  InputCommandInput,
  InputCommandItem,
  InputCommandList,
} from "@/src/components/ui/input-command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/utils/tailwind";
import { api } from "@/src/utils/api";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type DatasetOption = {
  id: string;
  name: string;
};

export const RemoteExperimentDatasetStep = ({
  projectId,
  initialDatasetId,
  onBack,
  onContinue,
}: {
  projectId: string;
  initialDatasetId?: string;
  onBack: () => void;
  onContinue: (dataset: DatasetOption) => void;
}) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const [datasetPopoverOpen, setDatasetPopoverOpen] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState(
    initialDatasetId ?? "",
  );

  const datasets = api.datasets.allDatasetMeta.useQuery(
    { projectId },
    {
      trpc: {
        context: {
          skipBatch: true,
        },
      },
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
    },
  );

  const selectedDataset = datasets.data?.find(
    (dataset) => dataset.id === selectedDatasetId,
  );

  return (
    <>
      <DialogHeader>
        <Button
          variant="ghost"
          onClick={onBack}
          className="inline-block self-start"
        >
          {tAuto("back_c32ae9f")}{" "}
        </Button>
        <DialogTitle>{tAuto("select_dataset_acbdec4")}</DialogTitle>
        <DialogDescription>
          {tAuto(
            "remote_dataset_run_triggers_are_attached_to_a_datase_c29dead",
          )}{" "}
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        {datasets.isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : datasets.data && datasets.data.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-bold">{tAuto("dataset_1052689")}</div>
            <Popover
              open={datasetPopoverOpen}
              onOpenChange={setDatasetPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={datasetPopoverOpen}
                  className="w-full justify-between px-2 font-normal"
                >
                  {selectedDataset?.name ?? "Select a dataset"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-(--radix-popover-trigger-width) overflow-auto p-0"
                align="start"
              >
                <InputCommand>
                  <InputCommandInput
                    placeholder={tAuto("search_datasets_2edc7dc")}
                    className="h-9"
                    variant="bottom"
                  />
                  <InputCommandList>
                    <InputCommandEmpty>
                      {tAuto("no_dataset_found_48303db")}
                    </InputCommandEmpty>
                    <InputCommandGroup>
                      {datasets.data.map((dataset) => (
                        <InputCommandItem
                          key={dataset.id}
                          value={dataset.name}
                          onSelect={() => {
                            setSelectedDatasetId(dataset.id);
                            setDatasetPopoverOpen(false);
                          }}
                        >
                          {dataset.name}
                          <CheckIcon
                            className={cn(
                              "ml-auto h-4 w-4",
                              dataset.id === selectedDatasetId
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        </InputCommandItem>
                      ))}
                    </InputCommandGroup>
                  </InputCommandList>
                </InputCommand>
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <div className="rounded-md border p-4 text-sm">
            <div className="font-bold">
              {tAuto("no_datasets_found_172a447")}
            </div>
            <p className="text-muted-foreground mt-1">
              {tAuto(
                "create_a_dataset_before_setting_up_a_remote_experime_c994cf3",
              )}{" "}
            </p>
          </div>
        )}
      </DialogBody>

      <DialogFooter>
        <div className="flex w-full justify-end">
          <Button
            type="button"
            disabled={!selectedDataset}
            onClick={() => {
              if (selectedDataset) {
                onContinue(selectedDataset);
              }
            }}
          >
            {datasets.isFetching ? (
              <div className="mr-2">
                <Spinner size="sm" />
              </div>
            ) : null}
            {tAutoI18n("continue_2e02623")}{" "}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
};
