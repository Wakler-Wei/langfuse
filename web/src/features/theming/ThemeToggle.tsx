import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/src/utils/tailwind";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function ThemeToggle() {
  const tAuto = useAutoTranslations();
  const { theme, setTheme } = useTheme();
  const capture = usePostHogClientCapture();
  return (
    <div className="flex items-center space-x-1">
      <span className="mr-2">{tAuto("theme_a797e30")}</span>
      <div title={tAuto("light_mode_3d3791a")}>
        <Sun
          className={cn(
            theme === "light" ? "text-primary-accent" : "",
            "text:primary hover:bg-input hover:text-primary-accent h-[1.6rem] w-[1.6rem] rounded-sm p-1",
          )}
          onClick={(e) => {
            e.preventDefault();
            setTheme("light");
            capture("user_settings:theme_changed", {
              theme: "light",
            });
          }}
        />
      </div>
      <div title={tAuto("dark_mode_9cf83d1")}>
        <Moon
          className={cn(
            theme === "dark" ? "text-primary-accent" : "",
            "hover:bg-input hover:text-primary-accent h-[1.6rem] w-[1.6rem] rounded-sm p-1",
          )}
          onClick={(e) => {
            e.preventDefault();
            setTheme("dark");
            capture("user_settings:theme_changed", {
              theme: "dark",
            });
          }}
        />
      </div>
      <div title={tAuto("system_mode_be15ab4")}>
        <Monitor
          className={cn(
            theme === "system" ? "text-primary-accent" : "",
            "hover:bg-input hover:text-primary-accent h-[1.6rem] w-[1.6rem] rounded-sm p-1",
          )}
          onClick={(e) => {
            e.preventDefault();
            setTheme("system");
            capture("user_settings:theme_changed", {
              theme: "system",
            });
          }}
        />
      </div>
    </div>
  );
}
