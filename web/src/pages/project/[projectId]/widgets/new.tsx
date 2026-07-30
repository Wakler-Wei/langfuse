import { useRouter } from "next/router";
import Page from "@/src/components/layouts/page";
import { api } from "@/src/utils/api";
import { type WidgetChartConfig, WidgetForm } from "@/src/features/widgets";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { type DashboardWidgetChartType } from "@langfuse/shared/src/db";
import { type metricAggregations, type views } from "@langfuse/shared/query";
import { type z } from "zod";
import { SelectDashboardDialog } from "@/src/features/dashboard/components/SelectDashboardDialog";
import { useState } from "react";
import { useV4Beta } from "@/src/features/events/hooks/useV4Beta";
import { getDefaultView } from "@/src/features/widgets/utils";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export default function NewWidget() {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const { projectId, dashboardId } = router.query as {
    projectId: string;
    dashboardId?: string;
  };
  const { isBetaEnabled } = useV4Beta();

  const createWidgetMutation = api.dashboardWidgets.create.useMutation({
    onSuccess: (data) => {
      showSuccessToast({
        title: tAuto("widget_created_successfully_e4196aa"),
        description: tAuto("your_widget_has_been_created_1060573"),
      });

      if (dashboardId) {
        router.push(
          `/project/${projectId}/dashboards/${dashboardId}?addWidgetId=${data.widget.id}`,
        );
      } else {
        setPendingWidgetId(data.widget.id); // store for dialog
        setDashboardDialogOpen(true);
      }
    },
    onError: (error) => {
      showErrorToast(tAutoI18n("failed_to_save_widget_7307900"), error.message);
    },
  });

  const handleSaveWidget = (widgetData: {
    name: string;
    description: string;
    view: string;
    dimensions: { field: string }[];
    metrics: { measure: string; agg: string }[];
    filters: any[];
    chartType: DashboardWidgetChartType;
    chartConfig: WidgetChartConfig;
    minVersion: number;
  }) => {
    if (!widgetData.name.trim()) {
      showErrorToast(
        tAutoI18n("error_7f2f6a1"),
        tAutoI18n("widget_name_is_required_de4eb75"),
      );
      return;
    }

    // Prepare the widget data
    createWidgetMutation.mutate({
      projectId,
      name: widgetData.name,
      description: widgetData.description,
      view: widgetData.view as z.infer<typeof views>,
      dimensions: widgetData.dimensions,
      metrics: widgetData.metrics.map((metric) => ({
        measure: metric.measure,
        agg: metric.agg as z.infer<typeof metricAggregations>,
      })),
      filters: widgetData.filters,
      chartType: widgetData.chartType,
      chartConfig: widgetData.chartConfig,
      minVersion: widgetData.minVersion,
    });
  };

  const [dashboardDialogOpen, setDashboardDialogOpen] = useState(false);
  const [pendingWidgetId, setPendingWidgetId] = useState<string | null>(null);

  return (
    <Page
      withPadding
      headerProps={{
        title: tAuto("new_widget_922c50c"),
        help: {
          description: tAuto("create_a_new_widget_49a4313"),
        },
      }}
    >
      <WidgetForm
        // No `key` on the beta flag: WidgetForm derives viewVersion (and its
        // available views/measures/filter columns) reactively from isBetaEnabled
        // + the selected view, so a live beta toggle re-derives them without a
        // remount — preserving the in-progress form. The only tradeoff is that
        // an untouched form's default view no longer auto-switches on toggle;
        // the initial mount still seeds the beta-aware default view below.
        projectId={projectId}
        onSave={handleSaveWidget}
        initialValues={{
          name: "",
          description: "",
          view: getDefaultView(isBetaEnabled),
          dimension: "none",
          measure: "count",
          aggregation: "count",
          filters: [],
          chartType: "LINE_TIME_SERIES",
          chartConfig: { type: "LINE_TIME_SERIES" },
        }}
        widgetId={undefined}
      />
      {pendingWidgetId && (
        <SelectDashboardDialog
          open={dashboardDialogOpen}
          onOpenChange={setDashboardDialogOpen}
          projectId={projectId}
          onSelectDashboard={(dashboardId) => {
            router.push(
              `/project/${projectId}/dashboards/${dashboardId}?addWidgetId=${pendingWidgetId}`,
            );
          }}
          onSkip={() => {
            router.push(`/project/${projectId}/widgets`);
          }}
        />
      )}
    </Page>
  );
}
