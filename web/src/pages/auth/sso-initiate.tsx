import { signIn } from "next-auth/react";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ErrorPageWithSentry } from "@/src/components/error-page";
import { Spinner } from "@/src/components/layouts/spinner";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export default function SSOInitiate() {
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for router to be ready
    if (!router.isReady) {
      return;
    }

    const provider = router.query.provider as string | undefined;

    // If provider is missing or empty, show error
    if (!provider || provider === "") {
      setError(
        tAuto("no_sso_provider_specified_please_contact_your_admini_4de678f"),
      );
      return;
    }

    // Automatically trigger sign-in with the provider
    signIn(provider)
      .then(() => {
        // signIn will redirect automatically on success
        // No need to do anything here
      })
      .catch((error) => {
        console.error("SSO initiation error:", error);
        setError(
          error instanceof Error
            ? error.message
            : tAuto(
                "failed_to_initiate_sso_sign_in_please_try_again_or_c_7a0dae7",
              ),
        );
      });
  }, [router.isReady, router.query.provider, tAuto]);

  // Show error page if sign-in failed
  if (error) {
    return (
      <>
        <Head>
          <title>{tAuto("sign_in_error_langfuse_00432e9")}</title>
        </Head>
        <ErrorPageWithSentry
          title={tAuto("sso_sign_in_failed_4f4d975")}
          message={error}
        />
      </>
    );
  }

  // Show loading spinner while processing
  return (
    <>
      <Head>
        <title>{tAuto("signing_in_langfuse_78e2397")}</title>
      </Head>
      <Spinner
        message={tAuto("redirecting_to_your_identity_provider_92c2348")}
      />
    </>
  );
}
