import React, { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { api } from "@/src/utils/api";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import startCase from "lodash/startCase";
import { getChartTypeDisplayName } from "@/src/features/widgets/chart-library/utils";
import { ChartTypeIllustration } from "@/src/features/widgets/components/ChartTypeIllustration";
import {
  HOME_DASHBOARD_PRESET_IDS,
  type HomeDashboardPresetId,
} from "@langfuse/shared";
import { HOME_PRESET_METADATA } from "@/src/features/dashboard/components/home-preset-registry";
import { type DashboardWidgetChartType } from "@langfuse/shared/src/db";
import { InAppAgentWidgetComposer } from "@/src/features/in-app-agent/components/InAppAgentWidgetComposer";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export type WidgetItem = {
  id: string;
  name: string;
  description: string;
  view: string;
  chartType: string;
  createdAt: Date;
  updatedAt: Date;
};

const rowClassName =
  "flex w-full items-center gap-4 rounded-lg border p-3 text-left hover:bg-accent/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring";

function RowIllustration({ type }: { type: string }) {
  return (
    <div className="bg-muted/40 flex h-14 w-[5.5rem] shrink-0 items-center justify-center rounded-md">
      <ChartTypeIllustration
        type={type as DashboardWidgetChartType | "CUSTOM"}
        className="h-11 w-16"
      />
    </div>
  );
}

function WidgetRow({
  widget,
  onClick,
}: {
  widget: WidgetItem;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={rowClassName}>
      <RowIllustration type={widget.chartType} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold" title={widget.name}>
          {widget.name}
        </div>
        {widget.description ? (
          <div
            className="text-muted-foreground truncate text-xs"
            title={widget.description}
          >
            {widget.description}
          </div>
        ) : null}
        <div className="text-muted-foreground/80 mt-0.5 text-xs">
          {getChartTypeDisplayName(
            widget.chartType as DashboardWidgetChartType,
          )}{" "}
          · {startCase(widget.view.toLowerCase())}
        </div>
      </div>
    </button>
  );
}

interface SelectWidgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSelectWidget: (widget: WidgetItem) => void;
  /** Adds a Langfuse Home card as a preset placement. */
  onSelectPreset?: (presetId: HomeDashboardPresetId) => void;
  dashboardId: string;
}

export function SelectWidgetDialog({
  open,
  onOpenChange,
  projectId,
  onSelectWidget,
  onSelectPreset,
  dashboardId,
}: SelectWidgetDialogProps) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const capture = usePostHogClientCapture();

  const openCapturedRef = useRef(false);
  useEffect(() => {
    if (open && !openCapturedRef.current) {
      capture("dashboard:add_widget_dialog_open", {
        dashboard_id: dashboardId,
      });
    }
    openCapturedRef.current = open;
  }, [open, dashboardId, capture]);

  // Fetch widgets (project-owned and Langfuse-maintained)
  const widgets = api.dashboardWidgets.all.useQuery(
    {
      projectId,
      orderBy: {
        column: "updatedAt",
        order: "DESC",
      },
    },
    {
      enabled: Boolean(projectId) && open,
    },
  );

  const projectWidgets = widgets.data?.widgets ?? [];

  const selectWidget = (widget: WidgetItem) => {
    capture("dashboard:widget_added", {
      kind: "project_widget",
      widget_id: widget.id,
      chart_type: widget.chartType,
      view: widget.view,
      dashboard_id: dashboardId,
    });
    onSelectWidget(widget);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{tAuto("add_widget_dd4416e")}</DialogTitle>
        </DialogHeader>

        <DialogBody>
          {widgets.isPending ? (
            <div className="py-8 text-center">
              {tAuto("loading_widgets_af1a925")}
            </div>
          ) : widgets.isError ? (
            <div className="text-destructive py-8 text-center">
              {tAutoI18n("error_787aa16")} {widgets.error.message}
            </div>
          ) : (
            <div className="flex flex-col gap-3 p-1">
              <InAppAgentWidgetComposer
                onSubmitted={() => onOpenChange(false)}
              />
              <button
                type="button"
                onClick={() => {
                  capture("dashboard:new_widget_form_open", {
                    source: "add_widget_dialog",
                    dashboard_id: dashboardId,
                  });
                  router.push(
                    `/project/${projectId}/widgets/new?dashboardId=${dashboardId}`,
                  );
                }}
                className={`${rowClassName} border-dashed`}
              >
                <RowIllustration type="CUSTOM" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold">
                    {tAuto("custom_chart_a554080")}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {tAuto(
                      "pick_a_data_view_metrics_and_chart_type_from_scratch_dc40a6f",
                    )}{" "}
                  </div>
                </div>
              </button>

              <Tabs
                defaultValue={
                  projectWidgets.length > 0 ? "project" : "home-cards"
                }
                onValueChange={(tab) =>
                  capture("dashboard:add_widget_tab_switch", { tab })
                }
              >
                <TabsList>
                  <TabsTrigger value="project">
                    {tAutoI18n("your_widgets_3f43118")}
                    {projectWidgets.length})
                  </TabsTrigger>
                  {onSelectPreset && (
                    <TabsTrigger value="home-cards">
                      {tAutoI18n("home_cards_6983a9e")}
                      {HOME_DASHBOARD_PRESET_IDS.length})
                    </TabsTrigger>
                  )}
                </TabsList>
                <TabsContent value="project">
                  <div className="flex max-h-[360px] flex-col gap-2 overflow-y-auto p-1">
                    {projectWidgets.length === 0 ? (
                      <div className="text-muted-foreground py-8 text-center text-sm">
                        {tAuto(
                          "no_saved_widgets_in_this_project_yet_build_one_with__7d8df8a",
                        )}{" "}
                      </div>
                    ) : (
                      projectWidgets.map((widget) => (
                        <WidgetRow
                          key={widget.id}
                          widget={widget as WidgetItem}
                          onClick={() => selectWidget(widget as WidgetItem)}
                        />
                      ))
                    )}
                  </div>
                </TabsContent>
                {onSelectPreset && (
                  <TabsContent value="home-cards">
                    <div className="flex max-h-[360px] flex-col gap-2 overflow-y-auto p-1">
                      {HOME_DASHBOARD_PRESET_IDS.map((presetId) => {
                        const meta = HOME_PRESET_METADATA[presetId];
                        return (
                          <button
                            key={presetId}
                            type="button"
                            onClick={() => {
                              onSelectPreset(presetId);
                              onOpenChange(false);
                            }}
                            className={rowClassName}
                          >
                            <RowIllustration type={meta.illustration} />
                            <div className="min-w-0 flex-1">
                              <div
                                className="truncate font-bold"
                                title={meta.name}
                              >
                                {meta.name}
                              </div>
                              <div
                                className="text-muted-foreground truncate text-xs"
                                title={meta.name}
                              >
                                {meta.description}
                              </div>
                              <div className="text-muted-foreground/80 mt-0.5 text-xs">
                                {tAuto(
                                  "home_card_fixed_configuration_3271fb7",
                                )}{" "}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="mt-4">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            {tAuto("cancel_77dfd21")}{" "}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
