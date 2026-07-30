import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type CrashModalProps = {
  description: string;
  sentryEventId?: string;
  showReturnHome: boolean;
  statusCode?: number;
};

export const CrashModal = ({
  description,
  sentryEventId,
  showReturnHome,
  statusCode,
}: CrashModalProps) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  return (
    <div className="border-border bg-card w-full max-w-xl rounded-xl border p-6 shadow-sm sm:p-8">
      <div className="bg-destructive/10 text-destructive flex size-10 items-center justify-center rounded-full">
        <CircleAlert className="size-5" aria-hidden="true" />
      </div>

      <div className="mt-4 min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">
          {tAuto("something_went_wrong_8d886c0")}{" "}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-5">
          {statusCode ? (
            <span className="text-foreground mr-2 font-bold whitespace-nowrap">
              {tAutoI18n("error_7f2f6a1")} {statusCode}
            </span>
          ) : null}
          {description}
        </p>

        {sentryEventId ? (
          <div className="border-border bg-muted/40 mt-5 rounded-lg border p-4">
            <dl>
              <div>
                <dt className="text-muted-foreground text-xs font-bold">
                  {tAuto("error_id_646e746")}{" "}
                </dt>
                <dd className="mt-1.5 font-mono text-xs leading-5 break-all">
                  {sentryEventId}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        {showReturnHome ? (
          <Button asChild className="mt-6">
            <Link href="/">{tAuto("return_home_a3d070b")}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
};
