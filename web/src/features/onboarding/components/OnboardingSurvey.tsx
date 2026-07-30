import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { Button } from "@/src/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { LangfuseIcon } from "@/src/components/design-system/LangfuseIcon/LangfuseIcon";
import Spinner from "@/src/components/design-system/Spinner/Spinner";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { api } from "@/src/utils/api";
import type { SurveyFormData } from "../lib/surveyTypes";
import { useWatchedPromiseCallback } from "@/src/hooks/useWatchedPromiseCallback";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function OnboardingSurvey() {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const { update: updateSession } = useSession();
  const utils = api.useUtils();
  const form = useForm<SurveyFormData>({
    defaultValues: {
      referralSource: undefined,
    },
  });
  const onboardingStatus = api.onboarding.status.useQuery();
  const completeOnboardingMutation = api.onboarding.complete.useMutation();
  const [hasStartedOnboardingCompletion, setHasStartedOnboardingCompletion] =
    useState(false);

  const [finishOnboarding, isFinishingOnboarding] = useWatchedPromiseCallback(
    async (data?: SurveyFormData) => {
      setHasStartedOnboardingCompletion(true);

      try {
        const referralSource = data?.referralSource?.trim();
        const onboardingResult = await completeOnboardingMutation.mutateAsync(
          referralSource ? { referralSource } : undefined,
        );
        utils.onboarding.status.setData(undefined, {
          completed: true,
          redirectTo: onboardingResult.redirectTo,
        });
        await updateSession();
        await router.replace(onboardingResult.redirectTo);
      } catch (error) {
        setHasStartedOnboardingCompletion(false);
        showErrorToast(
          tAutoI18n("failed_to_finish_onboarding_605e39a"),
          error instanceof Error
            ? error.message
            : tAutoI18n("please_try_again_83a6fd7"),
        );
      }
    },
    [completeOnboardingMutation, router, updateSession, utils],
  );

  const [redirectCompletedOnboarding, isRedirectingCompletedOnboarding] =
    useWatchedPromiseCallback(
      async (redirectTo: string) => {
        setHasStartedOnboardingCompletion(true);

        try {
          await router.replace(redirectTo);
        } catch (error) {
          setHasStartedOnboardingCompletion(false);
          showErrorToast(
            tAutoI18n("failed_to_continue_onboarding_90eb1b5"),
            error instanceof Error
              ? error.message
              : tAutoI18n("please_try_again_83a6fd7"),
          );
        }
      },
      [router],
    );

  useEffect(() => {
    if (onboardingStatus.data?.completed && !hasStartedOnboardingCompletion) {
      redirectCompletedOnboarding(onboardingStatus.data.redirectTo).catch(
        () => undefined,
      );
    }
  }, [
    hasStartedOnboardingCompletion,
    onboardingStatus.data,
    redirectCompletedOnboarding,
  ]);

  const onSubmit = useCallback(
    async (data: SurveyFormData) => {
      await finishOnboarding(data);
    },
    [finishOnboarding],
  );

  const currentValue = form.watch("referralSource");
  const isSubmittingSurvey = form.formState.isSubmitting;
  const isCompletingOnboarding =
    hasStartedOnboardingCompletion ||
    isFinishingOnboarding ||
    isRedirectingCompletedOnboarding ||
    onboardingStatus.isLoading ||
    onboardingStatus.data?.completed === true;
  const isBusy = isCompletingOnboarding || isSubmittingSurvey;

  const isEmpty = (v: unknown) =>
    v == null || (typeof v === "string" && v.trim() === "");
  const currentEmpty = isEmpty(currentValue);
  const showSkip = currentEmpty;

  if (isCompletingOnboarding) {
    return (
      <div className="flex flex-1 flex-col py-6 sm:min-h-full sm:justify-start sm:px-6 sm:py-12 lg:px-8">
        <div className="flex items-center justify-center gap-2 sm:mx-auto sm:w-full sm:max-w-md">
          <LangfuseIcon size={32} />
        </div>

        <div className="bg-background mt-6 rounded-lg px-6 py-10 shadow-sm sm:mx-auto sm:mt-16 sm:w-full sm:max-w-[480px] sm:px-12 sm:py-12">
          <div className="flex flex-col items-center text-center">
            <Spinner size="xl" variant="muted" />
            <h1 className="mt-6 text-xl font-bold">
              {tAuto("setting_up_your_project_1eacfe6")}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {tAuto("taking_you_to_tracing_87daf16")}{" "}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (onboardingStatus.isError) {
    return (
      <div className="flex flex-1 flex-col py-6 sm:min-h-full sm:justify-start sm:px-6 sm:py-12 lg:px-8">
        <div className="flex items-center justify-center gap-2 sm:mx-auto sm:w-full sm:max-w-md">
          <LangfuseIcon size={32} />
        </div>

        <div className="bg-background mt-6 rounded-lg px-6 py-10 shadow-sm sm:mx-auto sm:mt-16 sm:w-full sm:max-w-[480px] sm:px-12 sm:py-12">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-xl font-bold">
              {tAuto("failed_to_load_onboarding_128cabe")}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {tAuto("refresh_the_page_to_try_again_51a6d65")}{" "}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col py-6 sm:min-h-full sm:justify-start sm:px-6 sm:py-12 lg:px-8">
      <div className="flex items-center justify-center gap-2 sm:mx-auto sm:w-full sm:max-w-md">
        <LangfuseIcon size={32} />
      </div>

      <div className="bg-background mt-6 rounded-lg px-6 py-6 shadow-sm sm:mx-auto sm:mt-16 sm:w-full sm:max-w-[480px] sm:px-12 sm:py-10">
        <Form {...form}>
          <form
            className="flex h-full flex-col"
            onSubmit={form.handleSubmit(onSubmit)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && currentEmpty) {
                event.preventDefault();
                finishOnboarding(form.getValues()).catch(() => undefined);
              }
            }}
          >
            <div className="flex-1">
              <FormField
                control={form.control}
                name="referralSource"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-xl font-bold">
                      {tAuto("where_did_you_hear_about_us_ef198b8")}{" "}
                    </FormLabel>
                    <FormControl>
                      <Input
                        autoFocus
                        maxLength={500}
                        placeholder={tAuto(
                          "colleague_word_of_mouth_x_reddit_event_62395c9",
                        )}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-6">
              {showSkip ? (
                <Button
                  type="button"
                  onClick={() => {
                    finishOnboarding(form.getValues()).catch(() => undefined);
                  }}
                  variant="ghost"
                  className="w-20"
                  disabled={isBusy}
                >
                  {tAuto("skip_3da4745")}{" "}
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="default"
                  className="w-20"
                  disabled={isBusy}
                >
                  {tAuto("finish_b74bdee")}{" "}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
