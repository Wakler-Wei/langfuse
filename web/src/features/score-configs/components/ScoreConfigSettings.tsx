import React from "react";
import Header from "@/src/components/layouts/header";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { ScoreConfigsTable } from "@/src/components/table/use-cases/score-configs";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function ScoreConfigSettings({ projectId }: { projectId: string }) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const hasReadAccess = useHasProjectAccess({
    projectId: projectId,
    scope: "scoreConfigs:read",
  });

  if (!hasReadAccess) return null;

  return (
    <div id="score-configs">
      <Header title={tAuto("score_configs_c78e87c")} />
      <p className="mb-2 text-sm">
        {tAutoI18n(
          "score_configs_define_which_scores_are_available_for_3b0fcbb",
        )}{" "}
        <a
          href="https://langfuse.com/docs/evaluation/evaluation-methods/annotation"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {tAuto("annotation_2e76f54")}{" "}
        </a>{" "}
        {tAutoI18n(
          "in_your_project_please_note_that_all_score_configs_a_fe5b828",
        )}{" "}
      </p>
      <ScoreConfigsTable projectId={projectId} />
    </div>
  );
}
