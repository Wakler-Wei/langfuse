import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { useV4Beta } from "@/src/features/events/hooks/useV4Beta";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { env } from "@/src/env.mjs";
import { api } from "@/src/utils/api";
import { copyTextToClipboard } from "@/src/utils/clipboard";
import { cn } from "@/src/utils/tailwind";
import { trpcErrorToast } from "@/src/utils/trpcErrorToast";
import { type RouterInput } from "@/src/utils/types";
import { CheckIcon, Globe, Link, Share2 } from "lucide-react";
import { useState } from "react";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const PublishTraceSwitch = (props: {
  traceId: string;
  projectId: string;
  timestamp?: Date;
  isPublic: boolean;
  shareUrl?: string;
  size?: "icon" | "icon-xs";
  /** When set, render as a full-width labeled menu item instead of an icon. */
  label?: string;
  /** Hover tooltip for the icon button (suppressed while the popover is open). */
  tooltip?: string;
}) => {
  const { isBetaEnabled } = useV4Beta();
  const capture = usePostHogClientCapture();
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "objects:publish",
  });
  const utils = api.useUtils();
  const traceQueryInput: RouterInput["traces"]["byIdWithObservationsAndScores"] =
    {
      projectId: props.projectId,
      traceId: props.traceId,
      timestamp: props.timestamp,
    };
  const eventsTraceQueryInput: RouterInput["events"]["byTraceId"] = {
    projectId: props.projectId,
    traceId: props.traceId,
    timestamp: props.timestamp,
  };
  const mut = api.traces.publish.useMutation({
    onMutate: async (input) => {
      if (isBetaEnabled) {
        await utils.events.byTraceId.cancel(eventsTraceQueryInput);

        const previousEvents = utils.events.byTraceId.getData(
          eventsTraceQueryInput,
        );

        utils.events.byTraceId.setData(eventsTraceQueryInput, (old) => {
          if (!old) return old;

          return {
            ...old,
            observations: old.observations.map((observation) =>
              !observation.parentObservationId
                ? { ...observation, public: input.public }
                : observation,
            ),
          };
        });

        return { previousEvents };
      }

      await utils.traces.byIdWithObservationsAndScores.cancel(traceQueryInput);

      const previousTrace =
        utils.traces.byIdWithObservationsAndScores.getData(traceQueryInput);

      utils.traces.byIdWithObservationsAndScores.setData(
        traceQueryInput,
        (old) => (old ? { ...old, public: input.public } : old),
      );

      return { previousTrace };
    },
    onError: (err, _input, context) => {
      if (isBetaEnabled) {
        utils.events.byTraceId.setData(
          eventsTraceQueryInput,
          context?.previousEvents,
        );
      } else {
        utils.traces.byIdWithObservationsAndScores.setData(
          traceQueryInput,
          context?.previousTrace,
        );
      }
      trpcErrorToast(err);
    },
    onSuccess: async () => {
      if (!isBetaEnabled) {
        await utils.traces.all.invalidate();
      }
    },
  });

  return (
    <Base
      itemName="trace"
      isPublic={props.isPublic}
      shareUrl={props.shareUrl}
      size={props.size}
      label={props.label}
      tooltip={props.tooltip}
      onChange={(val) => {
        capture("trace_detail:publish_button_click");
        return mut.mutateAsync({
          projectId: props.projectId,
          traceId: props.traceId,
          public: val,
        });
      }}
      isLoading={mut.isPending}
      disabled={!hasAccess}
    />
  );
};

export const PublishSessionSwitch = (props: {
  sessionId: string;
  projectId: string;
  isPublic: boolean;
  size?: "icon" | "icon-xs";
  /** When set, render as a full-width labeled menu item instead of an icon. */
  label?: string;
}) => {
  const capture = usePostHogClientCapture();
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "objects:publish",
  });
  const utils = api.useUtils();
  const mut = api.sessions.publish.useMutation({
    onError: (err) => {
      trpcErrorToast(err);
    },
    onSuccess: async () => {
      await utils.sessions.invalidate();
    },
  });

  return (
    <Base
      itemName="session"
      isPublic={props.isPublic}
      size={props.size}
      label={props.label}
      onChange={(val) => {
        capture("session_detail:publish_button_click");
        return mut.mutateAsync({
          projectId: props.projectId,
          sessionId: props.sessionId,
          public: val,
        });
      }}
      isLoading={mut.isPending}
      disabled={!hasAccess}
    />
  );
};

const getShareUrlWithBasePath = (shareUrl: string) => {
  const basePath = (env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const shouldPrependBasePath =
    Boolean(basePath) &&
    shareUrl.startsWith("/") &&
    !shareUrl.startsWith("//") &&
    shareUrl !== basePath &&
    !shareUrl.startsWith(`${basePath}/`);

  return shouldPrependBasePath ? `${basePath}${shareUrl}` : shareUrl;
};

const Base = (props: {
  itemName: string;
  onChange: (value: boolean) => Promise<unknown>;
  isLoading: boolean;
  isPublic: boolean;
  shareUrl?: string;
  disabled?: boolean;
  size?: "icon" | "icon-xs";
  label?: string;
  tooltip?: string;
}) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const [isCopied, setIsCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const copyUrl = () => {
    setIsCopied(true);
    copyTextToClipboard(
      props.shareUrl
        ? new URL(
            getShareUrlWithBasePath(props.shareUrl),
            window.location.origin,
          ).toString()
        : window.location.href,
    );
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleOnClick = () => {
    if (props.isLoading) return;
    setIsOpen(false);
    props.onChange(!props.isPublic);
  };

  return (
    <div className={cn("flex items-center gap-1", props.label && "w-full")}>
      <div className={cn("text-sm font-bold", props.label && "w-full")}>
        <Popover
          open={isOpen}
          onOpenChange={(open) => {
            if (!props.isLoading) setIsOpen(open);
          }}
        >
          {(() => {
            const trigger = (
              <PopoverTrigger asChild>
                <Button
                  id="publish-trace"
                  variant="ghost"
                  size={props.label ? "sm" : props.size}
                  className={
                    props.label
                      ? "w-full justify-start gap-2 font-normal"
                      : undefined
                  }
                  loading={props.isLoading}
                  disabled={props.disabled}
                >
                  {props.isPublic ? (
                    <Globe
                      className="h-4 w-4"
                      fill="#b3d9ff"
                      stroke="#4d94ff"
                      strokeWidth={2}
                    />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  {props.label ? (
                    <span className="text-sm">{props.label}</span>
                  ) : null}
                </Button>
              </PopoverTrigger>
            );
            if (!props.tooltip) return trigger;
            // Suppress the hover tooltip while the share popover is open.
            return (
              <Tooltip open={isOpen ? false : undefined}>
                <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                <TooltipContent>{props.tooltip}</TooltipContent>
              </Tooltip>
            );
          })()}
          <PopoverContent className="flex flex-col gap-3">
            {props.isPublic ? (
              <>
                <Label className="text-base capitalize">
                  {props.itemName} {tAutoI18n("shared_50d0d8d")}{" "}
                </Label>
                <span className="text-muted-foreground text-sm">
                  {tAutoI18n("this_7971e6a")} {props.itemName}{" "}
                  {tAutoI18n(
                    "is_public_anyone_with_the_link_can_view_this_a24e3dd",
                  )}{" "}
                  {props.itemName}.
                </span>
                <div className="mr-2 flex items-center justify-end gap-2 text-sm">
                  <Button variant="outline" size="sm" onClick={copyUrl}>
                    {isCopied ? (
                      <>
                        <CheckIcon size={12} className="mr-1" />
                        {tAuto("copied_8e3df45")}{" "}
                      </>
                    ) : (
                      <>
                        <Link size={12} className="mr-1" />
                        {tAuto("copy_af74f7c")}{" "}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive-secondary"
                    size="sm"
                    loading={props.isLoading}
                    onClick={handleOnClick}
                  >
                    {tAuto("unshare_a320b71")}{" "}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Label className="text-base capitalize">
                  {props.itemName} {tAutoI18n("private_237dfa0")}{" "}
                </Label>
                <span className="text-muted-foreground text-sm">
                  {tAutoI18n("this_7971e6a")} {props.itemName}{" "}
                  {tAutoI18n(
                    "is_private_only_authorized_project_members_can_view__44f2701",
                  )}{" "}
                  {props.itemName}.
                </span>
                <div className="mr-2 flex items-center justify-end gap-2 text-sm">
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={props.isLoading}
                    onClick={handleOnClick}
                  >
                    {tAuto("share_09ca55c")}{" "}
                  </Button>
                </div>
              </>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
