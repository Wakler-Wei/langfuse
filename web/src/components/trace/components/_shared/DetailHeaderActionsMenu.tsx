import { useRouter } from "next/router";
import { CheckIcon, CopyIcon, EllipsisVertical } from "lucide-react";
import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  buildEventsTablePathForObservationType,
  buildEventsTablePathForSpanName,
} from "@/src/features/events/lib/eventsTablePaths";
import { copyTextToClipboard } from "@/src/utils/clipboard";
import { type ObservationType } from "@langfuse/shared";
import { WebCalloutMenuItem } from "@/src/features/web-callouts/components/WebCalloutMenuItem";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type IdItem = {
  name: string;
  id: string;
};

type DetailHeaderActionsMenuProps = {
  idItems: IdItem[];
  observationType?: ObservationType;
  projectId: string;
  spanName?: string;
  webCallout?: {
    traceId: string | null;
    observationId?: string | null;
    sessionId?: string | null;
  };
};

export function DetailHeaderActionsMenu({
  idItems,
  observationType,
  projectId,
  spanName,
  webCallout,
}: DetailHeaderActionsMenuProps) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (textToCopy: string) => {
    copyTextToClipboard(textToCopy);
    setCopiedId(textToCopy);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const shouldShowFilterItem = Boolean(spanName?.trim());

  const href = shouldShowFilterItem
    ? buildEventsTablePathForSpanName({
        currentPath: router.asPath,
        projectId,
        spanName: spanName ?? "",
      })
    : null;

  const typeHref = observationType
    ? buildEventsTablePathForObservationType({
        currentPath: router.asPath,
        projectId,
        observationType,
      })
    : null;

  const filterTypeLabel = observationType
    ? tAutoI18n("type_value0_1d6b578", {
        value0: String((observationType as unknown) ?? ""),
      })
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={tAuto("options_6bf5da9")}
          className="mt-0.5 shrink-0"
          size="icon-xs"
          title={tAuto("options_6bf5da9")}
          variant="ghost"
        >
          <EllipsisVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {webCallout && (
          <>
            <WebCalloutMenuItem
              projectId={projectId}
              traceId={webCallout.traceId}
              observationId={webCallout.observationId}
              sessionId={webCallout.sessionId}
              withSeparator
            />
          </>
        )}
        {(href || typeHref) && (
          <>
            {href && (
              <DropdownMenuItem
                className="text-xs"
                onSelect={() => router.push(href)}
              >
                <span className="max-w-[260px] truncate" title={spanName}>
                  {tAuto("filter_by_30e7189")}{" "}
                  <span className="font-bold">
                    {tAutoI18n("name_0927875")}
                    {spanName}
                  </span>
                </span>
              </DropdownMenuItem>
            )}
            {typeHref && filterTypeLabel && (
              <DropdownMenuItem
                className="text-xs"
                onSelect={() => router.push(typeHref)}
              >
                <span
                  className="max-w-[260px] truncate"
                  title={filterTypeLabel}
                >
                  {tAuto("filter_by_30e7189")}{" "}
                  <span className="font-bold">{filterTypeLabel}</span>
                </span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}
        {idItems.map((item) => (
          <DropdownMenuItem
            key={item.id}
            className="text-xs"
            onSelect={() => handleCopy(item.id)}
          >
            {copiedId === item.id ? (
              <CheckIcon className="text-muted-green mr-2 h-4 w-4" />
            ) : (
              <CopyIcon className="mr-2 h-4 w-4" />
            )}
            <span className="max-w-[260px] truncate" title={item.id}>
              {tAutoI18n("copy_af74f7c")} {item.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
