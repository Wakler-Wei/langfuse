import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { PlusIcon, Trash } from "lucide-react";
import { type UseFormReturn, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
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
import { api } from "@/src/utils/api";
import { Textarea } from "@/src/components/ui/textarea";
import {
  isBooleanDataType,
  isCategoricalDataType,
  isTextDataType,
  isNumericDataType,
} from "@/src/features/scores/lib/helpers";
import DocPopup from "@/src/components/layouts/doc-popup";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import {
  createConfigSchema,
  updateConfigSchema,
  type CreateConfig,
  type UpdateConfig,
} from "@/src/features/score-configs/lib/upsertFormTypes";
import { validateScoreConfigUpsertFormInput } from "@/src/features/score-configs/lib/validateScoreConfigUpsertFormInput";
import { ScoreConfigDataType } from "@langfuse/shared";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function UpsertScoreConfigDialog({
  projectId,
  id,
  open,
  onOpenChange,
  defaultValues,
}: {
  projectId: string;
  id?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: CreateConfig | UpdateConfig;
}) {
  const tAuto = useAutoTranslations();
  const [formError, setFormError] = useState<string | null>(null);
  const capture = usePostHogClientCapture();

  const hasAccess = useHasProjectAccess({
    projectId: projectId,
    scope: "scoreConfigs:CUD",
  });

  const utils = api.useUtils();
  const createScoreConfig = api.scoreConfigs.create.useMutation({
    onSuccess: () => utils.scoreConfigs.invalidate(),
    onError: (error) =>
      setFormError(error.message ?? "An error occurred while creating config."),
  });

  const updateScoreConfig = api.scoreConfigs.update.useMutation({
    onSuccess: () => utils.scoreConfigs.invalidate(),
    onError: (error) =>
      setFormError(error.message ?? "An error occurred while updating config."),
  });

  const form = useForm({
    resolver: zodResolver(id ? updateConfigSchema : createConfigSchema),
    defaultValues: defaultValues ?? {
      dataType: ScoreConfigDataType.NUMERIC,
      minValue: undefined,
      maxValue: undefined,
      name: "",
    },
  }) as UseFormReturn<CreateConfig | UpdateConfig>;

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "categories",
  });

  if (!hasAccess) return null;

  async function onSubmit(values: CreateConfig | UpdateConfig) {
    const error = validateScoreConfigUpsertFormInput(values);
    setFormError(error);
    const isValid = await form.trigger();
    if (!isValid || error) return;

    if (!!id) {
      return updateScoreConfig
        .mutateAsync({
          ...values,
          projectId,
          id: id as string,
          description: values.description ?? null,
          categories: values.categories?.length ? values.categories : undefined,
        })
        .then(() => {
          capture("score_configs:update_form_submit", {
            dataType: values.dataType,
          });
          form.reset();
          onOpenChange(false);
        });
    }
    return createScoreConfig
      .mutateAsync({
        projectId,
        ...values,
        description: values.description ?? null,
        categories: values.categories?.length ? values.categories : undefined,
      })
      .then(() => {
        capture("score_configs:create_form_submit", {
          dataType: values.dataType,
        });
        form.reset();
        onOpenChange(false);
      });
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          form.reset();
          setFormError(null);
          onOpenChange(v);
        }}
      >
        <DialogTrigger asChild>
          <Button variant="secondary" loading={createScoreConfig.isPending}>
            <PlusIcon className="mr-1.5 -ml-0.5 h-4 w-4" aria-hidden="true" />
            {id
              ? tAuto("update_score_config_07e854f")
              : tAuto("add_new_score_config_c32402c")}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {id
                ? tAuto("update_score_config_07e854f")
                : tAuto("add_new_score_config_c32402c")}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <DialogBody>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tAuto("name_709a232")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          onBlur={(e) =>
                            field.onChange(e.target.value.trimEnd())
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tAuto("data_type_ee503fe")}</FormLabel>
                      <Select
                        disabled={!!id}
                        defaultValue={field.value}
                        onValueChange={(value) => {
                          const dt = value as ScoreConfigDataType;
                          field.onChange(dt);
                          form.clearErrors();
                          if (isNumericDataType(dt)) {
                            form.setValue("categories", undefined);
                          } else if (isTextDataType(dt)) {
                            form.setValue("categories", undefined);
                            form.setValue("minValue", undefined);
                            form.setValue("maxValue", undefined);
                          } else {
                            form.setValue("minValue", undefined);
                            form.setValue("maxValue", undefined);
                            if (isBooleanDataType(dt)) {
                              replace([
                                { label: tAuto("true_88b33e4"), value: 1 },
                                { label: tAuto("false_97cdbdc"), value: 0 },
                              ]);
                            } else {
                              replace([{ label: "", value: 0 }]);
                            }
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={tAuto("select_a_data_type_15e128e")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ScoreConfigDataType).map(
                            (dataType) => (
                              <SelectItem value={dataType} key={dataType}>
                                {dataType}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isNumericDataType(form.getValues("dataType")) ? (
                  <>
                    <FormField
                      control={form.control}
                      name="minValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {tAuto("minimum_optional_d367e6f")}{" "}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              // manually manage controlled input state
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(
                                  value === "" ? undefined : Number(value),
                                );
                              }}
                              type="number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {tAuto("maximum_optional_a51cf4f")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              // manually manage controlled input state
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(
                                  value === "" ? undefined : Number(value),
                                );
                              }}
                              type="number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : isTextDataType(form.getValues("dataType")) ? null : (
                  <div className="grid grid-flow-row gap-2">
                    <FormField
                      control={form.control}
                      name="categories"
                      render={() => (
                        <>
                          {fields.length > 0 && (
                            <div className="mb-2 grid grid-cols-[1fr_3fr] items-center gap-2 text-left sm:grid-cols-[1fr_7fr]">
                              <FormLabel className="grid grid-flow-col">
                                {tAuto("value_8dce170")}{" "}
                                <DocPopup
                                  description={tAuto(
                                    "this_is_how_the_value0_label_is_mapped_to_an_integer_38f8a15",
                                    {
                                      value0: isCategoricalDataType(
                                        form.getValues("dataType"),
                                      )
                                        ? "category"
                                        : "boolean",
                                    },
                                  )}
                                />
                              </FormLabel>
                              <FormLabel>{tAuto("label_74341e3")}</FormLabel>
                            </div>
                          )}
                          {fields.map((category, index) => (
                            <div
                              key={`${category.id}-langfuseObject`}
                              className="mb-2 grid grid-cols-[1fr_3fr] gap-2 text-left sm:grid-cols-[1fr_7fr]"
                            >
                              <FormField
                                control={form.control}
                                name={`categories.${index}.value`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        readOnly
                                        disabled
                                        inputMode="numeric"
                                        className="text-center"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="grid grid-cols-[1fr_auto] gap-2">
                                <FormField
                                  control={form.control}
                                  name={`categories.${index}.label`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          type="text"
                                          onBlur={(e) =>
                                            field.onChange(
                                              e.target.value.trimEnd(),
                                            )
                                          }
                                          readOnly={isBooleanDataType(
                                            form.getValues("dataType"),
                                          )}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                {isCategoricalDataType(
                                  form.getValues("dataType"),
                                ) && (
                                  <Button
                                    onClick={() => remove(index)}
                                    variant="outline"
                                    size="icon"
                                    disabled={
                                      index === 0 || index !== fields.length - 1
                                    }
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                          {isCategoricalDataType(
                            form.getValues("dataType"),
                          ) && (
                            <div className="grid">
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={
                                  isBooleanDataType(
                                    form.getValues("dataType"),
                                  ) && fields.length === 2
                                }
                                onClick={() =>
                                  append({
                                    label: "",
                                    value:
                                      fields.length > 0
                                        ? fields.reduce(
                                            (max, f) => Math.max(max, f.value),
                                            0,
                                          ) + 1
                                        : 0,
                                  })
                                }
                              >
                                {tAuto("add_category_d169b7f")}{" "}
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    />
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <>
                      <FormItem>
                        <FormLabel>
                          {tAuto("description_optional_388de6f")}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={tAuto(
                              "provide_an_optional_description_of_the_score_config_6e89c8f",
                            )}
                            value={field.value ?? undefined}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </>
                  )}
                />
              </DialogBody>
              <DialogFooter>
                <div className="flex w-full flex-col items-end gap-4">
                  {formError ? (
                    <p className="w-full text-center">
                      <span className="font-bold">
                        {tAuto("error_787aa16")}
                      </span>{" "}
                      {formError}
                    </p>
                  ) : null}
                  <Button
                    type="submit"
                    loading={
                      createScoreConfig.isPending || updateScoreConfig.isPending
                    }
                  >
                    {tAuto("submit_2dacf65")}{" "}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
