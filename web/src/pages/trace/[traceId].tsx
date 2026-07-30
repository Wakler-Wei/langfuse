// Redirect helper for /trace/[traceId] URLs
// Looks up the projectId for a trace and redirects to /project/[projectId]/traces/[traceId]
// which displays the current trace view

import { ErrorPage } from "@/src/components/error-page";
import { getTracesByIdsForAnyProject } from "@langfuse/shared/src/server";
import { type GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (!context.params) {
    return {
      props: {
        notFound: true,
      },
    };
  }

  const traceId = context.params.traceId as string;

  const traces = await getTracesByIdsForAnyProject([traceId]);

  if (!traces || traces.length === 0) {
    return {
      props: {
        notFound: true,
      },
    };
  }

  if (traces.length > 1) {
    return {
      props: {
        duplicatesFound: true,
      },
    };
  }

  return {
    redirect: {
      destination: `/project/${traces[0].projectId}/traces/${traceId}`,
      permanent: false,
    },
  };
};

const TraceRedirectPage = ({
  notFound,
  duplicatesFound,
}: {
  notFound?: boolean;
  duplicatesFound?: boolean;
}) => {
  const tAuto = useAutoTranslations();
  const router = useRouter();
  if (router.isFallback) {
    return <div className="p-3">{tAuto("loading_b04ba49")}</div>;
  }

  if (notFound) {
    return (
      <ErrorPage
        title={tAuto("trace_not_found_4b38ada")}
        message={tAuto(
          "the_trace_is_either_still_being_processed_or_has_bee_7598104",
        )}
        additionalButton={{
          label: tAuto("retry_9f5cd8a"),
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  if (duplicatesFound) {
    return (
      <ErrorPage
        title={tAuto("trace_not_found_4b38ada")}
        message={tAuto(
          "please_upgrade_the_sdk_as_the_url_schema_has_changed_4b84727",
        )}
      />
    );
  }

  return null;
};

export default TraceRedirectPage;
