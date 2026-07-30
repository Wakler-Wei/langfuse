import { useWatch } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  BlobStorageExportMode,
  BlobStorageIntegrationFileType,
} from "@langfuse/shared";
import { type BlobStorageFormControl } from "@/src/features/blobstorage-integration/components/formValues";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

// Frequency, file type, and export mode (with the custom start date when the
// mode requires one).
export const ExportScheduleFields = ({
  control,
}: {
  control: BlobStorageFormControl;
}) => {
  const tAuto = useAutoTranslations();
  const watchedExportMode = useWatch({ control, name: "exportMode" });

  return (
    <>
      <FormField
        control={control}
        name="exportFrequency"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tAuto("export_frequency_df74483")}</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={tAuto("select_frequency_a3c8a31")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="every_20_minutes">
                    {tAuto("every_20_minutes_22cf93e")}{" "}
                  </SelectItem>
                  <SelectItem value="hourly">
                    {tAuto("hourly_d936254")}
                  </SelectItem>
                  <SelectItem value="daily">
                    {tAuto("daily_728298d")}
                  </SelectItem>
                  <SelectItem value="weekly">
                    {tAuto("weekly_158f3da")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>
              {tAuto(
                "how_often_the_data_should_be_exported_changes_are_ta_f7e9120",
              )}{" "}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="fileType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tAuto("file_type_5023c89")}</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={tAuto("select_file_type_47be048")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARQUET">
                    {tAuto("parquet_b6d723c")}
                  </SelectItem>
                  <SelectItem value="JSONL">JSONL</SelectItem>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="JSON">JSON</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>
              {field.value === BlobStorageIntegrationFileType.PARQUET
                ? tAuto(
                    "apache_parquet_a_columnar_binary_format_encoded_and__7760d6b",
                  )
                : tAuto("the_file_format_for_exported_data_9d46226")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="exportMode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tAuto("export_mode_642291b")}</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={tAuto("select_export_mode_9440b88")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BlobStorageExportMode.FULL_HISTORY}>
                    {tAuto("full_history_bde98b5")}{" "}
                  </SelectItem>
                  <SelectItem value={BlobStorageExportMode.FROM_TODAY}>
                    {tAuto("today_24345a1")}{" "}
                  </SelectItem>
                  <SelectItem value={BlobStorageExportMode.FROM_CUSTOM_DATE}>
                    {tAuto("custom_date_a39a910")}{" "}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>
              Choose when to start exporting data. &quot;Today&quot; and
              &quot;Custom date&quot; modes will not include historical data
              before the specified date.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {watchedExportMode === BlobStorageExportMode.FROM_CUSTOM_DATE && (
        <FormField
          control={control}
          name="exportStartDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tAuto("export_start_date_dfaa9df")}</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  max={(() => {
                    const t = new Date();
                    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
                  })()}
                  value={
                    field.value instanceof Date
                      ? field.value.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    const date = e.target.value
                      ? new Date(e.target.value)
                      : null;
                    field.onChange(date);
                  }}
                  placeholder={tAuto("select_start_date_d37e453")}
                />
              </FormControl>
              <FormDescription>
                {tAuto(
                  "data_before_this_date_will_not_be_included_in_export_c179cd3",
                )}{" "}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
};
