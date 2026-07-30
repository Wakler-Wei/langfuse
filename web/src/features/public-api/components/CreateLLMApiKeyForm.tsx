import { useFieldArray, useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type BedrockApiKey,
  type BedrockAccessKeys,
  type BedrockConfig,
  type OpenAIConfig,
  type VertexAIConfig,
  LLMAdapter,
  BEDROCK_USE_DEFAULT_CREDENTIALS,
  VERTEXAI_USE_DEFAULT_CREDENTIALS,
} from "@langfuse/shared";
import { ChevronDown, PlusIcon, TrashIcon } from "lucide-react";
import { z } from "zod";
import { Button } from "@/src/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { api, type RouterOutputs } from "@/src/utils/api";
import { cn } from "@/src/utils/tailwind";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { type useUiCustomization } from "@/src/ee/features/ui-customization/useUiCustomization";
import { DialogFooter } from "@/src/components/ui/dialog";
import { DialogBody } from "@/src/components/ui/dialog";
import { env } from "@/src/env.mjs";
import {
  AuthMethod,
  BedrockAuthMethodSchema,
  type BedrockAuthMethod,
} from "@/src/features/llm-api-key/types";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

const isLangfuseCloud = Boolean(env.NEXT_PUBLIC_LANGFUSE_CLOUD_REGION);

/**
 * UI-only sentinel value for the adapter dropdown. Selecting it does not set a
 * real adapter; instead it surfaces guidance that any OpenAI-compatible
 * provider can be added through one of the existing adapters.
 */
const OTHER_MODEL_OPTION = "other-model";

const isCustomModelsRequired = (adapter: LLMAdapter) =>
  adapter === LLMAdapter.Azure || adapter === LLMAdapter.Bedrock;

const hasText = (value?: string) => Boolean(value?.trim());

/**
 * Whether the selected auth method matches the existing one (i.e. credentials
 * can be preserved on update). DefaultCredentials is grouped with AccessKeys
 * because both use SigV4-based authentication via the AWS SDK.
 */
const isMatchingBedrockAuthMethod = (
  newAuthMethod: BedrockAuthMethod,
  existingAuthMethod?: BedrockAuthMethod,
): boolean =>
  (newAuthMethod === AuthMethod.ApiKey &&
    existingAuthMethod === AuthMethod.ApiKey) ||
  (newAuthMethod === AuthMethod.AccessKeys &&
    (existingAuthMethod === AuthMethod.AccessKeys ||
      existingAuthMethod === AuthMethod.DefaultCredentials));

type LlmApiKeyListItem = RouterOutputs["llmApiKey"]["all"]["data"][number];

const getInitialBedrockAuthMethod = (params: {
  mode: "create" | "update";
  existingAuthMethod?: BedrockAuthMethod;
}): BedrockAuthMethod => {
  if (params.mode === "update") {
    return params.existingAuthMethod === AuthMethod.ApiKey
      ? AuthMethod.ApiKey
      : AuthMethod.AccessKeys;
  }

  return AuthMethod.AccessKeys;
};

const createFormSchema = (params: {
  mode: "create" | "update";
  existingAuthMethod?: BedrockAuthMethod;
}) =>
  z
    .object({
      secretKey: z.string().optional(),
      provider: z
        .string()
        .min(1, "Please add a provider name that identifies this connection.")
        .regex(
          /^[^:]+$/,
          "Provider name cannot contain colons. Use a format like 'OpenRouter_Mistral' instead.",
        ),
      adapter: z.enum(LLMAdapter),
      baseURL: z.union([z.literal(""), z.url()]),
      withDefaultModels: z.boolean(),
      customModels: z.array(z.object({ value: z.string().min(1) })),
      awsAccessKeyId: z.string().optional(),
      awsSecretAccessKey: z.string().optional(),
      bedrockApiKey: z.string().optional(),
      authMethod: BedrockAuthMethodSchema,
      awsRegion: z.string().optional(),
      vertexAILocation: z.string().optional(),
      openAIUseResponsesApi: z.boolean(),
      extraHeaders: z.array(
        z.object({
          key: z.string().min(1),
          value:
            params.mode === "create"
              ? z.string().min(1)
              : z.string().optional(),
        }),
      ),
    })
    .superRefine((data, ctx) => {
      if (data.adapter !== LLMAdapter.Bedrock) return;

      const hasRegion = hasText(data.awsRegion);
      const hasAccessKeyId = hasText(data.awsAccessKeyId);
      const hasSecretAccessKey = hasText(data.awsSecretAccessKey);
      const hasBedrockApiKey = hasText(data.bedrockApiKey);
      const hasAnyAccessKeys = hasAccessKeyId || hasSecretAccessKey;
      const { authMethod } = data;
      const isUpdatingCurrentAuthMethod =
        params.mode === "update" &&
        isMatchingBedrockAuthMethod(authMethod, params.existingAuthMethod);

      if (!hasRegion) {
        ctx.addIssue({
          code: "custom",
          message: "AWS region is required.",
          path: ["awsRegion"],
        });
      }

      if (authMethod === AuthMethod.AccessKeys) {
        if (isUpdatingCurrentAuthMethod && !hasAnyAccessKeys) {
          return;
        }

        if (!isLangfuseCloud && !hasAnyAccessKeys) {
          return;
        }

        if (!hasAccessKeyId) {
          ctx.addIssue({
            code: "custom",
            message: "AWS Access Key ID is required.",
            path: ["awsAccessKeyId"],
          });
        }

        if (!hasSecretAccessKey) {
          ctx.addIssue({
            code: "custom",
            message: "AWS Secret Access Key is required.",
            path: ["awsSecretAccessKey"],
          });
        }
        return;
      }

      if (isUpdatingCurrentAuthMethod && !hasBedrockApiKey) {
        return;
      }

      if (!hasBedrockApiKey) {
        ctx.addIssue({
          code: "custom",
          message: "Bedrock API key is required.",
          path: ["bedrockApiKey"],
        });
      }
    })
    .refine(
      (data) => {
        if (isCustomModelsRequired(data.adapter)) {
          return data.customModels.length > 0;
        }
        return true;
      },
      {
        message: "At least one custom model is required for this adapter.",
        path: ["customModels"],
      },
    )
    // 2) For adapters that support defaults, require default models or at least one custom model
    .refine(
      (data) => {
        if (isCustomModelsRequired(data.adapter)) {
          return true;
        }
        return data.withDefaultModels || data.customModels.length > 0;
      },
      {
        message:
          "At least one custom model name is required when default models are disabled.",
        path: ["withDefaultModels"],
      },
    )
    // Vertex AI validation - service account key or ADC sentinel value required
    .refine(
      (data) => {
        if (data.adapter !== LLMAdapter.VertexAI) return true;

        // In update mode, credentials are optional (existing ones are preserved)
        if (params.mode === "update") return true;

        // secretKey is required (either JSON key or VERTEXAI_USE_DEFAULT_CREDENTIALS sentinel)
        return !!data.secretKey;
      },
      {
        message: isLangfuseCloud
          ? "GCP service account JSON key is required for Vertex AI"
          : "GCP service account JSON key or Application Default Credentials is required.",
        path: ["secretKey"],
      },
    )
    .refine(
      (data) =>
        data.adapter === LLMAdapter.Bedrock ||
        data.adapter === LLMAdapter.VertexAI ||
        params.mode === "update" ||
        data.secretKey,
      {
        message: "Secret key is required.",
        path: ["secretKey"],
      },
    )
    .refine(
      (data) => {
        if (data.adapter !== LLMAdapter.Azure) return true;
        return data.baseURL && data.baseURL.trim() !== "";
      },
      {
        message: "API Base URL is required for Azure connections.",
        path: ["baseURL"],
      },
    );

interface CreateLLMApiKeyFormProps {
  projectId?: string;
  onSuccess: () => void;
  customization: ReturnType<typeof useUiCustomization>;
  mode?: "create" | "update";
  existingKey?: LlmApiKeyListItem;
}

export function CreateLLMApiKeyForm({
  projectId,
  onSuccess,
  customization,
  mode = "create",
  existingKey,
}: CreateLLMApiKeyFormProps) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  // When the "Other model" option is selected we hide the form fields and show
  // guidance instead. This is purely UI state and never reaches the form value.
  const [showOtherModelInfo, setShowOtherModelInfo] = useState(false);
  const [adapterSelectOpen, setAdapterSelectOpen] = useState(false);
  const utils = api.useUtils();
  const capture = usePostHogClientCapture();

  const existingKeys = api.llmApiKey.all.useQuery(
    {
      projectId: projectId as string,
    },
    { enabled: Boolean(projectId) },
  );

  const mutCreateLlmApiKey = api.llmApiKey.create.useMutation({
    onSuccess: () => utils.llmApiKey.invalidate(),
  });

  const mutUpdateLlmApiKey = api.llmApiKey.update.useMutation({
    onSuccess: () => utils.llmApiKey.invalidate(),
  });

  const mutTestLLMApiKey = api.llmApiKey.test.useMutation();
  const mutTestUpdateLLMApiKey = api.llmApiKey.testUpdate.useMutation();

  const defaultAdapter: LLMAdapter = customization?.defaultModelAdapter
    ? LLMAdapter[customization.defaultModelAdapter]
    : LLMAdapter.OpenAI;

  const getCustomizedBaseURL = (adapter: LLMAdapter) => {
    switch (adapter) {
      case LLMAdapter.OpenAI:
        return customization?.defaultBaseUrlOpenAI ?? "";
      case LLMAdapter.Azure:
        return customization?.defaultBaseUrlAzure ?? "";
      case LLMAdapter.Anthropic:
        return customization?.defaultBaseUrlAnthropic ?? "";
      default:
        return "";
    }
  };

  const formSchema = createFormSchema({
    mode,
    existingAuthMethod: existingKey?.authMethod,
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues:
      mode === "update" && existingKey
        ? {
            adapter: existingKey.adapter as LLMAdapter,
            provider: existingKey.provider,
            secretKey:
              existingKey.adapter === LLMAdapter.VertexAI &&
              existingKey.displaySecretKey === "Default GCP credentials (ADC)"
                ? VERTEXAI_USE_DEFAULT_CREDENTIALS
                : "",
            baseURL:
              existingKey.baseURL ??
              getCustomizedBaseURL(existingKey.adapter as LLMAdapter),
            withDefaultModels: existingKey.withDefaultModels,
            customModels: existingKey.customModels.map((value) => ({ value })),
            extraHeaders:
              existingKey.extraHeaderKeys?.map((key) => ({ key, value: "" })) ??
              [],
            vertexAILocation:
              existingKey.adapter === LLMAdapter.VertexAI && existingKey.config
                ? ((existingKey.config as VertexAIConfig).location ?? "")
                : "",
            openAIUseResponsesApi:
              existingKey.adapter === LLMAdapter.OpenAI &&
              existingKey.config != null
                ? Boolean((existingKey.config as OpenAIConfig).useResponsesApi)
                : false,
            awsRegion:
              existingKey.adapter === LLMAdapter.Bedrock && existingKey.config
                ? ((existingKey.config as BedrockConfig).region ?? "")
                : "",
            awsAccessKeyId: "",
            awsSecretAccessKey: "",
            bedrockApiKey: "",
            authMethod: getInitialBedrockAuthMethod({
              mode,
              existingAuthMethod: existingKey.authMethod,
            }),
          }
        : {
            adapter: defaultAdapter,
            provider: "",
            secretKey: "",
            baseURL: getCustomizedBaseURL(defaultAdapter),
            withDefaultModels: true,
            customModels: [],
            extraHeaders: [],
            vertexAILocation: "global",
            openAIUseResponsesApi: false,
            awsRegion: "",
            awsAccessKeyId: "",
            awsSecretAccessKey: "",
            bedrockApiKey: "",
            authMethod: getInitialBedrockAuthMethod({
              mode,
            }),
          },
  });

  const currentAdapter = form.watch("adapter");
  const currentAuthMethod = form.watch("authMethod");
  const isKeepingCurrentBedrockAuthMethod =
    mode === "update" &&
    currentAdapter === LLMAdapter.Bedrock &&
    isMatchingBedrockAuthMethod(currentAuthMethod, existingKey?.authMethod);
  const isUsingDefaultAwsCredentialsForCurrentAuthMethod =
    currentAuthMethod === AuthMethod.AccessKeys &&
    existingKey?.authMethod === AuthMethod.DefaultCredentials;

  const hasAdvancedSettings = (adapter: LLMAdapter) =>
    adapter === LLMAdapter.OpenAI ||
    adapter === LLMAdapter.Anthropic ||
    adapter === LLMAdapter.VertexAI ||
    adapter === LLMAdapter.GoogleAIStudio;

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "customModels",
  });

  const {
    fields: headerFields,
    append: appendHeader,
    remove: removeHeader,
  } = useFieldArray({
    control: form.control,
    name: "extraHeaders",
  });

  const renderCustomModelsField = () => (
    <FormField
      control={form.control}
      name="customModels"
      render={() => (
        <FormItem>
          <FormLabel>{tAuto("custom_models_3166910")}</FormLabel>
          <FormDescription>
            {tAuto(
              "custom_model_names_accepted_by_given_endpoint_c0d9fdd",
            )}{" "}
          </FormDescription>
          {currentAdapter === LLMAdapter.Azure && (
            <FormDescription className="text-dark-yellow">
              {tAuto(
                "for_azure_the_model_name_should_be_the_same_as_the_d_0818ba6",
              )}{" "}
            </FormDescription>
          )}

          {currentAdapter === LLMAdapter.Bedrock && (
            <FormDescription className="text-dark-yellow">
              {
                "For Bedrock, the model name is the Bedrock Inference Profile ID, e.g. 'eu.anthropic.claude-sonnet-4-6'"
              }
            </FormDescription>
          )}

          {fields.map((customModel, index) => (
            <span key={customModel.id} className="flex flex-row space-x-2">
              <Input
                {...form.register(`customModels.${index}.value`)}
                placeholder={tAuto("custom_model_name_value0_fb8355b", {
                  value0: index + 1,
                })}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => remove(index)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </span>
          ))}
          <Button
            type="button"
            variant="ghost"
            onClick={() => append({ value: "" })}
            className="w-full"
          >
            <PlusIcon className="mr-1.5 -ml-0.5 h-5 w-5" aria-hidden="true" />
            {tAuto("add_custom_model_name_dc47b01")}{" "}
          </Button>
        </FormItem>
      )}
    />
  );

  const renderExtraHeadersField = () => (
    <FormField
      control={form.control}
      name="extraHeaders"
      render={() => (
        <FormItem>
          <FormLabel>{tAuto("extra_headers_07cfd31")}</FormLabel>
          <FormDescription>
            {tAutoI18n(
              "optional_additional_http_headers_to_include_with_req_a35c70c",
            )}{" "}
            {isLangfuseCloud
              ? tAutoI18n("on_our_servers_b8af8fd")
              : tAutoI18n("in_your_database_c5db6d9")}
            .
          </FormDescription>

          {headerFields.map((header, index) => (
            <div key={header.id} className="flex flex-row space-x-2">
              <Input
                {...form.register(`extraHeaders.${index}.key`)}
                placeholder={tAuto("header_name_b46f85a")}
              />
              <Input
                {...form.register(`extraHeaders.${index}.value`)}
                placeholder={
                  mode === "update" &&
                  existingKey?.extraHeaderKeys &&
                  existingKey.extraHeaderKeys[index]
                    ? "***"
                    : tAuto("header_value_418adf0")
                }
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeHeader(index)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="ghost"
            onClick={() => appendHeader({ key: "", value: "" })}
            className="w-full"
          >
            <PlusIcon className="mr-1.5 -ml-0.5 h-5 w-5" aria-hidden="true" />
            {tAuto("add_header_42b9490")}{" "}
          </Button>
        </FormItem>
      )}
    />
  );

  // Disable provider and adapter fields in update mode
  const isFieldDisabled = (fieldName: string) => {
    if (mode !== "update") return false;
    return ["provider", "adapter"].includes(fieldName);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!projectId) return console.error("No project ID found.");

    if (mode === "create") {
      if (
        existingKeys?.data?.data
          .map((k) => k.provider)
          .includes(values.provider)
      ) {
        form.setError("provider", {
          type: "manual",
          message: "There already exists an API key for this provider.",
        });
        return;
      }
      capture("project_settings:llm_api_key_create", {
        provider: values.provider,
      });
    } else {
      capture("project_settings:llm_api_key_update", {
        provider: values.provider,
      });
    }

    let secretKey = values.secretKey;
    let config: BedrockConfig | OpenAIConfig | VertexAIConfig | undefined;

    if (currentAdapter === LLMAdapter.Bedrock) {
      const shouldPreserveExistingBedrockCredentials =
        mode === "update" &&
        isMatchingBedrockAuthMethod(values.authMethod, existingKey?.authMethod);

      switch (values.authMethod) {
        case AuthMethod.ApiKey:
          secretKey =
            shouldPreserveExistingBedrockCredentials && !values.bedrockApiKey
              ? undefined
              : JSON.stringify({
                  apiKey: values.bedrockApiKey!,
                } satisfies BedrockApiKey);
          break;
        case AuthMethod.AccessKeys:
          if (!values.awsAccessKeyId && !values.awsSecretAccessKey) {
            secretKey = shouldPreserveExistingBedrockCredentials
              ? undefined
              : BEDROCK_USE_DEFAULT_CREDENTIALS;
          } else {
            secretKey = JSON.stringify({
              accessKeyId: values.awsAccessKeyId!,
              secretAccessKey: values.awsSecretAccessKey!,
            } satisfies BedrockAccessKeys);
          }
          break;
      }

      config = {
        region: values.awsRegion ?? "",
      };
    } else if (currentAdapter === LLMAdapter.VertexAI) {
      // Handle Vertex AI credentials
      // secretKey already contains either JSON key or VERTEXAI_USE_DEFAULT_CREDENTIALS sentinel
      if (mode === "update") {
        // In update mode, only update secretKey if a new one is provided
        if (values.secretKey) {
          secretKey = values.secretKey;
        } else {
          // Keep existing credentials by not setting secretKey
          secretKey = undefined;
        }
      }
      // In create mode, secretKey is already set from values.secretKey

      // Build config with location only (projectId removed for security - ADC auto-detects)
      const vertexAIConfig: VertexAIConfig = {};
      if (values.vertexAILocation?.trim()) {
        vertexAIConfig.location = values.vertexAILocation.trim();
      }
      // If config is empty, set to undefined
      config =
        Object.keys(vertexAIConfig).length > 0 ? vertexAIConfig : undefined;
    } else if (currentAdapter === LLMAdapter.OpenAI) {
      config =
        values.openAIUseResponsesApi || mode === "update"
          ? { useResponsesApi: values.openAIUseResponsesApi }
          : undefined;
    }

    const extraHeaders =
      values.extraHeaders.length > 0
        ? values.extraHeaders.reduce(
            (acc, header) => {
              acc[header.key] = header.value ?? "";
              return acc;
            },
            {} as Record<string, string>,
          )
        : undefined;

    const newLlmApiKey = {
      id: existingKey?.id ?? "",
      projectId,
      secretKey: secretKey ?? "",
      provider: values.provider,
      adapter: values.adapter,
      baseURL: values.baseURL || undefined,
      withDefaultModels: isCustomModelsRequired(currentAdapter)
        ? false
        : values.withDefaultModels,
      config,
      customModels: values.customModels
        .map((m) => m.value.trim())
        .filter(Boolean),
      extraHeaders,
    };

    try {
      const testResult =
        mode === "create"
          ? await mutTestLLMApiKey.mutateAsync(newLlmApiKey)
          : await mutTestUpdateLLMApiKey.mutateAsync(newLlmApiKey);

      if (!testResult.success) throw new Error(testResult.error);
    } catch (error) {
      form.setError("root", {
        type: "manual",
        message:
          error instanceof Error
            ? error.message
            : "Could not verify the API key.",
      });

      return;
    }

    return (mode === "create" ? mutCreateLlmApiKey : mutUpdateLlmApiKey)
      .mutateAsync(newLlmApiKey)
      .then(() => {
        form.reset();
        onSuccess();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4 overflow-auto"
        onSubmit={(e) => {
          e.stopPropagation(); // Prevent event bubbling to parent forms
          form.handleSubmit(onSubmit)(e);
        }}
      >
        <DialogBody>
          {/* LLM adapter */}
          <FormField
            control={form.control}
            name="adapter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tAuto("llm_adapter_5366622")}</FormLabel>
                <FormDescription>
                  {tAuto(
                    "schema_that_is_accepted_at_that_provider_endpoint_98c7a0a",
                  )}{" "}
                </FormDescription>
                <Select
                  open={adapterSelectOpen}
                  onOpenChange={setAdapterSelectOpen}
                  value={showOtherModelInfo ? OTHER_MODEL_OPTION : field.value}
                  onValueChange={(value) => {
                    if (value === OTHER_MODEL_OPTION) {
                      setShowOtherModelInfo(true);
                      return;
                    }
                    setShowOtherModelInfo(false);
                    // Only reset the base URL when the adapter actually
                    // changes. Bouncing through the "other model" sentinel and
                    // back to the same adapter looks like a value change to
                    // Radix, but must not wipe a custom base URL the user
                    // already entered.
                    if (value !== field.value) {
                      form.setValue(
                        "baseURL",
                        getCustomizedBaseURL(value as LLMAdapter),
                      );
                    }
                    field.onChange(value as LLMAdapter);
                  }}
                  disabled={isFieldDisabled("adapter")}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={tAuto("select_a_llm_provider_f55153b")}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(LLMAdapter).map((provider) => (
                      <SelectItem value={provider} key={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                    {mode === "create" && (
                      <SelectItem value={OTHER_MODEL_OPTION}>
                        {tAuto("other_model_57964ee")}{" "}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {showOtherModelInfo && (
            <div className="bg-muted/40 text-muted-foreground space-y-2 rounded-md border p-4 text-sm">
              <p>
                You can use any model provider as LLM connection that supports
                one of the adapters in the list. Many providers support the
                OpenAI API schema, such as Z.ai, OpenRouter, Qwen, Mistral,
                Hugging Face, and more. Just replace the API Base URL with the
                endpoint for the model, and add your provider&apos;s custom
                model names and api key.
              </p>
              <p>
                <a
                  href="https://langfuse.com/docs/administration/llm-connection#supported-providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  {tAuto("learn_more_about_supported_providers_b060f4e")}{" "}
                </a>
              </p>
            </div>
          )}

          {!showOtherModelInfo && (
            <>
              {/* Provider name */}
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAuto("provider_name_34ea99e")}</FormLabel>
                    <FormDescription>
                      {tAuto(
                        "key_to_identify_the_connection_within_langfuse_canno_b81a0be",
                      )}{" "}
                    </FormDescription>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={tAuto("e_g_value0_a09536b", {
                          value0: currentAdapter,
                        })}
                        disabled={isFieldDisabled("provider")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* API Key or AWS Credentials or Vertex AI Credentials */}
              {currentAdapter === LLMAdapter.Bedrock ? (
                <>
                  <FormField
                    control={form.control}
                    name="authMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {tAuto("authentication_method_09d8b93")}
                        </FormLabel>
                        <FormDescription>
                          {tAuto(
                            "select_how_langfuse_should_authenticate_to_bedrock_2ac94cb",
                          )}{" "}
                        </FormDescription>
                        <FormControl>
                          <Tabs
                            value={field.value}
                            onValueChange={(value) =>
                              field.onChange(value as BedrockAuthMethod)
                            }
                            className="w-full"
                          >
                            <TabsList
                              className={cn(
                                "grid h-auto w-full gap-1",
                                "grid-cols-2",
                              )}
                            >
                              <TabsTrigger
                                value={AuthMethod.AccessKeys}
                                className="text-xs"
                              >
                                {tAuto("aws_access_keys_6bc8cdc")}{" "}
                              </TabsTrigger>
                              <TabsTrigger
                                value={AuthMethod.ApiKey}
                                className="text-xs"
                              >
                                {tAuto("api_key_cf678ca")}{" "}
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="awsRegion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tAuto("aws_region_1a6fcaf")}</FormLabel>
                        <FormDescription>
                          {mode === "update" &&
                            existingKey?.config &&
                            (existingKey.config as BedrockConfig).region && (
                              <span className="text-sm">
                                {tAutoI18n("current_19889c9")}{" "}
                                <code className="bg-muted rounded px-1 py-0.5">
                                  {(existingKey.config as BedrockConfig).region}
                                </code>
                              </span>
                            )}
                        </FormDescription>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={
                              mode === "update" && existingKey?.config
                                ? ((existingKey.config as BedrockConfig)
                                    .region ?? "")
                                : tAuto("e_g_us_east_1_a9681ad")
                            }
                            data-1p-ignore
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {currentAuthMethod === AuthMethod.ApiKey && (
                    <FormField
                      control={form.control}
                      name="bedrockApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {tAuto("bedrock_api_key_f0af955")}
                          </FormLabel>
                          <FormDescription>
                            {mode === "update" ? (
                              <>
                                {tAuto("use_1d4d43c")}{" "}
                                <a
                                  href="https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline hover:text-blue-800"
                                >
                                  {tAuto(
                                    "amazon_bedrock_api_keys_23f8f23",
                                  )}{" "}
                                </a>{" "}
                                {tAuto(
                                  "to_replace_the_current_authentication_160df4c",
                                )}{" "}
                              </>
                            ) : (
                              <>
                                {tAuto("use_1d4d43c")}{" "}
                                <a
                                  href="https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline hover:text-blue-800"
                                >
                                  {tAuto(
                                    "amazon_bedrock_api_keys_23f8f23",
                                  )}{" "}
                                </a>
                                .
                              </>
                            )}
                          </FormDescription>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder={
                                mode === "update"
                                  ? isKeepingCurrentBedrockAuthMethod &&
                                    existingKey?.displaySecretKey
                                    ? tAuto(
                                        "value0_preserved_unless_replaced_dbdbd0f",
                                        {
                                          value0: existingKey.displaySecretKey,
                                        },
                                      )
                                    : tAuto("enter_bedrock_api_key_81d36de")
                                  : undefined
                              }
                              autoComplete="new-password"
                              data-1p-ignore
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {currentAuthMethod === AuthMethod.AccessKeys && (
                    <>
                      <FormField
                        control={form.control}
                        name="awsAccessKeyId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {tAutoI18n("aws_access_key_id_800021b")}{" "}
                              {!isLangfuseCloud && (
                                <span className="text-muted-foreground font-normal">
                                  {" "}
                                  {tAutoI18n("optional_b16c7ac")}{" "}
                                </span>
                              )}
                            </FormLabel>
                            <FormDescription>
                              {mode === "update"
                                ? isKeepingCurrentBedrockAuthMethod
                                  ? tAutoI18n(
                                      "leave_empty_to_keep_existing_credentials_to_update_p_a6508ae",
                                    )
                                  : tAutoI18n(
                                      "provide_both_access_key_id_and_secret_access_key_4a8858a",
                                    )
                                : isLangfuseCloud
                                  ? tAutoI18n(
                                      "these_should_be_long_lived_credentials_for_an_aws_us_f88d09a",
                                    )
                                  : tAutoI18n(
                                      "for_self_hosted_deployments_aws_credentials_are_opti_54f497a",
                                    )}
                            </FormDescription>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={
                                  mode === "update"
                                    ? isUsingDefaultAwsCredentialsForCurrentAuthMethod
                                      ? tAuto(
                                          "using_default_aws_credentials_289ae2c",
                                        )
                                      : isKeepingCurrentBedrockAuthMethod
                                        ? tAuto(
                                            "existing_credentials_preserved_if_empty_b8776b3",
                                          )
                                        : tAuto(
                                            "enter_aws_access_key_id_9f66d21",
                                          )
                                    : undefined
                                }
                                autoComplete="off"
                                data-1p-ignore
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="awsSecretAccessKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {tAutoI18n("aws_secret_access_key_8b9bdfe")}{" "}
                              {!isLangfuseCloud && (
                                <span className="text-muted-foreground font-normal">
                                  {" "}
                                  {tAutoI18n("optional_b16c7ac")}{" "}
                                </span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder={
                                  mode === "update"
                                    ? isUsingDefaultAwsCredentialsForCurrentAuthMethod
                                      ? tAuto(
                                          "using_default_aws_credentials_289ae2c",
                                        )
                                      : isKeepingCurrentBedrockAuthMethod &&
                                          existingKey?.displaySecretKey
                                        ? tAuto(
                                            "value0_preserved_if_empty_af6b0e2",
                                            {
                                              value0:
                                                existingKey.displaySecretKey,
                                            },
                                          )
                                        : tAuto(
                                            "enter_aws_secret_access_key_689ba9d",
                                          )
                                    : undefined
                                }
                                autoComplete="new-password"
                                data-1p-ignore
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  {!isLangfuseCloud &&
                    currentAuthMethod === AuthMethod.AccessKeys && (
                      <div className="text-muted-foreground space-y-2 border-l-2 border-blue-200 pl-4 text-sm">
                        <p>
                          <strong>
                            {tAuto("default_credential_provider_chain_178798b")}
                          </strong>{" "}
                          {tAutoI18n(
                            "when_aws_credentials_are_omitted_the_system_will_aut_01f4760",
                          )}{" "}
                        </p>
                        <ul className="ml-2 list-inside list-disc space-y-1">
                          <li>
                            {tAuto(
                              "environment_variables_aws_access_key_id_aws_secret_a_308b080",
                            )}{" "}
                          </li>
                          <li>
                            {tAuto(
                              "aws_credentials_file_aws_credentials_db0b660",
                            )}
                          </li>
                          <li>
                            {tAuto("iam_roles_for_ec2_instances_e08c279")}
                          </li>
                          <li>{tAuto("iam_roles_for_ecs_tasks_4d39421")}</li>
                        </ul>
                        <p>
                          <a
                            href="https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            {tAuto(
                              "learn_more_about_aws_credential_providers_d916a69",
                            )}{" "}
                          </a>
                        </p>
                      </div>
                    )}
                </>
              ) : currentAdapter === LLMAdapter.VertexAI ? (
                <>
                  {/* Vertex AI ADC option for self-hosted only, create mode only */}
                  {!isLangfuseCloud && mode === "create" && (
                    <FormItem>
                      <span className="flex">
                        <span className="flex-1">
                          <FormLabel>
                            {tAuto(
                              "use_application_default_credentials_adc_19ecfb2",
                            )}{" "}
                          </FormLabel>
                          <FormDescription>
                            When enabled, authentication uses the GCP
                            environment&apos;s default credentials instead of a
                            service account key.
                          </FormDescription>
                        </span>
                        <FormControl>
                          <Switch
                            checked={
                              form.watch("secretKey") ===
                              VERTEXAI_USE_DEFAULT_CREDENTIALS
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                form.setValue(
                                  "secretKey",
                                  VERTEXAI_USE_DEFAULT_CREDENTIALS,
                                );
                              } else {
                                form.setValue("secretKey", "");
                              }
                            }}
                          />
                        </FormControl>
                      </span>
                    </FormItem>
                  )}

                  {/* Service Account Key - hidden when ADC is enabled */}
                  {(isLangfuseCloud ||
                    form.watch("secretKey") !==
                      VERTEXAI_USE_DEFAULT_CREDENTIALS) && (
                    <FormField
                      control={form.control}
                      name="secretKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {tAuto("gcp_service_account_key_json_3fc4ce8")}
                          </FormLabel>
                          <FormDescription>
                            {isLangfuseCloud
                              ? tAutoI18n(
                                  "your_api_keys_are_stored_encrypted_on_our_servers_10cfd6c",
                                )
                              : tAutoI18n(
                                  "your_api_keys_are_stored_encrypted_in_your_database_f94a778",
                                )}
                          </FormDescription>
                          <FormDescription className="text-dark-yellow">
                            {tAuto(
                              "paste_your_gcp_service_account_json_key_here_the_ser_926c02f",
                            )}{" "}
                            <pre className="text-xs">
                              {`{
  "type": "service_account",
  "project_id": "<project_id>",
  "private_key_id": "<private_key_id>",
  "private_key": "<private_key>",
  "client_email": "<client_email>",
  "client_id": "<client_id>",
  "auth_uri": "<auth_uri>",
  "token_uri": "<token_uri>",
  "auth_provider_x509_cert_url": "<auth_provider_x509_cert_url>",
  "client_x509_cert_url": "<client_x509_cert_url>",
}`}
                            </pre>
                          </FormDescription>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={
                                mode === "update"
                                  ? existingKey?.displaySecretKey
                                  : tAuto("type_service_account_91e5146")
                              }
                              autoComplete="off"
                              spellCheck="false"
                              autoCapitalize="off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* ADC info box for self-hosted */}
                  {!isLangfuseCloud &&
                    form.watch("secretKey") ===
                      VERTEXAI_USE_DEFAULT_CREDENTIALS && (
                      <div className="text-muted-foreground space-y-2 border-l-2 border-blue-200 pl-4 text-sm">
                        <p>
                          <strong>
                            {tAuto(
                              "application_default_credentials_adc_6036a88",
                            )}{" "}
                          </strong>{" "}
                          {tAutoI18n(
                            "when_enabled_the_system_will_automatically_check_for_b14d6df",
                          )}{" "}
                        </p>
                        <ul className="ml-2 list-inside list-disc space-y-1">
                          <li>
                            {tAuto(
                              "environment_variable_google_application_credentials_6b98d2a",
                            )}{" "}
                          </li>
                          <li>
                            {tAuto(
                              "gcloud_cli_credentials_gcloud_auth_application_defau_df624de",
                            )}{" "}
                          </li>
                          <li>{tAuto("gke_workload_identity_f2e4a47")}</li>
                          <li>{tAuto("cloud_run_service_account_2a9dbff")}</li>
                          <li>
                            {tAuto(
                              "gce_instance_service_account_metadata_service_00870eb",
                            )}{" "}
                          </li>
                        </ul>
                        <p>
                          <a
                            href="https://cloud.google.com/docs/authentication/application-default-credentials"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            {tAuto(
                              "learn_more_about_gcp_application_default_credentials_ddb1932",
                            )}{" "}
                          </a>
                        </p>
                      </div>
                    )}
                </>
              ) : (
                <FormField
                  control={form.control}
                  name="secretKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tAuto("api_key_47acd20")}</FormLabel>
                      <FormDescription>
                        {isLangfuseCloud
                          ? tAutoI18n(
                              "your_api_keys_are_stored_encrypted_on_our_servers_10cfd6c",
                            )
                          : tAutoI18n(
                              "your_api_keys_are_stored_encrypted_in_your_database_f94a778",
                            )}
                      </FormDescription>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={
                            mode === "update"
                              ? existingKey?.displaySecretKey
                              : undefined
                          }
                          autoComplete="off"
                          spellCheck="false"
                          autoCapitalize="off"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Azure Base URL - Always required for Azure */}
              {currentAdapter === LLMAdapter.Azure && (
                <FormField
                  control={form.control}
                  name="baseURL"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tAuto("api_base_url_51cdd42")}</FormLabel>
                      <FormDescription>
                        Please add the base URL in the following format (or
                        compatible API):
                        https://&#123;instanceName&#125;.openai.azure.com/openai/deployments
                      </FormDescription>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://your-instance.openai.azure.com/openai/deployments"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Custom models: top-level for Azure/Bedrock */}
              {isCustomModelsRequired(currentAdapter) &&
                renderCustomModelsField()}

              {/* Extra headers - show for Azure in main section (Azure has no advanced settings) */}
              {currentAdapter === LLMAdapter.Azure && renderExtraHeadersField()}

              {hasAdvancedSettings(currentAdapter) && (
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="flex items-center pl-0"
                    onClick={() =>
                      setShowAdvancedSettings(!showAdvancedSettings)
                    }
                  >
                    <span>
                      {showAdvancedSettings
                        ? tAutoI18n("hide_advanced_settings_266f399")
                        : tAutoI18n("show_advanced_settings_065144e")}
                    </span>
                    <ChevronDown
                      className={`ml-1 h-4 w-4 transition-transform ${showAdvancedSettings ? "rotate-180" : "rotate-0"}`}
                    />
                  </Button>
                </div>
              )}

              {hasAdvancedSettings(currentAdapter) && showAdvancedSettings && (
                <div className="space-y-4 border-t pt-4">
                  {/* baseURL */}
                  <FormField
                    control={form.control}
                    name="baseURL"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tAuto("api_base_url_51cdd42")}</FormLabel>
                        <FormDescription>
                          {tAutoI18n(
                            "leave_blank_to_use_the_default_base_url_for_the_give_a5f5829",
                          )}{" "}
                          {currentAdapter === LLMAdapter.OpenAI && (
                            <span>
                              OpenAI default: https://api.openai.com/v1
                            </span>
                          )}
                          {currentAdapter === LLMAdapter.Anthropic && (
                            <span>
                              Anthropic default: https://api.anthropic.com
                              (excluding /v1/messages)
                            </span>
                          )}
                        </FormDescription>

                        <FormControl>
                          <Input
                            {...field}
                            placeholder={tAuto("default_7505d64")}
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* VertexAI Location */}
                  {currentAdapter === LLMAdapter.VertexAI && (
                    <FormField
                      control={form.control}
                      name="vertexAILocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {tAuto("location_optional_1fb67e5")}
                          </FormLabel>
                          <FormDescription>
                            {tAutoI18n(
                              "google_cloud_region_e_g_global_us_central1_europe_we_4c30297",
                            )}{" "}
                            <span className="font-bold">
                              {tAuto("global_9027cc5")}
                            </span>{" "}
                            {tAutoI18n(
                              "as_required_for_gemini_3_models_049da18",
                            )}{" "}
                          </FormDescription>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={tAuto("global_9027cc5")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* OpenAI Responses API */}
                  {currentAdapter === LLMAdapter.OpenAI && (
                    <FormField
                      control={form.control}
                      name="openAIUseResponsesApi"
                      render={({ field }) => (
                        <FormItem>
                          <span className="flex">
                            <span className="flex-1">
                              <FormLabel>
                                {tAuto("use_responses_api_5dbf5d3")}
                              </FormLabel>
                              <FormDescription>
                                {tAuto(
                                  "route_openai_requests_through_the_responses_api_inst_5a842f9",
                                )}{" "}
                              </FormDescription>
                            </span>

                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </span>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Extra Headers */}
                  {[LLMAdapter.OpenAI, LLMAdapter.Anthropic].includes(
                    currentAdapter,
                  ) && renderExtraHeadersField()}

                  {/* With default models */}
                  <FormField
                    control={form.control}
                    name="withDefaultModels"
                    render={({ field }) => (
                      <FormItem>
                        <span className="flex">
                          <span className="flex-1">
                            <FormLabel>
                              {tAuto("enable_default_models_01178ff")}
                            </FormLabel>
                            <FormDescription>
                              {tAuto(
                                "default_models_for_the_selected_adapter_will_be_avai_e327317",
                              )}{" "}
                            </FormDescription>
                          </span>

                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </span>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Custom model names */}
                  {!isCustomModelsRequired(currentAdapter) &&
                    renderCustomModelsField()}
                </div>
              )}
            </>
          )}
        </DialogBody>

        <DialogFooter>
          <div className="flex min-w-0 flex-col gap-4">
            {showOtherModelInfo ? (
              <Button
                type="button"
                className="w-full"
                onClick={() => setAdapterSelectOpen(true)}
              >
                {tAuto("select_an_adapter_b0a508b")}{" "}
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-full"
                loading={form.formState.isSubmitting}
              >
                {mode === "create"
                  ? tAutoI18n("create_connection_31751ee")
                  : tAutoI18n("save_changes_179359b")}
              </Button>
            )}
            {form.formState.errors.root && (
              <div className="max-h-32 overflow-y-auto">
                <FormMessage className="break-words wrap-anywhere">
                  {form.formState.errors.root.message}
                </FormMessage>
              </div>
            )}
          </div>
        </DialogFooter>
      </form>
    </Form>
  );
}
