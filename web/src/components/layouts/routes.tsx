import { type Flag } from "@/src/features/feature-flags/types";
import { type ProjectScope } from "@langfuse/shared";
import {
  BellRing,
  Database,
  LayoutDashboard,
  LifeBuoy,
  ListTree,
  type LucideIcon,
  Settings,
  UsersIcon,
  TerminalIcon,
  Lightbulb,
  Grid2X2,
  Sparkle,
  FileJson,
  Search,
  Home,
  SquarePercent,
  ClipboardPen,
  Clock,
  Beaker,
} from "lucide-react";
import { type ReactNode } from "react";
import { type Entitlement } from "@/src/features/entitlements/constants/entitlements";
import { type Session } from "next-auth";
import { type OrganizationScope } from "@/src/features/rbac/constants/organizationAccessRights";
import { SupportButton } from "@/src/components/nav/support-button";
import { V4MigrationNavItem } from "@/src/features/v4-migration/V4MigrationNavItem";
import { V4SidebarToggle } from "@/src/features/events/components/V4SidebarToggle";
import { BookACallButton } from "@/src/components/nav/book-a-call-button";
import { SidebarMenuButton } from "@/src/components/ui/sidebar";
import { KeyboardShortcut } from "@/src/components/ui/keyboard-shortcut";
import { useCommandMenu } from "@/src/features/command-k-menu/CommandMenuProvider";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { CloudStatusMenu } from "@/src/features/cloud-status-notification/components/CloudStatusMenu";
import { type ProductModule } from "@/src/ee/features/ui-customization/productModuleSchema";
import { useTranslations } from "next-intl";

export enum RouteSection {
  Main = "main",
  Secondary = "secondary",
}

export enum RouteGroup {
  Observability = "Observability",
  PromptManagement = "Prompt Management",
  Evaluation = "Evaluation",
}

export type NavigationMessageKey =
  | "goTo"
  | "organizations"
  | "projects"
  | "home"
  | "dashboards"
  | "tracing"
  | "sessions"
  | "users"
  | "monitors"
  | "prompts"
  | "playground"
  | "scores"
  | "evaluators"
  | "humanAnnotation"
  | "datasets"
  | "experiments"
  | "upgrade"
  | "cloudStatus"
  | "update"
  | "v4Preview"
  | "settings"
  | "bookACall"
  | "support";

export type Route = {
  title: string;
  translationKey: NavigationMessageKey;
  menuNode?: ReactNode;
  featureFlag?: Flag;
  label?: string | ReactNode;
  projectRbacScopes?: ProjectScope[]; // array treated as OR
  organizationRbacScope?: OrganizationScope;
  icon?: LucideIcon; // ignored for nested routes
  pathname: string; // link
  items?: Array<Route>; // folder
  section?: RouteSection; // which section of the sidebar (top/main/bottom)
  newTab?: boolean; // open in new tab
  entitlements?: Entitlement[]; // entitlements required, array treated as OR
  productModule?: ProductModule; // Product module this route belongs to. Used to show/hide modules via ui customization.
  show?: (p: {
    organization:
      | NonNullable<Session["user"]>["organizations"][number]
      | undefined;
    projectId: string | undefined;
    isLangfuseCloud: boolean;
    v4WriteMode: undefined | "legacy" | "dual" | "events_only"; // undefined until the session has loaded
  }) => boolean;
  group?: RouteGroup; // group this route belongs to (within a section)
};

export const ROUTES: Route[] = [
  {
    title: "Go to...",
    translationKey: "goTo",
    pathname: "", // Empty pathname since this is a dropdown
    icon: Search,
    menuNode: <CommandMenuTrigger />,
    section: RouteSection.Main,
  },
  {
    title: "Organizations",
    translationKey: "organizations",
    pathname: "/",
    icon: Grid2X2,
    show: ({ organization }) => organization === undefined,
    section: RouteSection.Main,
  },
  {
    title: "Projects",
    translationKey: "projects",
    pathname: "/organization/[organizationId]",
    icon: Grid2X2,
    section: RouteSection.Main,
  },
  {
    title: "Home",
    translationKey: "home",
    pathname: `/project/[projectId]`,
    icon: Home,
    section: RouteSection.Main,
  },
  {
    title: "Dashboards",
    translationKey: "dashboards",
    pathname: `/project/[projectId]/dashboards`,
    icon: LayoutDashboard,
    productModule: "dashboards",
    section: RouteSection.Main,
  },
  {
    title: "Tracing",
    translationKey: "tracing",
    icon: ListTree,
    productModule: "tracing",
    group: RouteGroup.Observability,
    section: RouteSection.Main,
    pathname: `/project/[projectId]/traces`,
  },
  {
    title: "Sessions",
    translationKey: "sessions",
    icon: Clock,
    productModule: "tracing",
    group: RouteGroup.Observability,
    section: RouteSection.Main,
    pathname: `/project/[projectId]/sessions`,
  },
  {
    title: "Users",
    translationKey: "users",
    pathname: `/project/[projectId]/users`,
    icon: UsersIcon,
    productModule: "tracing",
    group: RouteGroup.Observability,
    section: RouteSection.Main,
  },
  {
    title: "Monitors",
    translationKey: "monitors",
    pathname: "/project/[projectId]/monitors",
    icon: BellRing,
    projectRbacScopes: ["monitors:read"],
    show: ({ v4WriteMode }) => Boolean(v4WriteMode) && v4WriteMode !== "legacy",
    group: RouteGroup.Observability,
    section: RouteSection.Main,
  },
  {
    title: "Prompts",
    translationKey: "prompts",
    pathname: "/project/[projectId]/prompts",
    icon: FileJson,
    projectRbacScopes: ["prompts:read"],
    productModule: "prompt-management",
    group: RouteGroup.PromptManagement,
    section: RouteSection.Main,
  },
  {
    title: "Playground",
    translationKey: "playground",
    pathname: "/project/[projectId]/playground",
    icon: TerminalIcon,
    productModule: "playground",
    group: RouteGroup.PromptManagement,
    section: RouteSection.Main,
  },
  {
    title: "Scores",
    translationKey: "scores",
    pathname: `/project/[projectId]/scores`,
    group: RouteGroup.Evaluation,
    section: RouteSection.Main,
    icon: SquarePercent,
  },
  {
    title: "Evaluators",
    translationKey: "evaluators",
    icon: Lightbulb,
    productModule: "evaluation",
    projectRbacScopes: ["evalJob:read"],
    group: RouteGroup.Evaluation,
    section: RouteSection.Main,
    pathname: `/project/[projectId]/evals`,
  },
  {
    title: "Human Annotation",
    translationKey: "humanAnnotation",
    pathname: `/project/[projectId]/annotation-queues`,
    projectRbacScopes: ["annotationQueues:read"],
    group: RouteGroup.Evaluation,
    section: RouteSection.Main,
    icon: ClipboardPen,
  },
  {
    title: "Datasets",
    translationKey: "datasets",
    pathname: `/project/[projectId]/datasets`,
    icon: Database,
    productModule: "datasets",
    projectRbacScopes: ["datasets:read"],
    group: RouteGroup.Evaluation,
    section: RouteSection.Main,
  },
  {
    title: "Experiments",
    translationKey: "experiments",
    pathname: `/project/[projectId]/experiments`,
    icon: Beaker,
    featureFlag: "experimentsV4Enabled",
    group: RouteGroup.Evaluation,
    section: RouteSection.Main,
  },
  {
    title: "Upgrade",
    translationKey: "upgrade",
    icon: Sparkle,
    pathname: "/project/[projectId]/settings/billing",
    section: RouteSection.Secondary,
    entitlements: ["cloud-billing"],
    organizationRbacScope: "langfuseCloudBilling:CRUD",
    show: ({ organization }) => organization?.plan === "cloud:hobby",
  },
  {
    title: "Upgrade",
    translationKey: "upgrade",
    icon: Sparkle,
    pathname: "/organization/[organizationId]/settings/billing",
    section: RouteSection.Secondary,
    entitlements: ["cloud-billing"],
    organizationRbacScope: "langfuseCloudBilling:CRUD",
    show: ({ organization }) => organization?.plan === "cloud:hobby",
  },
  {
    title: "Cloud Status",
    translationKey: "cloudStatus",
    section: RouteSection.Secondary,
    pathname: "",
    menuNode: <CloudStatusMenu />,
  },
  {
    title: "Update",
    translationKey: "update",
    pathname: "",
    section: RouteSection.Secondary,
    featureFlag: "v4UpgradeUi",
    show: ({ projectId }) => projectId !== undefined,
    menuNode: <V4MigrationNavItem />,
  },
  {
    title: "V4 Preview",
    translationKey: "v4Preview",
    pathname: "",
    section: RouteSection.Secondary,
    featureFlag: "v4BetaToggleVisible",
    menuNode: <V4SidebarToggle />,
  },
  {
    title: "Settings",
    translationKey: "settings",
    pathname: "/project/[projectId]/settings",
    icon: Settings,
    section: RouteSection.Secondary,
  },
  {
    title: "Settings",
    translationKey: "settings",
    pathname: "/organization/[organizationId]/settings",
    icon: Settings,
    section: RouteSection.Secondary,
  },
  {
    title: "Book a call",
    translationKey: "bookACall",
    section: RouteSection.Secondary,
    pathname: "",
    menuNode: <BookACallButton />,
  },
  {
    title: "Support",
    translationKey: "support",
    icon: LifeBuoy,
    section: RouteSection.Secondary,
    pathname: "", // Empty pathname since this is a dropdown
    menuNode: <SupportButton />,
  },
];

function CommandMenuTrigger() {
  const { setOpen } = useCommandMenu();
  const capture = usePostHogClientCapture();
  const t = useTranslations("Navigation");

  return (
    <SidebarMenuButton
      onClick={() => {
        capture("cmd_k_menu:opened", {
          source: "main_navigation",
        });
        setOpen(true);
      }}
      className="whitespace-nowrap"
    >
      <Search className="h-4 w-4" />
      {t("goTo")}
      <KeyboardShortcut
        className="ml-auto"
        keys={[navigator.userAgent.includes("Mac") ? "⌘" : "Ctrl", "K"]}
      />
    </SidebarMenuButton>
  );
}
