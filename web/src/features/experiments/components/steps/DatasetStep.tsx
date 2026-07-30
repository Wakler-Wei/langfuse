import React, { useState } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/src/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  InputCommandEmpty,
  InputCommandGroup,
  InputCommandInput,
  InputCommandList,
  InputCommand,
  InputCommandItem,
} from "@/src/components/ui/input-command";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Info, CircleCheck, ChevronDown, CheckIcon } from "lucide-react";
import { cn } from "@/src/utils/tailwind";
import { type DatasetStepProps } from "@/src/features/experiments/types/stepProps";
import { StepHeader } from "@/src/features/experiments/components/shared/StepHeader";
import { api } from "@/src/utils/api";
import { format } from "date-fns";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const DatasetStep: React.FC<DatasetStepProps> = ({
  projectId,
  formState,
  datasetState,
  promptInfo,
}) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const { form } = formState;
  const {
    datasets,
    selectedDatasetId,
    expectedColumnsForDataset: expectedColumns,
    validationResult,
  } = datasetState;
  const { selectedPromptName, selectedPromptVersion } = promptInfo;
  const [datasetPopoverOpen, setDatasetPopoverOpen] = useState(false);

  // Fetch dataset versions when a dataset is selected
  const { data: datasetVersions } = api.datasets.listDatasetVersions.useQuery(
    {
      projectId,
      datasetId: selectedDatasetId || "",
    },
    {
      enabled: !!selectedDatasetId,
    },
  );

  return (
    <div className="space-y-6">
      <StepHeader
        title={tAuto("dataset_selection_69b3b08")}
        description={tAuto(
          "choose_the_dataset_to_run_your_experiment_on_the_dat_2db722e",
        )}
      />

      <FormField
        control={form.control}
        name="datasetId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tAuto("dataset_1052689")}</FormLabel>
            <div className="flex items-center gap-2">
              <Popover
                open={datasetPopoverOpen}
                onOpenChange={setDatasetPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={datasetPopoverOpen}
                    className="flex-1 justify-between px-2 font-normal"
                  >
                    {field.value
                      ? datasets?.find((d) => d.id === field.value)?.name
                      : tAutoI18n("select_a_dataset_c0f85d3")}
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
                        {(datasets ?? []).map((dataset) => (
                          <InputCommandItem
                            key={dataset.id}
                            onSelect={() => {
                              field.onChange(dataset.id);
                              form.clearErrors("datasetId");
                              setDatasetPopoverOpen(false);
                            }}
                          >
                            {dataset.name}
                            <CheckIcon
                              className={cn(
                                "ml-auto h-4 w-4",
                                dataset.id === field.value
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

              {selectedPromptName && selectedPromptVersion !== null && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-8">
                      {tAuto("expected_columns_91e61b9")}{" "}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="leading-none font-bold">
                        {tAuto("expected_dataset_structure_5f93015")}{" "}
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        {tAutoI18n("based_on_prompt_c3dc652")}{" "}
                        {selectedPromptName} v{selectedPromptVersion}
                      </p>
                      <div className="space-y-1 pt-2">
                        <p className="text-sm font-bold">
                          {tAuto("input_variables_8635a40")}
                        </p>
                        <ul className="list-inside list-disc text-sm">
                          {expectedColumns.inputVariables.map((variable) => (
                            <li key={variable}>{variable}</li>
                          ))}
                        </ul>
                        <p className="text-sm font-bold">
                          {tAuto("expected_output_93617b0")}
                        </p>
                        <ul className="list-inside list-disc text-sm">
                          <li>
                            {expectedColumns.outputVariableName} (
                            {expectedColumns.outputVariableType})
                          </li>
                        </ul>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedDatasetId && datasetVersions && datasetVersions.length > 0 && (
        <FormField
          control={form.control}
          name="datasetVersion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tAuto("dataset_version_optional_2c53cb4")}</FormLabel>
              <Select
                onValueChange={(value) => {
                  if (value === "latest") {
                    field.onChange(undefined);
                  } else {
                    field.onChange(new Date(value));
                  }
                }}
                value={field.value ? field.value.toISOString() : "latest"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={tAuto("latest_version_0f32ae2")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="latest">
                    {tAuto("latest_version_default_4f9417b")}{" "}
                  </SelectItem>
                  {datasetVersions.map((version) => (
                    <SelectItem
                      key={version.toISOString()}
                      value={version.toISOString()}
                    >
                      {format(version, "MMM d, yyyy 'at' h:mm a")}{" "}
                      {tAutoI18n("utc_96a114a")}{" "}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {tAuto(
                  "run_the_experiment_using_the_dataset_state_at_a_spec_3fdda2e",
                )}{" "}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {selectedDatasetId && (
        <>
          {validationResult?.isValid === false && (
            <Card className="border-dark-yellow bg-light-yellow relative overflow-hidden rounded-md shadow-none group-data-[collapsible=icon]:hidden">
              <CardHeader className="p-2">
                <CardTitle className="text-dark-yellow flex items-center justify-between text-sm">
                  <span>{tAuto("invalid_configuration_0444e6d")}</span>
                  <Info className="h-4 w-4" />
                </CardTitle>
                <CardDescription className="text-foreground">
                  {validationResult?.message}
                </CardDescription>
              </CardHeader>
            </Card>
          )}
          {validationResult?.isValid === true && (
            <Card className="border-dark-green bg-light-green relative overflow-hidden rounded-md shadow-none group-data-[collapsible=icon]:hidden">
              <CardHeader className="p-2">
                <CardTitle className="text-dark-green flex items-center justify-between text-sm">
                  <span>{tAuto("valid_configuration_3e69165")}</span>
                  <CircleCheck className="h-4 w-4" />
                </CardTitle>
                <div className="text-sm">
                  Matches between dataset items and prompt
                  variables/placeholders
                  <ul className="my-2 ml-2 list-inside list-disc">
                    {Object.entries(validationResult.variablesMap ?? {}).map(
                      ([variable, count]) => (
                        <li key={variable}>
                          <strong>{variable}:</strong> {count} /{" "}
                          {validationResult?.isValid
                            ? validationResult.totalItems
                            : tAutoI18n("unknown_50d8b4a")}
                        </li>
                      ),
                    )}
                  </ul>
                  {tAuto(
                    "items_missing_all_required_variables_and_placeholder_f3ae05a",
                  )}{" "}
                </div>
              </CardHeader>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
