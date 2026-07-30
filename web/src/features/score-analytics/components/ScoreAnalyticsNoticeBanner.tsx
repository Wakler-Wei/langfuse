import { Clock, Info } from "lucide-react";
import { useScoreAnalytics } from "./ScoreAnalyticsProvider";
import { useState, useEffect } from "react";
import { SamplingDetailsHoverCard } from "./SamplingDetailsHoverCard";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function ScoreAnalyticsNoticeBanner() {
  const tAuto = useAutoTranslations();
  const { isEstimating, estimate, isLoading, data } = useScoreAnalytics();
  const [showLoadingBanner, setShowLoadingBanner] = useState(false);

  // Track when estimation starts and set delay for showing loading banner
  useEffect(() => {
    if (isEstimating || (estimate && isLoading)) {
      // Start timer - show banner after 1.5 seconds
      const timer = setTimeout(() => {
        setShowLoadingBanner(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
    // Reset when loading completes
    setShowLoadingBanner(false);
  }, [isEstimating, estimate, isLoading]);

  // Don't show anything if we haven't started
  if (!isEstimating && !estimate) return null;

  // State 1: Estimating (loading)
  if (isEstimating || (estimate && isLoading)) {
    const showLargeDataset =
      estimate && estimate.estimatedMatchedCount > 100_000;

    // Only show banner if:
    // 1. Delay has passed, OR
    // 2. We have estimate data showing it's a large dataset
    if (!showLoadingBanner && !showLargeDataset) {
      return null;
    }

    return (
      <div className="bg-muted mb-4 rounded-md px-4 py-3">
        <div className="flex items-start gap-3">
          <Clock className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="text-sm font-bold">
              {showLargeDataset
                ? tAuto("processing_large_dataset_76ffb7a")
                : tAuto("loading_analytics_27228cb")}
            </div>
            {estimate && (
              <div className="text-muted-foreground text-sm">
                {estimate.mode === "single"
                  ? tAuto("analyzing_value0_scores_ef6f98c", {
                      value0: String(
                        (estimate.score1Count.toLocaleString() as unknown) ??
                          "",
                      ),
                    })
                  : tAuto(
                      "analyzing_value0_score_1_and_value1_score_2_scores_3d7170e",
                      {
                        value0: String(
                          (estimate.score1Count.toLocaleString() as unknown) ??
                            "",
                        ),
                        value1: String(
                          (estimate.score2Count.toLocaleString() as unknown) ??
                            "",
                        ),
                      },
                    )}
                {estimate.willSample && " • Sampling will be applied"}
                {estimate.estimatedQueryTime && (
                  <>
                    {" "}
                    {tAuto("est_time_cd6b095")} {estimate.estimatedQueryTime}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // State 2: Loaded with sampling
  if (data?.samplingMetadata.isSampled) {
    return (
      <div className="bg-muted mb-4 rounded-md px-4 py-3">
        <div className="flex items-start gap-3">
          <Info className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold">
              {tAuto("sampled_data_a274c06")}{" "}
              <SamplingDetailsHoverCard
                samplingMetadata={data.samplingMetadata}
                mode={data.metadata.mode}
              />
            </div>
            <div className="text-muted-foreground text-sm">
              {data.metadata.mode === "single"
                ? tAuto(
                    "results_based_on_a_value0_sample_of_value1_scores_9eaf4b5",
                    {
                      value0: String(
                        ((data.samplingMetadata.samplingRate * 100).toFixed(
                          2,
                        ) as unknown) ?? "",
                      ),
                      value1: String(
                        (data.samplingMetadata.preflightEstimates?.score1Count.toLocaleString() as unknown) ??
                          "",
                      ),
                    },
                  )
                : tAuto(
                    "results_based_on_a_value0_sample_of_value1_score_1_a_5114ede",
                    {
                      value0: String(
                        ((data.samplingMetadata.samplingRate * 100).toFixed(
                          2,
                        ) as unknown) ?? "",
                      ),
                      value1: String(
                        (data.samplingMetadata.preflightEstimates?.score1Count.toLocaleString() as unknown) ??
                          "",
                      ),
                      value2: String(
                        (data.samplingMetadata.preflightEstimates?.score2Count.toLocaleString() as unknown) ??
                          "",
                      ),
                    },
                  )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Loaded without sampling (don't show banner)
  return null;
}
