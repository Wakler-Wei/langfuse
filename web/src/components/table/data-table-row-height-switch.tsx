import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/src/components/ui/dropdown-menu";
import useLocalStorage from "@/src/components/useLocalStorage";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { Rows3, Rows2, Rows4 } from "lucide-react";
import {
  type AutoMessageKey,
  useAutoTranslations,
} from "@/src/features/i18n/I18nText";

const heightOptions = [
  { id: "s", labelKey: "small_c74fd97", icon: <Rows4 /> },
  { id: "m", labelKey: "medium_d404968", icon: <Rows3 /> },
  { id: "l", labelKey: "large_738fd1d", icon: <Rows2 /> },
] as const;

type HeightOption = (typeof heightOptions)[number] & {
  labelKey: AutoMessageKey;
};

const defaultHeights: Record<RowHeight, string> = {
  s: "h-7", // after removing the container around IO, we want the row height a bit more than 6
  m: "h-24",
  l: "h-64",
};

export type RowHeight = (typeof heightOptions)[number]["id"];
export type CustomHeights = Record<RowHeight, string>;

export const getRowHeightTailwindClass = (
  rowHeight?: RowHeight,
  customHeights?: CustomHeights,
) => {
  if (!rowHeight) return undefined;
  return customHeights?.[rowHeight] || defaultHeights[rowHeight];
};

export function useRowHeightLocalStorage(
  tableName: string,
  defaultValue: RowHeight,
) {
  const [rowHeight, setRowHeight, clearRowHeight] = useLocalStorage<RowHeight>(
    `${tableName}Height`,
    defaultValue,
  );

  return [rowHeight, setRowHeight, clearRowHeight] as const;
}

export const DataTableRowHeightSwitch = ({
  rowHeight,
  setRowHeight,
}: {
  rowHeight: RowHeight;
  setRowHeight: (e: RowHeight) => void;
}) => {
  const tAuto = useAutoTranslations();
  const capture = usePostHogClientCapture();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          title={tAuto("row_height_0c1073d")}
        >
          <Rows3 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent>
          <DropdownMenuLabel>{tAuto("row_height_0c1073d")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(heightOptions as readonly HeightOption[]).map(
            ({ id, labelKey }) => (
              <DropdownMenuCheckboxItem
                key={id}
                checked={rowHeight === id}
                onClick={(e) => {
                  // Prevent closing the dropdown menu to allow the user to adjust their selection
                  e.preventDefault();
                  capture("table:row_height_switch_select", {
                    rowHeight: id,
                  });
                  setRowHeight(id);
                }}
              >
                {tAuto(labelKey)}
              </DropdownMenuCheckboxItem>
            ),
          )}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
};
