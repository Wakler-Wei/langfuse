import Header from "@/src/components/layouts/header";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { Card } from "@/src/components/ui/card";
import { BlobStorageExportMode } from "@langfuse/shared";
import { type RouterOutputs } from "@/src/utils/api";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type BlobStorageIntegrationConfig = NonNullable<
  RouterOutputs["blobStorageIntegration"]["get"]["config"]
>;

const EXPORT_MODE_LABELS: Record<BlobStorageExportMode, string> = {
  [BlobStorageExportMode.FULL_HISTORY]: "Full history",
  [BlobStorageExportMode.FROM_TODAY]: "From setup date",
  [BlobStorageExportMode.FROM_CUSTOM_DATE]: "From custom date",
};

export const BlobStorageStatusSection = ({
  config,
}: {
  config: BlobStorageIntegrationConfig;
}) => {
  const tAuto = useAutoTranslations();
  return (
    <>
      <Header title={tAuto("status_bae7d5b")} />
      {config.lastError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>{tAuto("last_export_failed_bf6ec59")}</AlertTitle>
          <AlertDescription>
            {config.lastError}
            {config.lastErrorAt && (
              <>
                <br />
                <span className="text-xs opacity-70">
                  {new Date(config.lastErrorAt).toLocaleString()}
                </span>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
      <Card className="p-3">
        <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">
            {tAuto("data_exported_up_to_00adb9a")}
          </span>
          <span>
            {config.lastSyncAt
              ? new Date(config.lastSyncAt).toLocaleString()
              : tAuto("never_pending_5219c85")}
          </span>
          {config.nextSyncAt && (
            <>
              <span className="text-muted-foreground">
                {tAuto("next_export_scheduled_31c5901")}{" "}
              </span>
              <span>{new Date(config.nextSyncAt).toLocaleString()}</span>
            </>
          )}
          <span className="text-muted-foreground">
            {tAuto("export_mode_3ccc167")}
          </span>
          <span>{EXPORT_MODE_LABELS[config.exportMode] ?? "Unknown"}</span>
          {(config.exportMode === BlobStorageExportMode.FROM_CUSTOM_DATE ||
            config.exportMode === BlobStorageExportMode.FROM_TODAY) &&
            config.exportStartDate && (
              <>
                <span className="text-muted-foreground">
                  {tAuto("export_start_date_5f15a60")}
                </span>
                <span>
                  {new Date(config.exportStartDate).toLocaleDateString()}
                </span>
              </>
            )}
        </div>
      </Card>
    </>
  );
};
