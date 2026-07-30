import { CalendarDays } from "lucide-react";
import { SidebarMenuButton } from "@/src/components/ui/sidebar";
import Link from "next/link";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const BookACallButton = () => {
  const tAuto = useAutoTranslations();
  const capture = usePostHogClientCapture();

  return (
    <SidebarMenuButton asChild>
      <Link
        href="https://cal.com/team/langfuse/welcome-to-langfuse"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          capture("sidebar:book_a_call_clicked");
        }}
      >
        <CalendarDays className="h-4 w-4" />
        {tAuto("book_a_call_4e0f5e5")}{" "}
      </Link>
    </SidebarMenuButton>
  );
};
