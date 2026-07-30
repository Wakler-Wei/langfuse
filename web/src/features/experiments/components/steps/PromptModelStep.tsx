import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { ModelParameters } from "@/src/components/ModelParameters";
import {
  InputCommandEmpty,
  InputCommandGroup,
  InputCommandInput,
  InputCommandList,
  InputCommand,
  InputCommandItem,
} from "@/src/components/ui/input-command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  ChevronDown,
  CheckIcon,
  PlusIcon,
  EyeIcon,
  TriangleAlert,
} from "lucide-react";
import { CreateOrEditLLMSchemaDialog } from "@/src/features/playground/page/components/CreateOrEditLLMSchemaDialog";
import {
  hasPromptToolStructuredOutputConflict,
  PROMPT_TOOL_STRUCTURED_OUTPUT_CONFLICT_MESSAGE,
  type LlmSchema,
} from "@langfuse/shared";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import { api } from "@/src/utils/api";
import { CardDescription } from "@/src/components/ui/card";
import { cn } from "@/src/utils/tailwind";
import { type PromptModelStepProps } from "@/src/features/experiments/types/stepProps";
import { StepHeader } from "@/src/features/experiments/components/shared/StepHeader";
import { TruncatedLabels } from "@/src/components/TruncatedLabels";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const PromptModelStep: React.FC<PromptModelStepProps> = ({
  projectId,
  formState,
  promptModelState,
  modelState,
  structuredOutputState,
}) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const { form } = formState;
  const {
    promptsByName,
    selectedPromptName,
    setSelectedPromptName,
    selectedPromptVersion,
    setSelectedPromptVersion,
    selectedPromptToolConfig,
  } = promptModelState;
  const {
    modelParams,
    updateModelParamValue,
    setModelParamEnabled,
    availableModels,
    providerModelCombinations,
    availableProviders,
  } = modelState;
  const {
    structuredOutputEnabled,
    setStructuredOutputEnabled,
    setSelectedSchemaName,
  } = structuredOutputState;
  const [open, setOpen] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<LlmSchema | null>(null);
  const [schemaPopoverOpen, setSchemaPopoverOpen] = useState(false);
  const hasToolStructuredOutputConflict = hasPromptToolStructuredOutputConflict(
    selectedPromptToolConfig,
    structuredOutputEnabled,
  );

  const savedSchemas = api.llmSchemas.getAll.useQuery(
    { projectId },
    {
      enabled: Boolean(projectId),
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  );

  const handleToggleStructuredOutput = (checked: boolean) => {
    setStructuredOutputEnabled(checked);

    if (checked) {
      // If turning on and schemas exist, auto-select first one
      if (
        savedSchemas.data &&
        savedSchemas.data.length > 0 &&
        !selectedSchema
      ) {
        const firstSchema = savedSchemas.data[0];
        setSelectedSchema(firstSchema);
        setSelectedSchemaName(firstSchema.name);
        form.setValue(
          "structuredOutputSchema",
          firstSchema.schema as Record<string, unknown>,
        );
      }
    } else {
      // If turning off, clear the form field
      setSelectedSchemaName(null);
      form.setValue("structuredOutputSchema", undefined);
    }
  };

  return (
    <div className="space-y-6">
      <StepHeader
        title={tAuto("prompt_model_configuration_fa391fa")}
        description={tAuto(
          "select_the_prompt_version_and_configure_the_model_pa_d5d662e",
        )}
      />

      <FormField
        control={form.control}
        name="promptId"
        render={() => (
          <FormItem>
            <FormLabel>{tAuto("prompt_a817d7e")}</FormLabel>
            <div className="mb-2 flex gap-2">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-2/3 justify-between px-2 font-normal"
                  >
                    {selectedPromptName || "Select a prompt"}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-(--radix-popover-trigger-width) overflow-auto p-0"
                  align="start"
                >
                  <InputCommand>
                    <InputCommandInput
                      placeholder={tAuto("search_prompts_dc12297")}
                      className="h-9"
                      variant="bottom"
                    />
                    <InputCommandList>
                      <InputCommandEmpty>
                        {tAuto("no_prompt_found_feee636")}
                      </InputCommandEmpty>
                      <InputCommandGroup>
                        {promptsByName &&
                          Object.entries(promptsByName).map(
                            ([name, promptData]) => (
                              <InputCommandItem
                                key={name}
                                onSelect={() => {
                                  setSelectedPromptName(name);
                                  const latestVersion = promptData[0];
                                  setSelectedPromptVersion(
                                    latestVersion.version,
                                  );
                                  form.setValue("promptId", latestVersion.id);
                                  form.clearErrors("promptId");
                                }}
                              >
                                {name}
                                <CheckIcon
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    name === selectedPromptName
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                              </InputCommandItem>
                            ),
                          )}
                      </InputCommandGroup>
                    </InputCommandList>
                  </InputCommand>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    disabled={!selectedPromptName}
                    variant="outline"
                    role="combobox"
                    className="w-1/3 justify-between px-2 font-normal"
                  >
                    {selectedPromptVersion
                      ? tAutoI18n("version_value0_3d17004", {
                          value0: String(
                            (selectedPromptVersion as unknown) ?? "",
                          ),
                        })
                      : tAutoI18n("version_2da600b")}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-(--radix-popover-trigger-width) p-0"
                  align="start"
                >
                  <InputCommand>
                    <InputCommandInput
                      placeholder={tAuto("search_versions_060c520")}
                      className="h-9"
                    />
                    <InputCommandList>
                      <InputCommandEmpty>
                        {tAuto("no_version_found_a5c9f42")}
                      </InputCommandEmpty>
                      <InputCommandGroup className="overflow-y-auto">
                        {promptsByName &&
                        selectedPromptName &&
                        promptsByName[selectedPromptName] ? (
                          promptsByName[selectedPromptName].map((prompt) => (
                            <InputCommandItem
                              key={prompt.id}
                              onSelect={() => {
                                setSelectedPromptVersion(prompt.version);
                                form.setValue("promptId", prompt.id);
                                form.clearErrors("promptId");
                              }}
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                <span className="shrink-0">
                                  {tAutoI18n("version_2da600b")}{" "}
                                  {prompt.version}
                                </span>
                                {prompt.labels.length > 0 && (
                                  <TruncatedLabels
                                    labels={prompt.labels}
                                    maxVisibleLabels={2}
                                    className="min-w-0"
                                  />
                                )}
                              </div>
                              <CheckIcon
                                className={cn(
                                  "ml-auto h-4 w-4 shrink-0",
                                  prompt.version === selectedPromptVersion
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                            </InputCommandItem>
                          ))
                        ) : (
                          <InputCommandItem disabled>
                            {tAuto("no_versions_available_a4ec98f")}{" "}
                          </InputCommandItem>
                        )}
                      </InputCommandGroup>
                    </InputCommandList>
                  </InputCommand>
                </PopoverContent>
              </Popover>
            </div>
            {selectedPromptToolConfig.status === "invalid" && (
              <p className="text-dark-yellow flex items-center gap-1.5 text-sm">
                <TriangleAlert className="h-4 w-4 shrink-0" />
                {tAuto(
                  "invalid_tool_config_detected_on_this_prompt_version__9155e73",
                )}{" "}
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="modelConfig"
        render={() => (
          <FormItem>
            <ModelParameters
              customHeader={<FormLabel>{tAuto("model_68c2cc7")}</FormLabel>}
              {...{
                modelParams,
                availableModels,
                providerModelCombinations,
                availableProviders,
                updateModelParamValue: updateModelParamValue,
                setModelParamEnabled,
                isEmbedded: true,
              }}
            />
            {form.formState.errors.modelConfig && (
              <p
                id="modelConfig"
                className="text-destructive text-sm font-bold"
              >
                {[
                  form.formState.errors.modelConfig?.model?.message,
                  form.formState.errors.modelConfig?.provider?.message,
                ].join(", ")}
              </p>
            )}
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="structuredOutputSchema"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>
                {tAuto("structured_output_optional_fcf7ef0")}
              </FormLabel>
              <Switch
                checked={structuredOutputEnabled}
                onCheckedChange={handleToggleStructuredOutput}
              />
            </div>

            {structuredOutputEnabled && (
              <>
                {savedSchemas.data && savedSchemas.data.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <Popover
                      open={schemaPopoverOpen}
                      onOpenChange={setSchemaPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={schemaPopoverOpen}
                          className="flex-1 justify-between px-2 font-normal"
                        >
                          {selectedSchema?.name || "Select schema"}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-(--radix-popover-trigger-width) p-0"
                        align="start"
                      >
                        <InputCommand>
                          <InputCommandInput
                            placeholder={tAuto("search_schemas_dc32102")}
                            className="h-9"
                            variant="bottom"
                          />
                          <InputCommandList>
                            <InputCommandEmpty>
                              {tAuto("no_schema_found_c21d816")}{" "}
                            </InputCommandEmpty>
                            <InputCommandGroup>
                              {savedSchemas.data.map((schema) => (
                                <InputCommandItem
                                  key={schema.id}
                                  onSelect={() => {
                                    setSelectedSchema(schema);
                                    setSelectedSchemaName(schema.name);
                                    field.onChange(
                                      schema.schema as Record<string, unknown>,
                                    );
                                    setSchemaPopoverOpen(false);
                                  }}
                                >
                                  {schema.name}
                                  <CheckIcon
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      selectedSchema?.id === schema.id
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

                    {selectedSchema && (
                      <CreateOrEditLLMSchemaDialog
                        projectId={projectId}
                        existingLlmSchema={selectedSchema}
                        onSave={(updatedSchema) => {
                          setSelectedSchema(updatedSchema);
                          setSelectedSchemaName(updatedSchema.name);
                          field.onChange(
                            updatedSchema.schema as Record<string, unknown>,
                          );
                        }}
                        onDelete={() => {
                          setSelectedSchema(null);
                          setSelectedSchemaName(null);
                          field.onChange(undefined);
                        }}
                      >
                        <Button variant="ghost" size="icon">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </CreateOrEditLLMSchemaDialog>
                    )}
                  </div>
                ) : (
                  <CreateOrEditLLMSchemaDialog
                    projectId={projectId}
                    onSave={(newSchema) => {
                      setSelectedSchema(newSchema);
                      setSelectedSchemaName(newSchema.name);
                      field.onChange(
                        newSchema.schema as Record<string, unknown>,
                      );
                      // Toggle is already ON if we're seeing this button
                      // No need to set it again
                    }}
                  >
                    <Button variant="outline" className="w-full">
                      <PlusIcon className="mr-2 h-4 w-4" />
                      {tAuto("add_schema_864ee5e")}{" "}
                    </Button>
                  </CreateOrEditLLMSchemaDialog>
                )}
              </>
            )}

            <CardDescription
              className={cn(
                hasToolStructuredOutputConflict && "text-destructive",
              )}
            >
              {hasToolStructuredOutputConflict
                ? PROMPT_TOOL_STRUCTURED_OUTPUT_CONFLICT_MESSAGE
                : structuredOutputEnabled
                  ? tAutoI18n(
                      "configure_the_schema_for_structured_llm_outputs_c100a3c",
                    )
                  : tAutoI18n(
                      "enable_to_enforce_a_specific_output_format_9a3e75b",
                    )}
            </CardDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
