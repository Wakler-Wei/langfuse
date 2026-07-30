import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { Settings2, Check } from "lucide-react";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type ExperimentDisplaySettingsProps = {
  layout: "grid" | "list";
  onLayoutChange: (layout: "grid" | "list") => void;
  itemVisibility: "baseline-only" | "all";
  onItemVisibilityChange: (visibility: "baseline-only" | "all") => void;
  hasComparisons: boolean;
  hasBaseline: boolean;
};

export function ExperimentDisplaySettings({
  layout,
  onLayoutChange,
  itemVisibility,
  onItemVisibilityChange,
  hasComparisons,
  hasBaseline,
}: ExperimentDisplaySettingsProps) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const isItemVisibilityDisabled = !hasComparisons || !hasBaseline;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Settings2 className="h-4 w-4" />
          <span className="ml-2 hidden md:inline">
            {tAuto("display_574ff9b")}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{tAuto("layout_972ad8d")}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onLayoutChange("grid")}>
          {layout === "grid" && <Check className="mr-2 h-4 w-4" />}
          {layout !== "grid" && <span className="mr-2 h-4 w-4" />}
          {tAutoI18n("grid_701c483")}{" "}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onLayoutChange("list")}>
          {layout === "list" && <Check className="mr-2 h-4 w-4" />}
          {layout !== "list" && <span className="mr-2 h-4 w-4" />}
          {tAutoI18n("list_a1fffaa")}{" "}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>
          {tAuto("item_visibility_2612fd7")}
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => onItemVisibilityChange("baseline-only")}
          disabled={isItemVisibilityDisabled}
        >
          {itemVisibility === "baseline-only" && (
            <Check className="mr-2 h-4 w-4" />
          )}
          {itemVisibility !== "baseline-only" && (
            <span className="mr-2 h-4 w-4" />
          )}
          {tAutoI18n("show_only_items_in_baseline_b507985")}{" "}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onItemVisibilityChange("all")}
          disabled={isItemVisibilityDisabled}
        >
          {itemVisibility === "all" && <Check className="mr-2 h-4 w-4" />}
          {itemVisibility !== "all" && <span className="mr-2 h-4 w-4" />}
          {tAutoI18n("show_all_items_737b95f")}{" "}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
