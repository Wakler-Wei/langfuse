import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  HoverCardPortal,
} from "@/src/components/ui/hover-card";
import { SelectItem } from "@/src/components/ui/select";
import * as React from "react";
import { useAutoText, useAutoTranslations } from "@/src/features/i18n/I18nText";

interface PropertyHoverCardProps {
  label: string;
  description?: string;
  unit?: string;
  type?: string;
  children: React.ReactNode;
}

export const PropertyHoverCard = ({
  label,
  description,
  unit,
  type,
  children,
}: PropertyHoverCardProps) => {
  const tAuto = useAutoTranslations();
  const autoText = useAutoText();
  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardPortal>
        <HoverCardContent hideWhenDetached align="start" side="right">
          <div className="mb-1 text-sm font-bold">{autoText(label)}</div>
          {(unit || type) && (
            <div className="mb-2 flex flex-wrap gap-2 text-xs">
              {unit && (
                <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                  {tAuto("unit_da43633")} {unit}
                </span>
              )}
              {type && (
                <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                  {tAuto("type_ee3fb11")} {type}
                </span>
              )}
            </div>
          )}
          {description && (
            <p className="text-xs leading-snug">{autoText(description)}</p>
          )}
        </HoverCardContent>
      </HoverCardPortal>
    </HoverCard>
  );
};

/**
 * Generic SelectItem with a hover-card that shows documentation for a widget property
 * (view, metric, dimension).
 */
export const WidgetPropertySelectItem = ({
  value,
  label,
  description,
  unit,
  type,
  className,
}: {
  value: string;
  label: string;
  description?: string;
  unit?: string;
  type?: string;
  className?: string;
}) => {
  const autoText = useAutoText();
  return (
    <PropertyHoverCard
      label={label}
      description={description}
      unit={unit}
      type={type}
    >
      <SelectItem value={value} className={className ?? "max-w-56"}>
        {autoText(label)}
      </SelectItem>
    </PropertyHoverCard>
  );
};
