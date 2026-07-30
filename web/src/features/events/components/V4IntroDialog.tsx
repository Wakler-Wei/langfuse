import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function V4IntroDialog({
  open,
  onConfirm,
  onDismiss,
}: {
  open: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDismiss()}>
      <DialogContent
        className="[&>div:last-child]:hidden"
        aria-label={tAuto("welcome_to_a_faster_langfuse_cc3bcc5")}
      >
        <DialogBody>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/v4-beta-intro.jpg"
            alt={tAuto(
              "langfuse_gets_faster_performance_comparison_showing__cf6a8b6",
            )}
            className="w-full rounded-md"
          />
          <ul className="flex flex-col gap-3">
            <li className="text-muted-foreground text-sm">
              <span className="text-foreground block font-bold">
                {tAuto("welcome_to_a_faster_langfuse_cc3bcc5")}{" "}
              </span>{" "}
              We&apos;ve rebuilt the data model around observations rather than
              traces, which means charts, filters, and APIs are dramatically
              faster.
            </li>
            <li className="text-muted-foreground text-sm">
              <span className="text-foreground block font-bold">
                {tAuto("new_observations_table_c758020")}{" "}
              </span>{" "}
              {tAutoI18n(
                "your_traces_are_still_here_the_default_view_now_show_a036f8a",
              )}{" "}
              <span className="font-bold">Is Root Observation &rarr; True</span>
              .
            </li>
            <li className="text-muted-foreground text-sm">
              <span className="text-foreground block font-bold">
                {tAuto("new_saved_table_views_671de75")}{" "}
              </span>{" "}
              {tAutoI18n(
                "save_your_table_filters_as_an_org_wide_saved_view_so_b488c33",
              )}{" "}
              <a
                href="https://langfuse.com/faq/all/explore-observations-in-v4"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold hover:underline"
              >
                Best practices &rarr;
              </a>
            </li>
          </ul>
          <div className="mt-3 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm dark:border-yellow-700 dark:bg-yellow-950">
            <p className="text-yellow-900 dark:text-yellow-200">
              <span className="font-bold">
                {tAuto("want_traces_to_appear_live_a6ef92a")}
              </span>{" "}
              {tAutoI18n(
                "upgrade_your_sdk_to_the_latest_version_older_sdks_st_f8af47b",
              )}{" "}
              <a
                href="https://langfuse.com/docs/observability/sdk/upgrade-path"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline hover:no-underline"
              >
                Upgrade guide &rarr;
              </a>
            </p>
          </div>
        </DialogBody>
        <DialogFooter className="items-center sm:justify-between">
          <a
            href="https://langfuse.com/docs/v4"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-sm font-bold hover:underline"
          >
            Read the v4 docs &rarr;
          </a>
          <Button onClick={onConfirm}>Understood &rarr;</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
