import Page from "@/src/components/layouts/page";
import { useRouter } from "next/router";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { Lock, Plus } from "lucide-react";
import EvalsTemplateTable from "@/src/features/evals/components/eval-templates-table";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import {
  getEvalsTabs,
  EVALS_TABS,
} from "@/src/features/navigation/utils/evals-tabs";
import { ManageDefaultEvalModel } from "@/src/features/evals/components/manage-default-eval-model";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export default function TemplatesPage() {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const capture = usePostHogClientCapture();
  const hasWriteAccess = useHasProjectAccess({
    projectId,
    scope: "evalTemplate:CUD",
  });

  const hasReadAccess = useHasProjectAccess({
    projectId,
    scope: "evalTemplate:read",
  });

  if (!hasReadAccess) {
    return null;
  }

  return (
    <Page
      headerProps={{
        title: tAuto("evaluators_03488ee"),
        help: {
          description: tAuto(
            "view_all_langfuse_managed_and_custom_evaluators_ee73610",
          ),
          href: "https://langfuse.com/docs/evaluation/evaluation-methods/llm-as-a-judge",
        },
        tabsProps: {
          tabs: getEvalsTabs(projectId),
          activeTab: EVALS_TABS.TEMPLATES,
        },
        actionButtonsRight: (
          <>
            <ManageDefaultEvalModel projectId={projectId} />
            <Button
              disabled={!hasWriteAccess}
              onClick={() => capture("eval_templates:new_form_open")}
              asChild
              variant="default"
            >
              <Link
                href={
                  hasWriteAccess
                    ? `/project/${projectId}/evals/templates/new`
                    : "#"
                }
              >
                {hasWriteAccess ? (
                  <Plus className="mr-2 h-4 w-4" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                {tAutoI18n("custom_evaluator_a362169")}{" "}
              </Link>
            </Button>
          </>
        ),
      }}
    >
      <EvalsTemplateTable projectId={projectId} />
    </Page>
  );
}
