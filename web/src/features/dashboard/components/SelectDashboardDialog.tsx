import React, { useState } from "react";
import { api } from "@/src/utils/api";
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
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/src/components/ui/table";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export interface SelectDashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSelectDashboard: (dashboardId: string) => void;
  onSkip: () => void;
}

export function SelectDashboardDialog({
  open,
  onOpenChange,
  projectId,
  onSelectDashboard,
  onSkip,
}: SelectDashboardDialogProps) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(
    null,
  );

  const dashboards = api.dashboard.allDashboards.useQuery(
    {
      projectId,
      orderBy: {
        column: "updatedAt",
        order: "DESC",
      },
      page: 0,
      limit: 100,
    },
    {
      enabled: Boolean(projectId) && open,
    },
  );

  const handleAdd = () => {
    if (selectedDashboardId) {
      onSelectDashboard(selectedDashboardId);
      onOpenChange(false);
    }
  };

  const handleSkip = () => {
    onSkip();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {tAuto("select_dashboard_to_add_widget_to_f1f338e")}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="mt-4 max-h-[400px] overflow-y-auto">
            {dashboards.isLoading ? (
              <div className="py-8 text-center">
                {tAuto("loading_dashboards_cdc518b")}
              </div>
            ) : dashboards.isError ? (
              <div className="text-destructive py-8 text-center">
                {tAutoI18n("error_787aa16")} {dashboards.error.message}
              </div>
            ) : dashboards.data?.dashboards.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                {tAuto("no_dashboards_found_026e69c")}{" "}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tAuto("name_709a232")}</TableHead>
                    <TableHead>{tAuto("description_55f8ebc")}</TableHead>
                    <TableHead>{tAuto("updated_f2f8570")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboards.data?.dashboards
                    .filter((d) => d.owner === "PROJECT")
                    .map((d) => (
                      <TableRow
                        key={d.id}
                        onClick={() => setSelectedDashboardId(d.id)}
                        className={`hover:bg-muted cursor-pointer ${
                          selectedDashboardId === d.id ? "bg-muted" : ""
                        }`}
                      >
                        <TableCell density="comfortable" className="font-bold">
                          {d.name}
                        </TableCell>
                        <TableCell
                          density="comfortable"
                          className="truncate"
                          title={d.description}
                        >
                          {d.description}
                        </TableCell>
                        <TableCell density="comfortable">
                          {new Date(d.updatedAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogBody>
        <DialogFooter className="mt-4 flex justify-between">
          <Button variant="outline" onClick={handleSkip}>
            {tAuto("skip_3da4745")}{" "}
          </Button>
          <Button onClick={handleAdd} disabled={!selectedDashboardId}>
            {tAuto("add_to_dashboard_10557b0")}{" "}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
