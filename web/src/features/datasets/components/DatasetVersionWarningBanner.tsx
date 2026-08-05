/* eslint-disable @repo/no-style-props */
import { Info } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/src/components/ui/button";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type DatasetVersionWarningBannerProps = {
  selectedVersion: Date;
  resetToLatest: () => void;
  className?: string;
  changeCounts?: {
    upserts: number;
    deletes: number;
  };
};

export function DatasetVersionWarningBanner({
  selectedVersion,
  resetToLatest,
  className = "",
  changeCounts,
}: DatasetVersionWarningBannerProps) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const totalChanges = changeCounts
    ? changeCounts.upserts + changeCounts.deletes
    : 0;
  const hasChanges = totalChanges > 0;

  return (
    <div
      className={`border-accent-dark-blue/10 bg-accent-light-blue/30 flex items-start gap-3 border-b p-3 ${className}`}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm wrap-break-word">
            {tAutoI18n("viewing_version_from_320aa92")}{" "}
            <span className="text-foreground font-bold">
              {format(selectedVersion, "MMM d, yyyy 'at' h:mm a")}
            </span>
          </p>
          <Button
            onClick={resetToLatest}
            variant="link"
            className="h-auto shrink-0 p-0 text-sm underline-offset-4"
          >
            {tAuto("return_to_latest_8c8120f")}{" "}
          </Button>
        </div>
        {changeCounts && hasChanges && (
          <p className="text-muted-foreground text-xs">
            {totalChanges} {tAutoI18n("change_7550b67")}
            {totalChanges !== 1 ? "s" : ""}{" "}
            {tAutoI18n("since_this_version_56ef9fb")}{" "}
            {changeCounts.upserts > 0 &&
              ` ${changeCounts.upserts} upsert${changeCounts.upserts !== 1 ? "s" : ""}`}
            {changeCounts.deletes > 0 &&
              ` ${changeCounts.deletes} delete${changeCounts.deletes !== 1 ? "s" : ""}`}
          </p>
        )}
      </div>
    </div>
  );
}
