import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { z } from "zod";
import { parseCsvClient } from "@/src/features/datasets/lib/csv/helpers";
import { DialogBody } from "@/src/components/ui/dialog";
import { Dropzone } from "@/src/components/design-system/Dropzone/Dropzone";
import type { CsvPreviewResult } from "@/src/features/datasets/lib/csv/types";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const MAX_FILE_SIZE_BYTES = 1024 * 1024 * 1 * 10; // 10MB
const ACCEPTED_FILE_TYPES = ["text/csv"] as const;

const FileSchema = z.object({
  type: z.enum([...ACCEPTED_FILE_TYPES]),
  size: z.number().min(1),
});

export const UploadDatasetCsv = ({
  setPreview,
  setCsvFile,
}: {
  setPreview: (preview: CsvPreviewResult | null) => void;
  setCsvFile: (file: File | null) => void;
}) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    const result = FileSchema.safeParse(file);
    if (!result.success) {
      showErrorToast(
        tAutoI18n("invalid_file_type_56f848f"),
        tAutoI18n("please_select_a_valid_csv_file_702d3f4"),
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      showErrorToast(
        tAutoI18n("file_too_large_a0704a4"),
        tAutoI18n("maximum_file_size_is_10mb_569e902"),
      );
      return;
    }

    try {
      setCsvFile(file);
      const preview = await parseCsvClient(file, {
        isPreview: true,
        collectSamples: true,
      });

      if (!Boolean(preview.columns.length)) {
        showErrorToast(
          tAutoI18n("invalid_csv_56abd01"),
          tAutoI18n("csv_must_have_at_least_1_column_445b6c0"),
        );
        return;
      }

      setPreview(preview);
    } catch (error) {
      showErrorToast(
        tAutoI18n("failed_to_parse_csv_cc91eff"),
        error instanceof Error
          ? error.message
          : tAutoI18n("unknown_error_e5fd9aa"),
      );
    }
  };

  return (
    <DialogBody className="border-t">
      <Card className="h-full items-center justify-center border-none">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">
            {tAuto("add_items_to_dataset_ecb443e")}
          </CardTitle>
          <CardDescription>
            Add items to dataset by uploading a file, add items manually or via
            our SDKs/API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dropzone
            onDrop={handleFiles}
            accept={{ "text/csv": [".csv"] }}
            isDisabled={false}
            maxFiles={1}
            maxSize={MAX_FILE_SIZE_BYTES}
            minSize={undefined}
            onError={undefined}
            src={undefined}
            variant="panel"
          />
        </CardContent>
      </Card>
    </DialogBody>
  );
};
