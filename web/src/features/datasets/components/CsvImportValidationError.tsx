import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";
import { type BulkDatasetItemValidationError } from "@langfuse/shared";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type CsvImportValidationErrorProps = {
  errors: BulkDatasetItemValidationError[];
};

export const CsvImportValidationError: React.FC<
  CsvImportValidationErrorProps
> = ({ errors }) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const [isExpanded, setIsExpanded] = useState(false);

  const errorCount = errors.length;
  const hasMoreThan10 = errorCount >= 10; // Backend might limit errors

  return (
    <Alert variant="destructive" className="mt-4">
      <AlertTitle className="text-base font-bold">
        {tAuto("schema_validation_failed_7986e4d")}{" "}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm">
          {hasMoreThan10
            ? tAutoI18n(
                "value0_items_failed_validation_showing_first_value1__ce363ed",
                { value0: String(errorCount), value1: String(errorCount) },
              )
            : tAutoI18n("value0_item_value1_failed_validation_8bd56d7", {
                value0: String(errorCount),
                value1: errorCount === 1 ? "" : "s",
              })}
        </p>
        <p className="text-muted-foreground text-sm">
          {tAuto(
            "the_csv_data_does_not_match_the_required_schema_for__df66028",
          )}{" "}
        </p>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-auto p-0 text-sm font-bold hover:bg-transparent"
        >
          {isExpanded ? (
            <ChevronDown className="mr-1 h-4 w-4" />
          ) : (
            <ChevronRight className="mr-1 h-4 w-4" />
          )}
          {isExpanded ? tAutoI18n("hide_34d8b60") : tAutoI18n("show_d97d1ee")}{" "}
          {tAutoI18n("error_details_753d1c9")}{" "}
        </Button>

        {isExpanded && (
          <div className="border-destructive/20 bg-destructive/5 mt-3 max-h-[400px] space-y-3 overflow-y-auto rounded-md border p-3">
            {errors.map((error, idx) => (
              <div
                key={`${error.itemIndex}-${error.field}`}
                className="border-destructive/10 space-y-1 border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-mono text-xs">
                    #{idx + 1}
                  </span>
                  <span className="text-sm font-bold">
                    {tAutoI18n("csv_row_20fbed6")} {error.itemIndex + 2}:{" "}
                    {error.field === "input"
                      ? tAutoI18n("input_b568d47")
                      : error.field === "metadata"
                        ? tAutoI18n("metadata_251edc0")
                        : tAutoI18n("expected_output_395c41e")}
                  </span>
                </div>

                <ul className="ml-6 space-y-1 text-sm">
                  {error.errors.map((err, errIdx) => (
                    <li key={errIdx} className="text-destructive">
                      {err.path !== "/" && (
                        <span className="text-muted-foreground font-mono text-xs">
                          {err.path}:{" "}
                        </span>
                      )}
                      {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {hasMoreThan10 && (
              <p className="text-muted-foreground pt-2 text-xs">
                {tAuto(
                  "fix_these_errors_to_see_if_there_are_additional_vali_fb17381",
                )}{" "}
              </p>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};
