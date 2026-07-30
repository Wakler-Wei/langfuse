import { type MultiSelect } from "@/src/components/table/data-table-toolbar";
import { Button } from "@/src/components/ui/button";
import { numberFormatter } from "@/src/utils/numbers";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function DataTableSelectAllBanner({
  selectAll,
  setSelectAll,
  setRowSelection,
  pageSize,
  totalCount,
  approximateCount,
}: MultiSelect) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : null;
  // Hide the precise number when the row count is not the affected-entity count.
  const exactCount = approximateCount ? null : totalCount;

  return (
    <div className="bg-light-blue/40 dark:bg-light-blue/50 @container mb-2 flex flex-wrap items-center justify-center gap-2 rounded-sm p-2">
      {selectAll ? (
        <span className="text-sm">
          {tAutoI18n("all_6a72085")}{" "}
          <span className="font-bold">
            {exactCount === null
              ? tAutoI18n("matching_5ed085d")
              : numberFormatter(exactCount, 0)}
          </span>{" "}
          {tAutoI18n("items_are_selected_2f88193")}{" "}
          <Button
            variant="ghost"
            className="text-accent-dark-blue hover:text-accent-dark-blue/80 h-auto p-0 font-bold"
            onClick={() => {
              setSelectAll(false);
              setRowSelection({});
            }}
          >
            {tAuto("clear_selection_247fd63")}{" "}
          </Button>
        </span>
      ) : (
        <span className="text-sm">
          {tAutoI18n("all_6a72085")}{" "}
          <span className="font-bold">{numberFormatter(pageSize, 0)}</span>{" "}
          {tAutoI18n("items_on_this_page_are_selected_af9908c")}{" "}
          <Button
            variant="ghost"
            className="text-accent-dark-blue hover:text-accent-dark-blue/80 h-auto p-0 font-bold"
            onClick={() => {
              setSelectAll(true);
            }}
          >
            {exactCount === null || totalPages === null
              ? tAutoI18n("select_all_matching_items_c0146cb")
              : tAutoI18n(
                  "select_all_value0_items_across_value1_pages_9ddb660",
                  {
                    value0: String(
                      (numberFormatter(exactCount, 0) as unknown) ?? "",
                    ),
                    value1: String(
                      (numberFormatter(totalPages, 0) as unknown) ?? "",
                    ),
                  },
                )}
          </Button>
        </span>
      )}
    </div>
  );
}
