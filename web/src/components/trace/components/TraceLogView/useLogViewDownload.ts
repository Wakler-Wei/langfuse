/**
 * Hook for download and copy JSON functionality in LogView.
 *
 * Handles:
 * - Copy to clipboard (non-virtualized mode)
 * - Download as JSON file (both modes)
 * - Loading state management
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { copyTextToClipboard } from "@/src/utils/clipboard";
import { type ObservationIOData } from "./useLogViewAllObservationsIO";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export interface UseLogViewDownloadParams {
  /** Trace ID for filename */
  traceId: string;
  /** Whether to use cached I/O only (vs loading all data) */
  isCacheOnly: boolean;
  /** Already loaded observation data (null if not loaded) */
  allObservationsData: ObservationIOData[] | null;
  /** Whether data is being loaded by useLogViewAllObservationsIO */
  isLoadingAllData: boolean;
  /** IDs of observations that failed to load */
  failedObservationIds: string[];
  /** Load all observation data (uses cache where available) */
  loadAllData: () => Promise<ObservationIOData[]>;
  /** Build data from tree + cache without fetching (for cache-only mode) */
  buildDataFromCache: () => ObservationIOData[];
}

/**
 * Hook for managing download and copy JSON functionality.
 */
export function useLogViewDownload({
  traceId,
  isCacheOnly,
  allObservationsData,
  isLoadingAllData,
  failedObservationIds,
  loadAllData,
  buildDataFromCache,
}: UseLogViewDownloadParams) {
  const tAuto = useAutoTranslations();
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Helper to download JSON data
  const downloadJsonData = useCallback(
    (data: unknown) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trace-${traceId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [traceId],
  );

  // Copy JSON handler - uses cache only or loads all based on threshold
  const handleCopyJson = useCallback(async () => {
    if (isCacheOnly) {
      // Cache-only mode: build from tree + cache (no fetching)
      setIsActionLoading(true);
      setTimeout(() => {
        try {
          const data = buildDataFromCache();
          copyTextToClipboard(JSON.stringify(data, null, 2));
          toast.success(tAuto("copied_to_clipboard_cache_only_28011b0"));
        } finally {
          setIsActionLoading(false);
        }
      }, 0);
    } else {
      // Load all mode: fetch all data if needed
      if (allObservationsData) {
        copyTextToClipboard(JSON.stringify(allObservationsData, null, 2));
        // Show warning if some observations failed to load
        if (failedObservationIds.length > 0) {
          toast.warning(
            tAuto(
              "copied_to_clipboard_value0_observation_value1_failed_14226e2",
              {
                value0: String(failedObservationIds.length),
                value1: failedObservationIds.length === 1 ? "" : "s",
                value2: failedObservationIds.length === 1 ? "is" : "are",
              },
            ),
          );
        } else {
          toast.success(tAuto("copied_to_clipboard_0e73834"));
        }
      } else {
        setIsActionLoading(true);
        try {
          const data = await loadAllData();
          copyTextToClipboard(JSON.stringify(data, null, 2));
          // Check for failures after loading
          if (failedObservationIds.length > 0) {
            toast.warning(
              tAuto(
                "copied_to_clipboard_value0_observation_value1_failed_14226e2",
                {
                  value0: String(failedObservationIds.length),
                  value1: failedObservationIds.length === 1 ? "" : "s",
                  value2: failedObservationIds.length === 1 ? "is" : "are",
                },
              ),
            );
          } else {
            toast.success(tAuto("copied_to_clipboard_0e73834"));
          }
        } finally {
          setIsActionLoading(false);
        }
      }
    }
  }, [
    isCacheOnly,
    allObservationsData,
    loadAllData,
    buildDataFromCache,
    failedObservationIds,
    ,
    tAuto,
  ]);

  // Download JSON handler - uses cache only or loads all based on threshold
  const handleDownloadJson = useCallback(async () => {
    if (isCacheOnly) {
      // Cache-only mode: build from tree + cache (no fetching)
      setIsActionLoading(true);
      // Use setTimeout to allow spinner to render before potentially heavy operation
      setTimeout(() => {
        try {
          const data = buildDataFromCache();
          downloadJsonData(data);
          toast.success(tAuto("downloaded_trace_data_cache_only_b2fe3d6"));
        } finally {
          setIsActionLoading(false);
        }
      }, 0);
    } else {
      // Load all mode: fetch all data if needed
      if (allObservationsData) {
        downloadJsonData(allObservationsData);
        // Show warning if some observations failed to load
        if (failedObservationIds.length > 0) {
          toast.warning(
            tAuto(
              "downloaded_trace_data_value0_observation_value1_fail_2926cff",
              {
                value0: String(failedObservationIds.length),
                value1: failedObservationIds.length === 1 ? "" : "s",
                value2: failedObservationIds.length === 1 ? "is" : "are",
              },
            ),
          );
        } else {
          toast.success(tAuto("downloaded_trace_data_807eb86"));
        }
      } else {
        setIsActionLoading(true);
        try {
          const data = await loadAllData();
          downloadJsonData(data);
          // Check for failures after loading
          if (failedObservationIds.length > 0) {
            toast.warning(
              tAuto(
                "downloaded_trace_data_value0_observation_value1_fail_2926cff",
                {
                  value0: String(failedObservationIds.length),
                  value1: failedObservationIds.length === 1 ? "" : "s",
                  value2: failedObservationIds.length === 1 ? "is" : "are",
                },
              ),
            );
          } else {
            toast.success(tAuto("downloaded_trace_data_807eb86"));
          }
        } finally {
          setIsActionLoading(false);
        }
      }
    }
  }, [
    isCacheOnly,
    allObservationsData,
    loadAllData,
    buildDataFromCache,
    downloadJsonData,
    failedObservationIds,
    ,
    tAuto,
  ]);

  return {
    handleCopyJson,
    handleDownloadJson,
    isActionLoading: isActionLoading || isLoadingAllData,
  };
}
