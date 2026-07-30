import { useWatch } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import { BlobStorageIntegrationFileType } from "@langfuse/shared";
import { type BlobStorageFormControl } from "@/src/features/blobstorage-integration/components/formValues";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const GzipCompressionField = ({
  control,
}: {
  control: BlobStorageFormControl;
}) => {
  const tAuto = useAutoTranslations();
  const watchedFileType = useWatch({ control, name: "fileType" });
  // Parquet compresses internally — gzip does not apply.
  if (watchedFileType === BlobStorageIntegrationFileType.PARQUET) return null;

  return (
    <FormField
      control={control}
      name="compressed"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{tAuto("gzip_compression_73d0f25")}</FormLabel>
          <FormControl>
            <div className="mt-1 ml-4">
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </div>
          </FormControl>
          <FormDescription>
            {tAuto(
              "compress_exported_files_with_gzip_csv_gz_json_gz_jso_b995116",
            )}{" "}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
