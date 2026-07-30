import { Button } from "@/src/components/ui/button";
import { FormDescription } from "@/src/components/ui/form";
import type { UseFormReturn } from "react-hook-form";
import type { FormUpsertModel } from "../../validation";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type TierPrefillButtonsProps = {
  tierIndex: number;
  form: UseFormReturn<FormUpsertModel>;
};

export type { TierPrefillButtonsProps };

export function TierPrefillButtons({
  tierIndex,
  form,
}: TierPrefillButtonsProps) {
  const tAuto = useAutoTranslations();
  const prices = form.watch(`pricingTiers.${tierIndex}.prices`) || {};

  return (
    <div className="space-y-2">
      <FormDescription>
        {tAuto("prefill_usage_types_from_template_5b4dc06")}
      </FormDescription>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            form.setValue(`pricingTiers.${tierIndex}.prices`, {
              input: 0,
              output: 0,
              input_cached_tokens: 0,
              output_reasoning_tokens: 0,
              ...prices,
            });
          }}
        >
          OpenAI
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            form.setValue(`pricingTiers.${tierIndex}.prices`, {
              input: 0,
              input_tokens: 0,
              output: 0,
              output_tokens: 0,
              cache_creation_input_tokens: 0,
              cache_read_input_tokens: 0,
              input_cache_creation_5m: 0,
              input_cache_creation_1h: 0,
              ...prices,
            });
          }}
        >
          {tAuto("anthropic_b780a23")}{" "}
        </Button>
      </div>
    </div>
  );
}
