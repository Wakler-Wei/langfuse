// This page is part of the cloud signup flow and can also be opened directly for local testing.

import Head from "next/head";
import { OnboardingSurvey } from "@/src/features/onboarding/components/OnboardingSurvey";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export default function OnboardingPage() {
  const tAuto = useAutoTranslations();
  return (
    <>
      <Head>
        <title>{tAuto("onboarding_langfuse_9d6695a")}</title>
      </Head>
      <OnboardingSurvey />
    </>
  );
}
