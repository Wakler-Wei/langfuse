import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { type ExperimentDetailsStepProps } from "@/src/features/experiments/types/stepProps";
import { StepHeader } from "@/src/features/experiments/components/shared/StepHeader";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const ExperimentDetailsStep: React.FC<ExperimentDetailsStepProps> = ({
  formState,
}) => {
  const tAuto = useAutoTranslations();
  const { form } = formState;
  return (
    <div className="space-y-6">
      <StepHeader
        title={tAuto("experiment_run_details_52da234")}
        description={tAuto(
          "provide_a_name_and_optional_description_for_your_exp_f770c19",
        )}
      />

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tAuto("experiment_name_aa4c0bb")}</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={tAuto("enter_experiment_name_0c62acb")}
                className="w-full"
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
            <FormLabel>{tAuto("description_optional_388de6f")}</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder={tAuto(
                  "describe_the_purpose_or_context_of_this_experiment_0fa0352",
                )}
                className="min-h-[100px] w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
