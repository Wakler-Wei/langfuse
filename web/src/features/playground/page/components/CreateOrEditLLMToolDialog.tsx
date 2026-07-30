import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight } from "lucide-react";
import * as z from "zod";

import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
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
import { Textarea } from "@/src/components/ui/textarea";
import { LLMToolNameSchema } from "@/src/features/llm-tools/validation";
import { api } from "@/src/utils/api";

import { CodeMirrorEditor } from "@/src/components/editor";
import { JSONSchemaFormSchema, type LlmTool } from "@langfuse/shared";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

const formSchema = z.object({
  name: LLMToolNameSchema,
  description: z.string().min(1, "Description is required"),
  parameters: JSONSchemaFormSchema,
});

type FormValues = z.infer<typeof formSchema>;

type CreateOrEditLLMToolDialog = {
  children: React.ReactNode;
  projectId: string;
  onSave: (llmTool: LlmTool) => void;
  onDelete?: (llmTool: LlmTool) => void;
  existingLlmTool?: LlmTool;
  defaultValues?: {
    name: string;
    description: string;
    parameters: string;
  };
};

export const CreateOrEditLLMToolDialog: React.FC<CreateOrEditLLMToolDialog> = (
  props,
) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const { children, projectId, onSave, existingLlmTool } = props;

  const utils = api.useUtils();
  const createLlmTool = api.llmTools.create.useMutation();
  const updateLlmTool = api.llmTools.update.useMutation();
  const deleteLlmTool = api.llmTools.delete.useMutation();

  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: props.defaultValues ?? {
      name: "",
      description: "",
      parameters: JSON.stringify(
        {
          type: "object",
          properties: {},
          required: [],
          additionalProperties: false,
        },
        null,
        2,
      ),
    },
  });

  // Populate form when in edit mode
  useEffect(() => {
    if (existingLlmTool && !props.defaultValues) {
      form.reset({
        name: existingLlmTool.name,
        description: existingLlmTool.description,
        parameters: JSON.stringify(existingLlmTool.parameters, null, 2),
      });
    }
  }, [existingLlmTool, form, props.defaultValues]);

  async function onSubmit(values: FormValues) {
    let result;
    if (existingLlmTool) {
      result = await updateLlmTool.mutateAsync({
        id: existingLlmTool.id,
        projectId,
        name: values.name,
        description: values.description,
        parameters: JSON.parse(values.parameters),
      });
    } else {
      result = await createLlmTool.mutateAsync({
        projectId,
        name: values.name,
        description: values.description,
        parameters: JSON.parse(values.parameters),
      });
    }

    await utils.llmTools.getAll.invalidate({ projectId });

    onSave(result);
    setOpen(false);
  }

  async function handleDelete() {
    if (!existingLlmTool) return;

    await deleteLlmTool.mutateAsync({
      id: existingLlmTool.id,
      projectId,
    });

    props.onDelete?.(existingLlmTool);

    await utils.llmTools.getAll.invalidate({ projectId });
    setOpen(false);
  }

  const prettifyJson = () => {
    try {
      const currentValue = form.getValues("parameters");
      const parsedJson = JSON.parse(currentValue);
      const prettified = JSON.stringify(parsedJson, null, 2);
      form.setValue("parameters", prettified);
    } catch {
      showErrorToast(
        tAutoI18n("failed_to_prettify_json_074c7e8"),
        tAutoI18n("please_verify_your_input_is_valid_json_fe436a3"),
        "WARNING",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </DialogTrigger>
      <DialogContent
        className="flex flex-col sm:min-w-128 md:min-w-160"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>
            {existingLlmTool
              ? tAutoI18n("edit_llm_tool_3133887")
              : tAutoI18n("create_llm_tool_bb5c445")}
          </DialogTitle>
          <DialogDescription>
            {tAuto("define_a_tool_for_llm_function_calling_9472f9d")}{" "}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid max-h-full min-h-0 overflow-hidden"
          >
            <DialogBody>
              <div className="flex-1 space-y-4 overflow-y-auto">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tAuto("name_709a232")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={tAuto("e_g_get_weather_e40c6e4")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tAuto("description_55f8ebc")}</FormLabel>
                      <FormDescription>
                        This description will be sent to the LLM to help it
                        understand the tool&apos;s purpose and functionality.
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder={tAuto(
                            "describe_the_tool_s_purpose_and_usage_c0f0505",
                          )}
                          className="max-h-[120px] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          {...field}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parameters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {tAuto("parameters_json_schema_2ad0657")}
                      </FormLabel>
                      <FormDescription>
                        {tAutoI18n(
                          "define_the_structure_of_your_tool_parameters_using_j_fc4b026",
                        )}{" "}
                        <a
                          href="https://json-schema.org/learn/miscellaneous-examples"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center"
                        >
                          {tAuto("see_json_schema_examples_here_69bdb1d")}{" "}
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      </FormDescription>
                      <FormControl>
                        <div className="relative flex flex-col gap-1">
                          <CodeMirrorEditor
                            value={field.value}
                            onChange={field.onChange}
                            mode="json"
                            minHeight={200}
                            className="max-h-[25vh]"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={prettifyJson}
                            className="absolute top-3 right-3 text-xs"
                          >
                            {tAuto("prettify_1a7e7a5")}{" "}
                          </Button>
                        </div>
                      </FormControl>
                      <p className="text-muted-foreground text-xs">
                        {tAuto(
                          "parameters_must_be_a_valid_json_schema_object_5291d5b",
                        )}{" "}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </DialogBody>

            <DialogFooter className="bg-modal sticky bottom-0 mt-4 flex flex-col gap-2 border-t pt-4">
              <div className="flex w-full flex-col gap-2">
                <p className="text-muted-foreground text-xs">
                  {tAuto(
                    "note_changes_to_tools_are_reflected_to_all_members_o_8f34939",
                  )}{" "}
                </p>
                <div className="flex items-center justify-between gap-2">
                  {existingLlmTool && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      className="mr-auto"
                    >
                      {tAuto("delete_f6fdbe4")}{" "}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    {tAuto("cancel_77dfd21")}{" "}
                  </Button>
                  <Button type="submit">{tAuto("save_efc007a")}</Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
