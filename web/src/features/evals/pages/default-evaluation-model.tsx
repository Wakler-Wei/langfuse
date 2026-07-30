import Page from "@/src/components/layouts/page";
import { useRouter } from "next/router";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { SupportOrUpgradePage } from "@/src/ee/features/billing/components/SupportOrUpgradePage";
import { DefaultEvalModelSetup } from "@/src/features/evals/components/default-eval-model-setup";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export default function DefaultEvaluationModelPage() {
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const projectId = router.query.projectId as string;

  const hasReadAccess = useHasProjectAccess({
    projectId,
    scope: "evalDefaultModel:read",
  });

  if (!hasReadAccess) {
    return <SupportOrUpgradePage />;
  }

  return (
    <Page
      withPadding
      headerProps={{
        title: tAuto("default_evaluation_model_55a35b0"),
        help: {
          description: tAuto(
            "configure_a_default_evaluation_model_for_your_projec_8d53b6d",
          ),
          href: "https://langfuse.com/docs/evaluation/evaluation-methods/llm-as-a-judge",
        },
        breadcrumb: [
          {
            name: "Evaluator Library",
            href: `/project/${projectId}/evals/templates`,
          },
        ],
      }}
    >
      <DefaultEvalModelSetup projectId={projectId} />
    </Page>
  );
}
