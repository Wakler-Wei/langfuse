import { useRouter } from "next/router";
import Page from "@/src/components/layouts/page";
import { FlaskConical } from "lucide-react";
import { useExperimentAccess } from "@/src/features/experiments/hooks/useExperimentAccess";
import {
  EXPERIMENT_RUN_TABS,
  getExperimentRunTabs,
} from "@/src/features/navigation/utils/experiment-run-tabs";
import useSessionStorage from "@/src/components/useSessionStorage";
import Spinner from "@/src/components/design-system/Spinner/Spinner";
import { useEffect } from "react";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export default function ExperimentAnalytics() {
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const projectId = router.query.projectId as string;

  const { isExperimentsBetaActive, isInitializing } = useExperimentAccess();

  const [lastResultsUrl] = useSessionStorage<string | null>(
    "experiment-results-url",
    null,
  );

  const handleResultsClick = () => {
    const fallbackUrl = `/project/${projectId}/experiments/results`;
    router.push(lastResultsUrl ?? fallbackUrl);
  };

  useEffect(() => {
    if (isInitializing || isExperimentsBetaActive || !projectId) return;

    router.replace(`/project/${projectId}/datasets`);
  }, [isExperimentsBetaActive, isInitializing, projectId, router]);

  if (!isExperimentsBetaActive) {
    return (
      <Page headerProps={{ title: tAuto("analytics_25bc962") }}>
        <div className="flex h-full items-center justify-center">
          <Spinner size="xl" variant="muted" />
        </div>
      </Page>
    );
  }

  return (
    <Page
      headerProps={{
        title: tAuto("analytics_25bc962"),
        itemType: "EXPERIMENT",
        breadcrumb: [
          { name: "Experiments", href: `/project/${projectId}/experiments` },
        ],
        tabsProps: {
          tabs: getExperimentRunTabs(projectId, handleResultsClick),
          activeTab: EXPERIMENT_RUN_TABS.ANALYTICS,
        },
      }}
    >
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="border-border bg-card/50 flex max-w-md flex-col items-center gap-4 rounded-xl border p-8 text-center shadow-sm backdrop-blur-sm">
          <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
            <FlaskConical className="text-muted-foreground h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight">
              {tAuto("analytics_coming_soon_6fcdecd")}{" "}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {tAuto(
                "we_are_working_on_adding_advanced_analytics_capabili_c0d05c0",
              )}{" "}
            </p>
          </div>
        </div>
      </div>
    </Page>
  );
}
