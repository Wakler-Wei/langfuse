import { ErrorPageWithSentry } from "@/src/components/error-page";
import { useRouter } from "next/router";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export default function AuthError() {
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const { error } = router.query;
  const errorMessage = error
    ? decodeURIComponent(String(error))
    : tAuto("an_authentication_error_occurred_please_reach_out_to_1854f9e");

  return (
    <ErrorPageWithSentry
      title={tAuto("authentication_error_3515913")}
      message={errorMessage}
    />
  );
}
