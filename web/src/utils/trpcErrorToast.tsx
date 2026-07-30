import { TRPCClientError } from "@trpc/client";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { I18nText } from "@/src/features/i18n/I18nText";

// Catch network level errors, e.g. by proxy rate-limiting

/**
 * Check if error was caused by a response parsing failure.
 * This happens when infrastructure (nginx, cloudflare, etc.) returns a non-JSON
 * response body (e.g., empty body on 431, HTML error page on 502/503/504).
 */
const isResponseParseError = (error: TRPCClientError<any>): boolean => {
  return error.cause instanceof SyntaxError;
};

const httpStatusOverride: Record<number, keyof typeof errorTitleMap> = {
  429: "TOO_MANY_REQUESTS",
  524: "TIMEOUT",
};

const errorTitleMap = {
  BAD_REQUEST: <I18nText id="bad_request_dcc35bd" />,
  UNAUTHORIZED: <I18nText id="unauthorized_773e5cb" />,
  FORBIDDEN: <I18nText id="forbidden_9d84e76" />,
  NOT_FOUND: <I18nText id="not_found_9d1ead7" />,
  TIMEOUT: <I18nText id="timeout_1e14c55" />,
  CONFLICT: <I18nText id="conflict_5e1b3cb" />,
  PRECONDITION_FAILED: <I18nText id="precondition_failed_d4d25f8" />,
  PAYLOAD_TOO_LARGE: <I18nText id="payload_too_large_200b0f6" />,
  METHOD_NOT_SUPPORTED: <I18nText id="method_not_supported_7fd2213" />,
  UNPROCESSABLE_CONTENT: <I18nText id="unprocessable_content_48c730b" />,
  TOO_MANY_REQUESTS: <I18nText id="too_many_requests_53a882b" />,
  CLIENT_CLOSED_REQUEST: <I18nText id="client_closed_request_029285d" />,
  INTERNAL_SERVER_ERROR: <I18nText id="internal_server_error_7af863a" />,
  SERVICE_UNAVAILABLE: <I18nText id="internal_server_error_7af863a" />,
} as const;

const getErrorTitleAndHttpCode = (error: TRPCClientError<any>) => {
  const httpStatus: number =
    typeof error.data?.httpStatus === "number" ? error.data.httpStatus : 500;

  if (
    httpStatus === 422 &&
    error.data?.errorName === "ClickHouseResourceError"
  ) {
    // Handle ClickHouse resource limit errors with specific messaging
    return {
      errorTitle: <I18nText id="request_timed_out_567570e" />,
      httpStatus,
    };
  }

  if (httpStatus in httpStatusOverride) {
    return {
      errorTitle: errorTitleMap[httpStatusOverride[httpStatus]],
      httpStatus,
    };
  }

  const errorTitle =
    error.data?.code in errorTitleMap ? (
      errorTitleMap[error.data?.code as keyof typeof errorTitleMap]
    ) : (
      <I18nText id="unexpected_error_ace8466" />
    );

  return { errorTitle, httpStatus };
};

const getErrorDescription = (httpStatus: number) => {
  switch (httpStatus) {
    case 429:
      return <I18nText id="rate_limit_hit_try_later_90b73b8" />;
    case 524:
      return <I18nText id="request_took_too_long_try_later_29eb0aa" />;
    default:
      // Check if it's a 5xx server error
      if (httpStatus >= 500 && httpStatus < 600) {
        return <I18nText id="internal_server_error_support_72a1c53" />;
      }
      return <I18nText id="internal_error_73a7d90" />;
  }
};

export const trpcErrorToast = (error: unknown) => {
  if (error instanceof TRPCClientError) {
    // Handle infrastructure-level errors that return non-JSON responses
    // (e.g., 431 with empty body, 502/503/504 with HTML error pages)
    if (isResponseParseError(error)) {
      showErrorToast(
        <I18nText id="unexpected_response_627d0f7" />,
        <I18nText id="request_could_not_be_completed_12e84b7" />,
        "WARNING",
      );
      return;
    }

    const { errorTitle, httpStatus } = getErrorTitleAndHttpCode(error);

    const path = error.data?.path;
    const description = getErrorDescription(httpStatus);

    showErrorToast(
      errorTitle,
      error.message ?? description,
      httpStatus >= 500 && httpStatus < 600 ? "ERROR" : "WARNING",
      path,
    );
  } else {
    showErrorToast(
      <I18nText id="unexpected_error_ace8466" />,
      <I18nText id="unexpected_error_occurred_0c2bd15" />,
      "ERROR",
    );
  }
};
