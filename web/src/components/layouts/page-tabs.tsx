/* eslint-disable @repo/no-style-props */
import { cn } from "@/src/utils/tailwind";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ParsedUrlQuery } from "querystring";
import {
  type AutoMessageKey,
  useAutoTranslations,
} from "@/src/features/i18n/I18nText";

const tabLabelMessageKeys: Record<string, AutoMessageKey> = {
  Analytics: "analytics_25bc962",
  Charts: "charts_8610e3e",
  Dashboards: "dashboards_197565b",
  "Evaluator Library": "evaluator_library_nav_09d67ab",
  Experiments: "experiments_e8f296b",
  Item: "item_nav_7d74f63",
  Items: "items_nav_8b78a60",
  Metrics: "metrics_nav_19c76f4",
  Observations: "observations_461ebaa",
  Outputs: "outputs_nav_290839b",
  Results: "results_612e12d",
  "Running Evaluators": "running_evaluators_nav_b651d5f",
  Scores: "scores_126cb93",
  Traces: "traces_194e807",
  Versions: "versions_a239107",
  Widgets: "widgets_bf8a667",
};

export type TabDefinition = {
  value: string;
  label: string;
  href?: string;
  onClick?: () => void;
  querySelector?: (
    query: ParsedUrlQuery,
  ) => Record<string, string | string[] | undefined>;
  disabled?: boolean;
  className?: string;
};

export type PageTabsProps = {
  tabs: TabDefinition[];
  activeTab: string;
  className?: string;
  listClassName?: string;
  /** Horizontal scroll for narrow viewports (mobile). */
  scrollable?: boolean;
};

/**
 * The page-level tab strip (sub-navigation within a section). Extracted so both
 * the desktop page header and the mobile page-title block can render it.
 */
export const PageTabs = ({
  tabs,
  activeTab,
  className,
  listClassName,
  scrollable = false,
}: PageTabsProps) => {
  const tAuto = useAutoTranslations();
  const router = useRouter();
  return (
    <div className={cn(scrollable && "-mx-1 overflow-x-auto px-1", className)}>
      <div
        className={cn(
          "inline-flex h-8 items-center justify-start",
          listClassName,
        )}
      >
        {tabs.map((tab) => {
          const labelKey = tabLabelMessageKeys[tab.label];
          const label = labelKey ? tAuto(labelKey) : tab.label;
          const tabClassName = cn(
            "hover:bg-muted/50 focus-visible:ring-ring text-muted-foreground font-bold inline-flex h-full items-center justify-center rounded-none border-b-4 border-transparent px-2 py-0.5 text-sm whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden",
            tab.value === activeTab
              ? "border-primary-accent text-foreground bg-transparent shadow-none"
              : "",
            tab.disabled && "pointer-events-none opacity-50",
            tab.className,
          );

          if (tab.onClick) {
            return (
              <button
                key={tab.value}
                type="button"
                onClick={tab.onClick}
                className={tabClassName}
                disabled={tab.disabled}
              >
                {label}
              </button>
            );
          }

          return (
            <Link
              key={tab.value}
              href={{
                pathname: tab.href ?? "",
                query: tab.querySelector?.(router.query),
              }}
              className={tabClassName}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
