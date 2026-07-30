import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { useMemo } from "react";
import { usePriceUnitMultiplier } from "@/src/features/models/hooks/usePriceUnitMultiplier";
import Decimal from "decimal.js";
import { getMaxDecimals } from "@/src/features/models/utils";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type MatchedTierCardProps = {
  tier: {
    id: string;
    name: string;
    priority: number;
    isDefault: boolean;
    prices: Record<string, number>;
  };
};

export type { MatchedTierCardProps };

export function MatchedTierCard({ tier }: MatchedTierCardProps) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const { priceUnit, priceUnitMultiplier } = usePriceUnitMultiplier();

  const maxDecimals = useMemo(
    () =>
      Math.max(
        ...Object.values(tier.prices).map((price) =>
          getMaxDecimals(price, priceUnitMultiplier),
        ),
      ),
    [tier.prices, priceUnitMultiplier],
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
          {tAuto("matched_pricing_tier_3afc5e7")}{" "}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold">{tier.name}</span>
          {tier.isDefault && (
            <Badge variant="secondary" className="text-xs">
              {tAuto("default_808d7dc")}{" "}
            </Badge>
          )}
          <span className="text-muted-foreground text-xs">
            {tAutoI18n("priority_01eb224")} {tier.priority}
          </span>
        </div>

        <div>
          <div className="text-muted-foreground mb-2 text-xs font-bold">
            {tAutoI18n("prices_per_1a85c5c")} {priceUnit}):
          </div>
          <div className="space-y-1.5">
            {Object.entries(tier.prices).map(([usageType, price]) => (
              <div
                key={usageType}
                className="bg-muted/50 flex items-center justify-between rounded px-3 py-1.5"
              >
                <span className="text-muted-foreground font-mono text-xs">
                  {usageType}:
                </span>
                <span className="font-mono text-sm font-bold">
                  $
                  {new Decimal(price)
                    .mul(priceUnitMultiplier)
                    .toFixed(maxDecimals)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
