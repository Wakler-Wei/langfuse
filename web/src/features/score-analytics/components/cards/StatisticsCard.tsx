import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { useScoreAnalytics } from "../ScoreAnalyticsProvider";
import { MetricCard } from "../charts/MetricCard";
import { SamplingDetailsHoverCard } from "../SamplingDetailsHoverCard";
import {
  calculateCohensKappa,
  calculateWeightedF1Score,
  calculateOverallAgreement,
  interpretPearsonCorrelation,
  interpretSpearmanCorrelation,
  interpretCohensKappa,
  interpretF1Score,
  interpretOverallAgreement,
  interpretMAE,
  interpretRMSE,
} from "@/src/features/score-analytics/lib/statistics-utils";
import Spinner from "@/src/components/design-system/Spinner/Spinner";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

/**
 * StatisticsCard - Smart card component for displaying score statistics
 *
 * Consumes ScoreAnalyticsProvider context and displays:
 * - Score 1 stats (always shown)
 * - Score 2 stats (shown in two-score mode)
 * - Comparison metrics (shown in two-score mode)
 *
 * Handles:
 * - Loading states
 * - Empty states
 * - Single vs two-score modes
 * - Numeric vs categorical data types
 */
export function StatisticsCard() {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const { data, isLoading, params } = useScoreAnalytics();

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{tAuto("statistics_2086b21")}</CardTitle>
          <CardDescription>
            {tAuto("loading_statistics_58271a8")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Spinner size="xl" variant="muted" />
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{tAuto("statistics_2086b21")}</CardTitle>
          <CardDescription>
            {tAuto("no_data_available_0cfc430")}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground py-12 text-center text-sm">
          {tAuto("select_a_score_to_view_statistics_594991c")}{" "}
        </CardContent>
      </Card>
    );
  }

  // Extract data from context
  const { statistics, metadata } = data;
  const { dataType } = metadata;
  const { score1, score2 } = params;

  // Check if Cartesian product occurred (matched count exceeds both individual counts)
  const hasCartesianProduct =
    statistics.comparison &&
    statistics.comparison.matchedCount > statistics.score1.total &&
    statistics.score2 &&
    statistics.comparison.matchedCount > statistics.score2.total;

  // Determine what to show
  const showScore1Data = statistics.score1.total > 0;
  const showScore2Data = statistics.score2 !== null;
  const showComparisonMetrics = statistics.comparison !== null;

  // Always show Score 2 and Comparison sections once score1 is selected
  // to set user expectations about what information will be available
  const showScore2Section = true; // Always show when on this page
  const showComparisonSection = true; // Always show when on this page

  // Calculate categorical metrics if available
  const cohensKappa =
    showComparisonMetrics && statistics.comparison?.confusionMatrix
      ? calculateCohensKappa(statistics.comparison.confusionMatrix)
      : null;
  const f1Score =
    showComparisonMetrics && statistics.comparison?.confusionMatrix
      ? calculateWeightedF1Score(statistics.comparison.confusionMatrix)
      : null;
  const overallAgreement =
    showComparisonMetrics && statistics.comparison?.confusionMatrix
      ? calculateOverallAgreement(statistics.comparison.confusionMatrix)
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {tAutoI18n("statistics_2086b21")}{" "}
          {data.samplingMetadata.isSampled && (
            <SamplingDetailsHoverCard
              samplingMetadata={data.samplingMetadata}
              mode={data.metadata.mode}
              showLabel
            />
          )}
        </CardTitle>
        <CardDescription>
          {score2
            ? tAutoI18n("value0_vs_value1_cee0764", {
                value0: String((score1.name as unknown) ?? ""),
                value1: String((score2.name as unknown) ?? ""),
              })
            : tAutoI18n("value0_select_a_second_score_for_comparison_eaac04b", {
                value0: String((score1.name as unknown) ?? ""),
              })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Section 1: Score 1 Data */}
        <div>
          <h4 className="mb-2 text-xs font-bold">
            {score1.name} ({score1.source})
          </h4>
          {dataType === "NUMERIC" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MetricCard
                label={tAuto("total_b25928c")}
                value={
                  showScore1Data
                    ? statistics.score1.total.toLocaleString()
                    : "--"
                }
                helpText={`Total number of ${score1.name} scores`}
                isPlaceholder={!showScore1Data}
                isContext
              />
              <MetricCard
                label={tAuto("mean_51cda54")}
                value={
                  showScore1Data && statistics.score1.mean !== null
                    ? statistics.score1.mean.toFixed(2)
                    : !showScore1Data
                      ? "--"
                      : "N/A"
                }
                helpText={`Average value for ${score1.name}`}
                isPlaceholder={!showScore1Data}
                isContext
              />
              <MetricCard
                label={tAuto("std_dev_9aa171c")}
                value={
                  showScore1Data && statistics.score1.std !== null
                    ? statistics.score1.std.toFixed(2)
                    : !showScore1Data
                      ? "--"
                      : "N/A"
                }
                helpText={`Standard deviation for ${score1.name}`}
                isPlaceholder={!showScore1Data}
                isContext
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MetricCard
                label={tAuto("total_b25928c")}
                value={
                  showScore1Data
                    ? statistics.score1.total.toLocaleString()
                    : "--"
                }
                helpText={`Total number of ${score1.name} scores`}
                isPlaceholder={!showScore1Data}
                isContext
              />
              <MetricCard
                label={tAuto("mode_a7b93d2")}
                value={
                  showScore1Data && statistics.score1.mode
                    ? `${statistics.score1.mode.category} (${statistics.score1.mode.count.toLocaleString()})`
                    : !showScore1Data
                      ? "--"
                      : "N/A"
                }
                helpText="Most frequent category and its count"
                isPlaceholder={!showScore1Data}
                isContext
              />
              <MetricCard
                label={tAuto("mode_f9f17e7")}
                value={
                  showScore1Data && statistics.score1.modePercentage !== null
                    ? `${statistics.score1.modePercentage.toFixed(1)}%`
                    : !showScore1Data
                      ? "--"
                      : "N/A"
                }
                helpText="Percentage of observations with the most frequent category"
                isPlaceholder={!showScore1Data}
                isContext
              />
            </div>
          )}
        </div>

        {/* Section 2: Score 2 Data - Always show to set expectations */}
        {showScore2Section && (
          <div>
            <h4 className="mb-2 text-xs font-bold">
              {score2?.name ?? "Score 2"}
              {score2?.source ? ` (${score2.source})` : ""}
            </h4>
            {dataType === "NUMERIC" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MetricCard
                  label={tAuto("total_b25928c")}
                  value={
                    showScore2Data && statistics.score2
                      ? statistics.score2.total.toLocaleString()
                      : "--"
                  }
                  helpText={`Total number of ${score2?.name ?? "Score 2"} scores`}
                  isPlaceholder={!showScore2Data}
                  isContext
                />
                <MetricCard
                  label={tAuto("mean_51cda54")}
                  value={
                    showScore2Data &&
                    statistics.score2 &&
                    statistics.score2.mean !== null
                      ? statistics.score2.mean.toFixed(2)
                      : !showScore2Data
                        ? "--"
                        : "N/A"
                  }
                  helpText={`Average value for ${score2?.name ?? "Score 2"}`}
                  isPlaceholder={!showScore2Data}
                  isContext
                />
                <MetricCard
                  label={tAuto("std_dev_9aa171c")}
                  value={
                    showScore2Data &&
                    statistics.score2 &&
                    statistics.score2.std !== null
                      ? statistics.score2.std.toFixed(2)
                      : !showScore2Data
                        ? "--"
                        : "N/A"
                  }
                  helpText={`Standard deviation for ${score2?.name ?? "Score 2"}`}
                  isPlaceholder={!showScore2Data}
                  isContext
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MetricCard
                  label={tAuto("total_b25928c")}
                  value={
                    showScore2Data && statistics.score2
                      ? statistics.score2.total.toLocaleString()
                      : "--"
                  }
                  helpText={`Total number of ${score2?.name ?? "Score 2"} scores`}
                  isPlaceholder={!showScore2Data}
                  isContext
                />
                <MetricCard
                  label={tAuto("mode_a7b93d2")}
                  value={
                    showScore2Data && statistics.score2?.mode
                      ? `${statistics.score2.mode.category} (${statistics.score2.mode.count.toLocaleString()})`
                      : !showScore2Data
                        ? "--"
                        : "N/A"
                  }
                  helpText="Most frequent category and its count"
                  isPlaceholder={!showScore2Data}
                  isContext
                />
                <MetricCard
                  label={tAuto("mode_f9f17e7")}
                  value={
                    showScore2Data &&
                    statistics.score2 &&
                    statistics.score2.modePercentage !== null
                      ? `${statistics.score2.modePercentage.toFixed(1)}%`
                      : !showScore2Data
                        ? "--"
                        : "N/A"
                  }
                  helpText="Percentage of observations with the most frequent category"
                  isPlaceholder={!showScore2Data}
                  isContext
                />
              </div>
            )}
          </div>
        )}

        {/* Section 3: Comparison Metrics - Always show to set expectations */}
        {showComparisonSection && (
          <div>
            <h4 className="mb-2 text-xs font-bold">
              {tAuto("comparison_2dfcf89")}
            </h4>
            {dataType === "NUMERIC" ? (
              <div className="space-y-4">
                {/* First row: Matched, Pearson, Spearman */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <MetricCard
                    label={tAuto("matched_1bf3ec5")}
                    value={
                      showComparisonMetrics && statistics.comparison
                        ? statistics.comparison.matchedCount.toLocaleString()
                        : "--"
                    }
                    helpText="Number of observations with both scores"
                    warning={
                      hasCartesianProduct
                        ? {
                            show: true,
                            content: (
                              <div className="space-y-2 text-xs">
                                <p className="font-bold">
                                  {tAuto(
                                    "matched_count_exceeds_individual_score_counts_due_to_6018704",
                                  )}{" "}
                                </p>
                                <p>
                                  {tAuto(
                                    "this_occurs_when_multiple_scores_of_the_same_name_so_c77eb61",
                                  )}{" "}
                                </p>
                                <p className="text-muted-foreground">
                                  <strong>{tAuto("example_c63737a")}</strong> If
                                  one trace has 2 &quot;gpt4&quot; scores and 3
                                  &quot;gemini&quot; scores, this creates 6
                                  matched pairs (2 × 3 = 6).
                                </p>
                              </div>
                            ),
                          }
                        : undefined
                    }
                    isContext
                    isPlaceholder={!showComparisonMetrics}
                  />
                  <MetricCard
                    label={tAuto("pearson_r_fe7c854")}
                    value={
                      showComparisonMetrics &&
                      statistics.comparison &&
                      statistics.comparison.pearsonCorrelation !== null
                        ? statistics.comparison.pearsonCorrelation.toFixed(3)
                        : showComparisonMetrics
                          ? "N/A"
                          : "--"
                    }
                    interpretation={
                      showComparisonMetrics &&
                      statistics.comparison &&
                      statistics.comparison.pearsonCorrelation !== null
                        ? interpretPearsonCorrelation(
                            statistics.comparison.pearsonCorrelation,
                          )
                        : undefined
                    }
                    helpText="Linear correlation (-1 to 1)"
                    isPlaceholder={!showComparisonMetrics}
                  />
                  <MetricCard
                    label={tAuto("spearman_6244a98")}
                    value={
                      showComparisonMetrics &&
                      statistics.comparison &&
                      statistics.comparison.spearmanCorrelation !== null
                        ? statistics.comparison.spearmanCorrelation.toFixed(3)
                        : showComparisonMetrics
                          ? "N/A"
                          : "--"
                    }
                    interpretation={
                      showComparisonMetrics &&
                      statistics.comparison &&
                      statistics.comparison.spearmanCorrelation !== null
                        ? interpretSpearmanCorrelation(
                            statistics.comparison.spearmanCorrelation,
                          )
                        : undefined
                    }
                    helpText="Rank correlation (-1 to 1)"
                    isPlaceholder={!showComparisonMetrics}
                  />
                </div>
                {/* Second row: Empty, MAE, RMSE */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div />
                  <MetricCard
                    label="MAE"
                    value={
                      showComparisonMetrics &&
                      statistics.comparison &&
                      statistics.comparison.mae !== null
                        ? statistics.comparison.mae.toFixed(3)
                        : showComparisonMetrics
                          ? "N/A"
                          : "--"
                    }
                    interpretation={
                      showComparisonMetrics &&
                      statistics.comparison &&
                      statistics.comparison.mae !== null
                        ? interpretMAE(statistics.comparison.mae)
                        : undefined
                    }
                    helpText="Mean Absolute Error"
                    isPlaceholder={!showComparisonMetrics}
                  />
                  <MetricCard
                    label="RMSE"
                    value={
                      showComparisonMetrics &&
                      statistics.comparison &&
                      statistics.comparison.rmse !== null
                        ? statistics.comparison.rmse.toFixed(3)
                        : showComparisonMetrics
                          ? "N/A"
                          : "--"
                    }
                    interpretation={
                      showComparisonMetrics &&
                      statistics.comparison &&
                      statistics.comparison.rmse !== null
                        ? interpretRMSE(statistics.comparison.rmse)
                        : undefined
                    }
                    helpText="Root Mean Square Error"
                    isPlaceholder={!showComparisonMetrics}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* First row: Matched, Agreement */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <MetricCard
                    label={tAuto("matched_1bf3ec5")}
                    value={
                      showComparisonMetrics && statistics.comparison
                        ? statistics.comparison.matchedCount.toLocaleString()
                        : "--"
                    }
                    helpText="Number of observations with both scores"
                    warning={
                      hasCartesianProduct
                        ? {
                            show: true,
                            content: (
                              <div className="space-y-2 text-xs">
                                <p className="font-bold">
                                  {tAuto(
                                    "matched_count_exceeds_individual_score_counts_due_to_6018704",
                                  )}{" "}
                                </p>
                                <p>
                                  {tAuto(
                                    "this_occurs_when_multiple_scores_of_the_same_name_so_c77eb61",
                                  )}{" "}
                                </p>
                                <p className="text-muted-foreground">
                                  <strong>{tAuto("example_c63737a")}</strong> If
                                  one trace has 2 &quot;gpt4&quot; scores and 3
                                  &quot;gemini&quot; scores, this creates 6
                                  matched pairs (2 × 3 = 6).
                                </p>
                              </div>
                            ),
                          }
                        : undefined
                    }
                    isContext
                    isPlaceholder={!showComparisonMetrics}
                  />
                  <MetricCard
                    label={tAuto("agreement_c8fee8e")}
                    value={
                      showComparisonMetrics && overallAgreement !== null
                        ? `${(overallAgreement * 100).toFixed(1)}%`
                        : showComparisonMetrics
                          ? "N/A"
                          : "--"
                    }
                    interpretation={
                      showComparisonMetrics && overallAgreement !== null
                        ? interpretOverallAgreement(overallAgreement)
                        : undefined
                    }
                    helpText="Overall agreement percentage"
                    isPlaceholder={!showComparisonMetrics}
                  />
                </div>
                {/* Second row: Empty, Cohen's κ, F1 Score */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div />
                  <MetricCard
                    label={tAuto("cohen_s_9891f4e")}
                    value={
                      showComparisonMetrics && cohensKappa !== null
                        ? cohensKappa.toFixed(3)
                        : showComparisonMetrics
                          ? "N/A"
                          : "--"
                    }
                    interpretation={
                      showComparisonMetrics && cohensKappa !== null
                        ? interpretCohensKappa(cohensKappa)
                        : undefined
                    }
                    helpText="Inter-rater reliability (-1 to 1)"
                    isPlaceholder={!showComparisonMetrics}
                  />
                  <MetricCard
                    label={tAuto("f1_score_5a6162f")}
                    value={
                      showComparisonMetrics && f1Score !== null
                        ? f1Score.toFixed(3)
                        : showComparisonMetrics
                          ? "N/A"
                          : "--"
                    }
                    interpretation={
                      showComparisonMetrics && f1Score !== null
                        ? interpretF1Score(f1Score)
                        : undefined
                    }
                    helpText="Weighted F1 score (0 to 1)"
                    isPlaceholder={!showComparisonMetrics}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
