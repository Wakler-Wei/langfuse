import { DetailPageNav } from "@/src/features/navigate-detail-pages/DetailPageNav";
import { useRouter } from "next/router";
import { ErrorPage } from "@/src/components/error-page";
import { TraceDetailActions } from "@/src/components/trace/TraceDetailActions";
import { useTraceDetailData } from "@/src/components/trace/useTraceDetailData";
import Page from "@/src/components/layouts/page";
import {
  TraceDetailBody,
  traceDetailTitle,
} from "@/src/components/trace/TraceDetailBody";
import { useSession } from "next-auth/react";
import { useIsAuthenticatedAndProjectMember } from "@/src/features/auth/hooks";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { stripBasePath } from "@/src/utils/redirect";
import { Badge } from "@/src/components/ui/badge";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { useEffect } from "react";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function TracePage({
  traceId,
  timestamp,
}: {
  traceId: string;
  timestamp?: Date;
}) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const session = useSession();
  const routeProjectId = (router.query.projectId as string) ?? "";

  // Shared, beta-aware fetch (same hook the peek uses).
  const trace = useTraceDetailData({
    projectId: routeProjectId,
    traceId,
    timestamp,
  });

  const projectIdForAccessCheck = trace.data?.projectId ?? routeProjectId;
  const hasProjectAccess = useIsAuthenticatedAndProjectMember(
    projectIdForAccessCheck,
  );

  useEffect(() => {
    if (trace.cutoffObservationsAfterMaxCount) {
      showErrorToast(
        tAutoI18n("trace_truncated_f33652e"),
        tAutoI18n(
          "this_trace_has_too_many_observations_for_the_detail__959f994",
        ),
        "WARNING",
      );
    }
  }, [trace.cutoffObservationsAfterMaxCount, tAutoI18n]);

  if (trace.isUnauthorized)
    return (
      <ErrorPage
        message={tAutoI18n("you_do_not_have_access_to_this_trace_3c8706c")}
      />
    );

  if (trace.isNotFound)
    return (
      <ErrorPage
        title={tAuto("trace_not_found_4b38ada")}
        message={tAutoI18n(
          "the_trace_is_either_still_being_processed_or_has_bee_7598104",
        )}
        additionalButton={{
          label: tAuto("retry_9f5cd8a"),
          onClick: () => window.location.reload(),
        }}
      />
    );

  if (!trace.data) return <div className="p-3">{tAuto("loading_b04ba49")}</div>;

  const isSharedTrace = trace.data.public;
  const showPublicIndicators = isSharedTrace && !hasProjectAccess;
  const encodedTargetPath = encodeURIComponent(
    stripBasePath(router.asPath || "/"),
  );
  const leadingControl = showPublicIndicators ? (
    session.status === "authenticated" ? (
      <Button
        asChild
        size="sm"
        variant="outline"
        title={tAuto("back_to_langfuse_01bae47")}
        className="px-3"
      >
        <Link href="/">Langfuse</Link>
      </Button>
    ) : (
      <Button
        asChild
        size="sm"
        variant="default"
        title={tAuto("sign_in_to_langfuse_c522ec5")}
        className="px-3"
      >
        <Link href={`/auth/sign-in?targetPath=${encodedTargetPath}`}>
          {tAuto("sign_in_ada2e9e")}{" "}
        </Link>
      </Button>
    )
  ) : undefined;
  const sharedBadge = showPublicIndicators ? (
    <Badge variant="outline" className="text-xs font-bold">
      {tAuto("public_dc5eb70")}{" "}
    </Badge>
  ) : undefined;

  return (
    <Page
      headerProps={{
        title: traceDetailTitle(trace.data) ?? trace.data.id,
        itemType: "TRACE",
        breadcrumb: [
          {
            name: "Traces",
            href: `/project/${router.query.projectId as string}/traces`,
          },
        ],
        showSidebarTrigger: !showPublicIndicators,
        leadingControl,
        breadcrumbBadges: sharedBadge,
        actionButtonsRight: (
          <>
            <DetailPageNav
              currentId={traceId}
              path={(entry) => {
                const { view, display, projectId } = router.query;
                const queryParams = new URLSearchParams({
                  ...(typeof view === "string" ? { view } : {}),
                  ...(typeof display === "string" ? { display } : {}),
                });
                const timestamp =
                  entry.params && entry.params.timestamp
                    ? encodeURIComponent(entry.params.timestamp)
                    : undefined;

                if (timestamp) {
                  queryParams.set("timestamp", timestamp);
                }

                const finalQueryString = queryParams.size
                  ? `?${queryParams.toString()}`
                  : "";

                return `/project/${projectId as string}/traces/${entry.id}${finalQueryString}`;
              }}
              listKey="traces"
              size="sm"
            />
            <TraceDetailActions
              traceId={trace.data.id}
              projectId={trace.data.projectId}
              bookmarked={trace.data.bookmarked}
              isPublic={trace.data.public}
              name={trace.data.name}
              timestamp={timestamp}
              deleteRedirectUrl={`/project/${router.query.projectId as string}/traces`}
            />
          </>
        ),
        // Mobile compact header: the same trace actions as full-width labeled
        // menu rows (Bookmark / Share / Delete) for the `⋯` overflow, instead
        // of the inline icon toolbar. Trace-to-trace nav is desktop-only.
        actionButtonsMenu: (
          <TraceDetailActions
            traceId={trace.data.id}
            projectId={trace.data.projectId}
            bookmarked={trace.data.bookmarked}
            isPublic={trace.data.public}
            name={trace.data.name}
            timestamp={timestamp}
            deleteRedirectUrl={`/project/${router.query.projectId as string}/traces`}
            layout="menu"
          />
        ),
      }}
    >
      <div className="flex max-h-full min-h-0 flex-1 overflow-hidden">
        <TraceDetailBody
          trace={trace.data}
          context={router.query.peek !== undefined ? "peek" : "fullscreen"}
        />
      </div>
    </Page>
  );
}
