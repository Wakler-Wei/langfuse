import { api } from "@/src/utils/api";
import Link from "next/link";
import { SidebarMenuButton } from "@/src/components/ui/sidebar";
import { useLangfuseCloudRegion } from "@/src/features/organizations/hooks";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function CloudStatusMenu() {
  const tAuto = useAutoTranslations();
  const { isLangfuseCloud } = useLangfuseCloudRegion();
  const { data, isLoading } = api.cloudStatus.getStatus.useQuery(undefined, {
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    // Refresh status data every 5 minutes, keep response cached for 5 minutes
    refetchInterval: 5 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
    enabled: !!isLangfuseCloud,
  });

  // Skip component rendering if not running on Langfuse Cloud
  if (!isLangfuseCloud) {
    return null;
  }

  // Don't show anything while loading or if there's no incident
  if (isLoading || data?.status === null || data?.status === "operational") {
    return null;
  }

  return (
    <SidebarMenuButton asChild tooltip={tAuto("status_bae7d5b")}>
      <Link
        href="https://status.langfuse.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="relative mx-1 flex h-2 w-2 items-center justify-center">
          <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-yellow-500 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-600"></span>
        </div>
        {tAuto("status_bae7d5b")}{" "}
      </Link>
    </SidebarMenuButton>
  );
}
