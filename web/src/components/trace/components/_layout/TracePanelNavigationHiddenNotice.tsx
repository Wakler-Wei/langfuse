/**
 * HiddenObservationsNotice - Shows notification when observations are filtered by minimum level
 *
 * Displays:
 * - Count of hidden observations
 * - Current minimum observation level
 * - "Show all" link to reset filter to DEBUG level
 *
 * Only renders when hiddenObservationsCount > 0
 * Fixed height component placed below NavigationHeader
 */

import { ObservationLevel } from "@langfuse/shared";
import { useTraceData } from "../../contexts/TraceDataContext";
import { useViewPreferences } from "../../contexts/ViewPreferencesContext";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function TracePanelNavigationHiddenNotice() {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const { hiddenObservationsCount } = useTraceData();
  const { minObservationLevel, setMinObservationLevel } = useViewPreferences();

  const handleShowAll = () => {
    setMinObservationLevel(ObservationLevel.DEBUG);
  };

  // Only show when observations are hidden
  if (hiddenObservationsCount === 0) {
    return null;
  }

  return (
    <div className="flex shrink-0 items-center justify-end gap-1 border-b px-4 py-1">
      <span className="text-muted-foreground flex flex-col gap-1 text-xs sm:flex-row">
        <p>
          {hiddenObservationsCount}{" "}
          {tAutoI18n("hidden_observations_below_ac28693")} {minObservationLevel}{" "}
          {tAutoI18n("level_acf5be0")}{" "}
        </p>
        <p
          className="cursor-pointer underline"
          onClick={handleShowAll}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleShowAll();
            }
          }}
        >
          {tAuto("show_all_50a279d")}{" "}
        </p>
      </span>
    </div>
  );
}
