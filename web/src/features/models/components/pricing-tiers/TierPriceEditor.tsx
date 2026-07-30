import { MinusCircle, PlusCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { FormLabel } from "@/src/components/ui/form";
import { PricePreview } from "../PricePreview";
import type { UseFormReturn } from "react-hook-form";
import type { FormUpsertModel } from "../../validation";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type TierPriceEditorProps = {
  tierIndex: number;
  form: UseFormReturn<FormUpsertModel>;
  isDefault: boolean;
};

export type { TierPriceEditorProps };

export function TierPriceEditor({
  tierIndex,
  form,
  isDefault,
}: TierPriceEditorProps) {
  const tAuto = useAutoTranslations();
  const prices = form.watch(`pricingTiers.${tierIndex}.prices`) || {};

  return (
    <div className="space-y-3">
      <FormLabel>{tAuto("prices_3f6ef31")}</FormLabel>
      <div className="text-muted-foreground grid grid-cols-2 gap-1 text-sm">
        <span>{tAuto("usage_type_0193f09")}</span>
        <span>{tAuto("price_3e8248e")}</span>
      </div>
      {Object.entries(prices).map(([key, value], index) => (
        <div key={index} className="grid grid-cols-2 gap-1">
          <Input
            placeholder={tAuto("key_e_g_input_output_bb269d9")}
            value={key}
            disabled={!isDefault}
            onChange={(e) => {
              const newKey = e.target.value;

              // Prevent overwriting existing keys (unless it's the same key)
              if (newKey !== key && prices[newKey] !== undefined) {
                return; // Don't allow the change
              }

              const newPrices = { ...prices };
              const oldValue = newPrices[key];
              delete newPrices[key];
              newPrices[newKey] = oldValue;
              form.setValue(`pricingTiers.${tierIndex}.prices`, newPrices);
            }}
            className={!isDefault ? "bg-muted cursor-not-allowed" : ""}
          />
          <div className="flex gap-1">
            <Input
              type="number"
              placeholder={tAuto("price_per_unit_be7611b")}
              value={value as number}
              step="0.000001"
              onChange={(e) => {
                form.setValue(`pricingTiers.${tierIndex}.prices`, {
                  ...prices,
                  [key]: parseFloat(e.target.value),
                });
              }}
            />
            {isDefault && (
              <Button
                type="button"
                variant="outline"
                title={tAuto("remove_price_c79563e")}
                size="icon"
                onClick={() => {
                  const newPrices = { ...prices };
                  delete newPrices[key];
                  form.setValue(`pricingTiers.${tierIndex}.prices`, newPrices);
                }}
              >
                <MinusCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
      {isDefault && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            // Generate unique key name
            let counter = 1;
            let newKey = "new_usage_type";
            while (prices[newKey] !== undefined) {
              newKey = `new_usage_type_${counter}`;
              counter++;
            }
            form.setValue(`pricingTiers.${tierIndex}.prices`, {
              ...prices,
              [newKey]: 0.000001,
            });
          }}
          className="flex items-center gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          <span>{tAuto("add_price_9b803f9")}</span>
        </Button>
      )}
      <PricePreview prices={prices} />
    </div>
  );
}
