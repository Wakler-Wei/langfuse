import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/src/components/ui/hover-card";
import { Info } from "lucide-react";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

interface SamplingMetadata {
  samplingRate: number;
  preflightEstimates?: {
    score1Count: number;
    score2Count: number;
    estimatedMatchedCount: number;
  };
  adaptiveFinal?: {
    usedFinal: boolean;
    reason: string;
  };
}

interface SamplingDetailsHoverCardProps {
  samplingMetadata: SamplingMetadata;
  mode?: "single" | "two";
  showLabel?: boolean;
}

export function SamplingDetailsHoverCard({
  samplingMetadata,
  mode = "two",
  showLabel = false,
}: SamplingDetailsHoverCardProps) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          className={
            showLabel
              ? "text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
              : "hover:bg-muted-foreground/10 inline-flex h-4 w-4 items-center justify-center rounded-full"
          }
          aria-label={tAuto("view_sampling_details_7db3bc9")}
        >
          {showLabel && <span>{tAuto("sampled_data_a274c06")}</span>}
          <Info
            className={showLabel ? "h-3 w-3" : "text-muted-foreground h-3 w-3"}
          />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" align="start">
        <div className="space-y-3">
          <div>
            <h4 className="mb-2 text-sm font-bold">
              {mode === "single"
                ? tAutoI18n("estimated_score_count_ee5d847")
                : tAutoI18n("estimated_scores_908e33a")}
            </h4>
            <dl className="space-y-1 text-sm">
              {mode === "single" ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    {tAuto("total_scores_506379f")}
                  </dt>
                  <dd className="font-bold">
                    ~
                    {samplingMetadata.preflightEstimates?.score1Count.toLocaleString()}
                  </dd>
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      {tAuto("score_1_bebacce")}
                    </dt>
                    <dd className="font-bold">
                      ~
                      {samplingMetadata.preflightEstimates?.score1Count.toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      {tAuto("score_2_66d7f28")}
                    </dt>
                    <dd className="font-bold">
                      ~
                      {samplingMetadata.preflightEstimates?.score2Count.toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      {tAuto("estimated_matches_9242111")}{" "}
                    </dt>
                    <dd className="font-bold">
                      ~
                      {samplingMetadata.preflightEstimates?.estimatedMatchedCount.toLocaleString()}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-bold">
              {tAuto("query_optimizations_28b13ab")}
            </h4>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {tAuto("sampling_f7a20e6")}
                </dt>
                <dd className="font-bold">
                  {(samplingMetadata.samplingRate * 100).toFixed(1)}
                  {tAutoI18n("hash_based_735e30b")}{" "}
                </dd>
              </div>
              {samplingMetadata.adaptiveFinal && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    {tAuto("deduplication_6d6beb7")}
                  </dt>
                  <dd className="font-bold">
                    {samplingMetadata.adaptiveFinal.usedFinal
                      ? tAutoI18n("enabled_df174a3")
                      : tAutoI18n("skipped_for_performance_29ac0d0")}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <p className="text-muted-foreground text-xs">
            {tAuto(
              "hash_based_sampling_ensures_consistent_repeatable_re_c3015c0",
            )}{" "}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
