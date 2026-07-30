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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { LLMSchemaNameSchema } from "@/src/features/llm-schemas/validation";
import { api } from "@/src/utils/api";

import { JSONSchemaFormSchema, type LlmSchema } from "@langfuse/shared";
import { CodeMirrorEditor } from "@/src/components/editor";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

const formSchema = z.object({
  name: LLMSchemaNameSchema,
  description: z.string().min(1, "Description is required"),
  schema: JSONSchemaFormSchema,
});

type FormValues = z.infer<typeof formSchema>;

type CreateOrEditLLMSchemaDialog = {
  children: React.ReactNode;
  projectId: string;
  onSave: (llmSchema: LlmSchema) => void;
  onDelete?: (llmSchema: LlmSchema) => void;
  existingLlmSchema?: LlmSchema;
  defaultValues?: {
    name: string;
    description: string;
    schema: string;
  };
};

export const CreateOrEditLLMSchemaDialog: React.FC<
  CreateOrEditLLMSchemaDialog
> = (props) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const { children, projectId, onSave, existingLlmSchema } = props;

  const utils = api.useUtils();
  const createLlmSchema = api.llmSchemas.create.useMutation();
  const updateLlmSchema = api.llmSchemas.update.useMutation();
  const deleteLlmSchema = api.llmSchemas.delete.useMutation();

  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: props.defaultValues ?? {
      name: "",
      description: "",
      schema: JSON.stringify(
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
    if (existingLlmSchema && !props.defaultValues) {
      form.reset({
        name: existingLlmSchema.name,
        description: existingLlmSchema.description,
        schema: JSON.stringify(existingLlmSchema.schema, null, 2),
      });
    }
  }, [existingLlmSchema, form, props.defaultValues]);

  async function onSubmit(values: FormValues) {
    let result;
    if (existingLlmSchema) {
      result = await updateLlmSchema.mutateAsync({
        id: existingLlmSchema.id,
        projectId,
        name: values.name,
        description: values.description,
        schema: JSON.parse(values.schema),
      });
    } else {
      result = await createLlmSchema.mutateAsync({
        projectId,
        name: values.name,
        description: values.description,
        schema: JSON.parse(values.schema),
      });
    }

    await utils.llmSchemas.getAll.invalidate({ projectId });

    onSave(result);
    setOpen(false);
  }

  async function handleDelete() {
    if (!existingLlmSchema) return;

    await deleteLlmSchema.mutateAsync({
      id: existingLlmSchema.id,
      projectId,
    });

    props.onDelete?.(existingLlmSchema);

    await utils.llmSchemas.getAll.invalidate({ projectId });
    setOpen(false);
  }

  const prettifyJson = () => {
    try {
      const currentValue = form.getValues("schema");
      const parsedJson = JSON.parse(currentValue);
      const prettified = JSON.stringify(parsedJson, null, 2);
      form.setValue("schema", prettified);
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
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex flex-col sm:min-w-128 md:min-w-160">
        <DialogHeader>
          <DialogTitle>
            {existingLlmSchema
              ? tAutoI18n("edit_llm_schema_e549849")
              : tAutoI18n("create_llm_schema_22c7e56")}
          </DialogTitle>
          <DialogDescription>
            {tAuto("define_a_json_schema_for_structured_outputs_ff32f47")}{" "}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();

              form.handleSubmit(onSubmit)();
            }}
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
                      <FormControl>
                        <Textarea
                          placeholder={tAuto("describe_the_schema_3f8d9b9")}
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
                  name="schema"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tAuto("json_schema_1a5fdc0")}</FormLabel>
                      <FormDescription>
                        {tAutoI18n(
                          "define_the_structure_of_your_schema_using_json_schem_51f636d",
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
                    "note_changes_to_schemas_are_reflected_to_all_members_4634eeb",
                  )}{" "}
                </p>
                <div className="flex items-center justify-between gap-2">
                  {existingLlmSchema && (
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
