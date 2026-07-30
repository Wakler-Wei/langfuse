import React from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import DiffViewer from "@/src/components/DiffViewer";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type CorrectedOutputDiffDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  actualOutput?: unknown;
  correctedOutput: string;
  strictJsonMode: boolean;
  /**
   * True when the original output exists but was too large to load into the
   * view (gated). Distinguishes "too large to diff" from "no output at all".
   */
  actualOutputTooLarge?: boolean;
};

/**
 * Formats output for diff display
 * @param output - The output to format
 * @param strictJsonMode - Whether to enforce JSON formatting
 * @returns Formatted string for display
 */
const formatOutputForDiff = (
  output: unknown,
  strictJsonMode: boolean,
): string => {
  if (output === null || output === undefined) {
    return "";
  }

  // If strict JSON mode, try to format as JSON
  if (strictJsonMode) {
    try {
      // If it's already a string, try to parse it first
      if (typeof output === "string") {
        const parsed = JSON.parse(output);
        return JSON.stringify(parsed, null, 2);
      }
      // Otherwise just stringify the object
      return JSON.stringify(output, null, 2);
    } catch {
      // If JSON formatting fails, fall back to string representation
      return typeof output === "string" ? output : JSON.stringify(output);
    }
  }

  // Non-strict mode: convert to string
  return typeof output === "string" ? output : JSON.stringify(output, null, 2);
};

export const CorrectedOutputDiffDialog: React.FC<
  CorrectedOutputDiffDialogProps
> = ({
  isOpen,
  setIsOpen,
  actualOutput,
  correctedOutput,
  strictJsonMode,
  actualOutputTooLarge = false,
}) => {
  const tAuto = useAutoTranslations();
  // Format both outputs for comparison
  const formattedActualOutput = formatOutputForDiff(
    actualOutput,
    strictJsonMode,
  );
  const formattedCorrectedOutput = formatOutputForDiff(
    correctedOutput,
    strictJsonMode,
  );

  // Check if there's no original output to compare. When the output exists but
  // was too large to load into the view, we cannot diff it — but that is not
  // the same as there being no original output.
  const hasNoOriginalOutput =
    !actualOutputTooLarge &&
    (actualOutput === null || actualOutput === undefined);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>{tAuto("output_correction_diff_d373e32")}</DialogTitle>
          <DialogDescription>
            {tAuto(
              "compare_the_original_output_with_the_corrected_versi_279f31c",
            )}{" "}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {actualOutputTooLarge ? (
            <div className="space-y-4">
              <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
                <p className="text-foreground font-bold">
                  {tAuto("original_output_too_large_to_diff_0ef19fb")}{" "}
                </p>
                <p className="mt-1">
                  {tAuto(
                    "the_original_output_is_too_large_to_load_here_so_it__857024b",
                  )}{" "}
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm font-bold">
                  {tAuto("corrected_output_281b898")}
                </p>
                <pre className="bg-muted/30 max-h-[50vh] overflow-auto rounded-md border p-3 text-xs break-words whitespace-pre-wrap">
                  {formattedCorrectedOutput}
                </pre>
              </div>
            </div>
          ) : hasNoOriginalOutput ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="text-muted-foreground">
                <p className="text-lg font-bold">
                  {tAuto("no_original_output_5c46df5")}
                </p>
                <p className="mt-2 text-sm">
                  {tAuto(
                    "there_is_no_original_output_to_compare_with_the_corr_4e7b5b9",
                  )}{" "}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <DiffViewer
                oldString={formattedActualOutput}
                newString={formattedCorrectedOutput}
                oldLabel="Original Output"
                newLabel="Corrected Output"
              />
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button onClick={() => setIsOpen(false)}>
            {tAuto("close_bbfa773")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
