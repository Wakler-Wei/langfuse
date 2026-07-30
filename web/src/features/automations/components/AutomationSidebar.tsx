import React from "react";
import { api } from "@/src/utils/api";
import { JobConfigState, type AutomationDomain } from "@langfuse/shared";
import { cn } from "@/src/utils/tailwind";
import { StatusBadge } from "@/src/components/ui/StatusBadge/StatusBadge";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

interface AutomationSidebarProps {
  projectId: string;
  selectedAutomation?: { automationId: string };
  onAutomationSelect: (automation: AutomationDomain) => void;
}

export const AutomationSidebar: React.FC<AutomationSidebarProps> = ({
  projectId,
  selectedAutomation,
  onAutomationSelect,
}) => {
  const tAuto = useAutoTranslations();
  const { data: automations, isLoading } =
    api.automations.getAutomations.useQuery(
      {
        projectId,
      },
      {
        enabled: !!projectId,
      },
    );

  const sidebarWidth = "w-40 sm:w-64";

  if (isLoading) {
    return (
      <div
        className={cn(
          "bg-muted/10 flex h-full flex-col border-r",
          sidebarWidth,
        )}
      >
        <div className="text-muted-foreground p-4 text-center text-sm">
          {tAuto("loading_automations_21843cd")}{" "}
        </div>
      </div>
    );
  }

  if (!automations || automations.length === 0) {
    return (
      <div
        className={cn(
          "bg-muted/10 flex h-full flex-col border-r",
          sidebarWidth,
        )}
      >
        <div className="text-muted-foreground p-4 text-center text-sm">
          {tAuto(
            "no_automations_configured_create_your_first_automati_1f72b9a",
          )}{" "}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("bg-muted/10 flex h-full flex-col border-r", sidebarWidth)}
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-4 pt-4">
          <div className="space-y-2">
            {automations.map((automation) => {
              const isSelected =
                selectedAutomation?.automationId === automation.id;

              return (
                <div
                  key={automation.id}
                  className={cn(
                    "hover:bg-background/50 group relative rounded-lg border p-3 transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background/20",
                  )}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => onAutomationSelect(automation)}
                  >
                    <div className="space-y-2">
                      {/* Top row: Name and Active badge */}
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className="truncate text-sm leading-tight font-bold"
                          title={automation.name}
                        >
                          {automation.name}
                        </h4>
                        {automation.trigger.status === JobConfigState.ACTIVE ? (
                          <StatusBadge type="active" />
                        ) : (
                          <StatusBadge type="inactive" />
                        )}
                      </div>

                      {/* Bottom row: eventSource -> automation type */}
                      <p className="text-muted-foreground text-xs">
                        <span className="font-mono">
                          {automation.trigger.eventSource}
                        </span>
                        {" → "}
                        {automation.action.type === "WEBHOOK"
                          ? tAuto("webhook_3ac2826")
                          : automation.action.type === "SLACK"
                            ? "Slack"
                            : tAuto("annotation_queue_216920e")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
