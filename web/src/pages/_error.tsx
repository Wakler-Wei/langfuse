import {
  captureUnderscoreErrorException,
  isEnabled as isSentryEnabled,
} from "@sentry/nextjs";
import Head from "next/head";
import NextErrorComponent, { type ErrorProps } from "next/error";
import type { NextPageContext } from "next";
import { CrashModal } from "@/src/components/CrashModal/CrashModal";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type LangfuseErrorPageProps = ErrorProps & {
  sentryEventId?: string;
  showReturnHome: boolean;
};

const statusTitles: Record<number, string> = {
  400: "Bad Request",
  404: "This page could not be found",
  405: "Method Not Allowed",
  500: "Internal Server Error",
};

const ErrorPage = ({
  hostname,
  sentryEventId,
  showReturnHome,
  statusCode,
  title,
}: LangfuseErrorPageProps) => {
  const tAuto = useAutoTranslations();
  const resolvedTitle =
    title ??
    (statusCode ? statusTitles[statusCode] : undefined) ??
    "An unexpected error has occurred";

  const description = statusCode
    ? `${resolvedTitle}.`
    : tAuto("application_error_a_client_side_exception_has_occurr_45fc248", {
        value0: hostname ? ` while loading ${hostname}` : "",
      });

  const documentTitle = statusCode
    ? `${statusCode}: ${resolvedTitle}`
    : tAuto("application_error_a_client_side_exception_has_occurr_ab30eb0");

  return (
    <>
      <Head>
        <title>{documentTitle}</title>
      </Head>
      <div className="min-h-screen-with-banner bg-background text-foreground flex items-center justify-center px-6 py-10">
        <CrashModal
          description={description}
          sentryEventId={sentryEventId}
          showReturnHome={showReturnHome}
          statusCode={statusCode}
        />
      </div>
    </>
  );
};

ErrorPage.skipAppLayout = true;

ErrorPage.getInitialProps = async (
  context: NextPageContext,
): Promise<LangfuseErrorPageProps> => {
  const errorInitialProps = await NextErrorComponent.getInitialProps(context);
  const sentryEventId = isSentryEnabled()
    ? await captureUnderscoreErrorException(context)
    : undefined;
  const pathname = context.asPath?.split(/[?#]/)[0];

  return {
    ...errorInitialProps,
    sentryEventId,
    showReturnHome: pathname !== "/",
  };
};

export default ErrorPage;
