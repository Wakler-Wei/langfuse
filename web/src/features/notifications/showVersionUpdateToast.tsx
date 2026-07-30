import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
import { I18nText } from "@/src/features/i18n/I18nText";

export const showVersionUpdateToast = () => {
  toast.custom(
    () => (
      <div className="flex justify-between">
        <div className="flex min-w-[300px] flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="text-foreground/70 m-0 text-sm leading-tight font-bold">
              <I18nText id="we_have_released_a_new_version_of_langfuse_please_re_372ceca" />{" "}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-foreground/50"
            onClick={() => {
              window.location.reload();
            }}
          >
            <I18nText id="refresh_page_4651e84" />{" "}
          </Button>
        </div>
      </div>
    ),
    {
      duration: Infinity,
      style: {
        padding: "1rem",
        borderRadius: "0.5rem",
        border: "1px solid hsl(var(--border))",
        backgroundColor: "hsl(var(--border))",
      },
    },
  );
};
