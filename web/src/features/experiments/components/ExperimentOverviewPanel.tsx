import { LocalIsoDate } from "@/src/components/LocalIsoDate";
import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { ExperimentComparisonSelector } from "./ExperimentComparisonSelector";
import { ExperimentBaselineControls } from "./ExperimentBaselineControls";
import Link from "next/link";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { ExperimentMetadataSection } from "./ExperimentMetadataSection";
import {
  ExperimentOverviewField,
  ExperimentOverviewSectionHeading,
} from "./ExperimentOverviewField";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

const isSafeHttpUrl = (value: string | undefined) => {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

type ExperimentOverviewPanelProps = {
  projectId: string;
  hasBaseline: boolean;
  experiment?: {
    id: string;
    name: string;
    description: string | null;
    datasetId: string;
    datasetName?: string;
    prompts: Array<[string, number | null]>; // [prompt_name, prompt_version]
    metadata: Record<string, string>;
    startTime: Date;
  };
  // Comparison selector props
  comparisonIds: string[];
  onComparisonIdsChange: (ids: string[]) => void;
  // Baseline controls props
  onBaselineChange: (id: string) => void;
  onBaselineClear: () => void;
};

export function ExperimentOverviewPanel({
  projectId,
  hasBaseline,
  experiment,
  comparisonIds,
  onComparisonIdsChange,
  onBaselineChange,
  onBaselineClear,
}: ExperimentOverviewPanelProps) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const metadata = experiment?.metadata ?? {};
  const provider = metadata.provider;
  const model = metadata.model;
  const pullRequestUrl = metadata["langfuse.pr_url"];
  const githubJobUrl = metadata["langfuse.github_job_url"];
  const safePullRequestUrl = isSafeHttpUrl(pullRequestUrl)
    ? pullRequestUrl
    : undefined;
  const safeGithubJobUrl = isSafeHttpUrl(githubJobUrl)
    ? githubJobUrl
    : undefined;
  const additionalMetadata = { ...metadata };
  if (provider || model) {
    delete additionalMetadata.provider;
    delete additionalMetadata.model;
  }
  if (safePullRequestUrl) delete additionalMetadata["langfuse.pr_url"];
  if (safeGithubJobUrl) delete additionalMetadata["langfuse.github_job_url"];

  // Get the first prompt name and version from the prompts array
  const [promptName, promptVersion] =
    experiment && experiment.prompts.length > 0
      ? experiment.prompts[0]
      : [null, null];

  // Check if description is long (more than 150 chars)
  const isLongDescription =
    experiment?.description && experiment.description.length > 150;
  const shouldTruncate = isLongDescription && !isDescriptionExpanded;
  const displayDescription = shouldTruncate
    ? experiment?.description?.slice(0, 150) + "..."
    : experiment?.description;

  return (
    <div className="space-y-4">
      <div className="bg-background sticky -top-4 z-30 -mx-4 -mt-4 space-y-4 px-4 pt-4 pb-4">
        <h3 className="text-lg font-bold">
          {tAuto("experiment_details_5ff9e80")}
        </h3>

        <div>
          <ExperimentOverviewSectionHeading>
            <span className="inline-flex items-center gap-1.5">
              {tAuto("baseline_e6ab798")}{" "}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={tAuto("what_is_a_baseline_experiment_ec3adc8")}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <InfoIcon className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[280px]">
                  {tAuto(
                    "the_baseline_is_the_reference_experiment_run_used_to_907cdee",
                  )}{" "}
                </TooltipContent>
              </Tooltip>
            </span>
          </ExperimentOverviewSectionHeading>
          <ExperimentBaselineControls
            projectId={projectId}
            baselineId={experiment?.id}
            baselineName={experiment?.name}
            onBaselineChange={onBaselineChange}
            onBaselineClear={onBaselineClear}
            canClearBaseline={comparisonIds.length > 0}
          />
        </div>

        <div className="border-t pt-4">
          <ExperimentOverviewSectionHeading>
            {tAuto("compare_with_719f56a")}{" "}
          </ExperimentOverviewSectionHeading>
          <ExperimentComparisonSelector
            projectId={projectId}
            baselineExperimentId={experiment?.id}
            selectedIds={comparisonIds}
            onSelectedIdsChange={onComparisonIdsChange}
          />
        </div>
      </div>

      {hasBaseline && experiment ? (
        <>
          <div className="border-t pt-4">
            <ExperimentOverviewSectionHeading>
              {tAuto("overview_0efc2e6")}{" "}
            </ExperimentOverviewSectionHeading>
            <div className="space-y-3 text-sm">
              <ExperimentOverviewField label={tAuto("name_709a232")}>
                <div className="font-bold">{experiment.name}</div>
              </ExperimentOverviewField>

              {experiment.description && (
                <ExperimentOverviewField label={tAuto("description_55f8ebc")}>
                  <div className="break-words">{displayDescription}</div>
                  {isLongDescription && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() =>
                        setIsDescriptionExpanded(!isDescriptionExpanded)
                      }
                    >
                      {isDescriptionExpanded
                        ? tAutoI18n("show_less_4c852b2")
                        : tAutoI18n("show_more_25911d4")}
                    </Button>
                  )}
                </ExperimentOverviewField>
              )}

              <ExperimentOverviewField label={tAuto("dataset_1052689")}>
                <Link
                  href={`/project/${projectId}/datasets/${encodeURIComponent(experiment.datasetId)}`}
                  className="text-primary hover:underline"
                >
                  {experiment.datasetName || experiment.datasetId}
                </Link>
              </ExperimentOverviewField>

              {promptName && (
                <ExperimentOverviewField label={tAuto("prompt_a817d7e")}>
                  <Link
                    href={`/project/${projectId}/prompts/${encodeURIComponent(promptName)}${promptVersion !== null ? `?version=${promptVersion}` : ""}`}
                    className="text-primary hover:underline"
                  >
                    {promptName}
                    {promptVersion !== null && (
                      <span className="text-muted-foreground ml-1">
                        {tAutoI18n("v_2c87db6")}
                        {promptVersion})
                      </span>
                    )}
                  </Link>
                </ExperimentOverviewField>
              )}

              {(provider || model) && (
                <ExperimentOverviewField label={tAuto("model_68c2cc7")}>
                  <div>
                    {provider && model
                      ? `${provider}/${model}`
                      : provider || model}
                  </div>
                </ExperimentOverviewField>
              )}

              <ExperimentOverviewField label={tAuto("start_time_41c1074")}>
                <LocalIsoDate date={experiment.startTime} />
              </ExperimentOverviewField>

              {safePullRequestUrl && (
                <ExperimentOverviewField
                  label={tAuto("pull_request_url_0d5ea7f")}
                >
                  <a
                    href={safePullRequestUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary break-all hover:underline"
                  >
                    {safePullRequestUrl}
                  </a>
                </ExperimentOverviewField>
              )}

              {safeGithubJobUrl && (
                <ExperimentOverviewField
                  label={tAuto("github_job_url_e3a7af0")}
                >
                  <a
                    href={safeGithubJobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary break-all hover:underline"
                  >
                    {safeGithubJobUrl}
                  </a>
                </ExperimentOverviewField>
              )}
            </div>
          </div>

          <ExperimentMetadataSection metadata={additionalMetadata} />
        </>
      ) : null}
    </div>
  );
}
