import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Head from "next/head";
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
import { PasswordInput } from "@/src/components/ui/password-input";
import { LangfuseIcon } from "@/src/components/design-system/LangfuseIcon/LangfuseIcon";
import { useSession } from "next-auth/react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { api } from "@/src/utils/api";
import { useRouter } from "next/router";
import { RequestResetPasswordEmailButton } from "@/src/features/auth-credentials/components/ResetPasswordButton";
import { TRPCClientError } from "@trpc/client";
import { isEmailVerifiedWithinCutoff } from "@/src/features/auth-credentials/lib/credentialsUtils";
import Link from "next/link";
import { ErrorPage } from "@/src/components/error-page";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { passwordSchema } from "@/src/features/auth/lib/signupSchema";
import { useLangfuseCloudRegion } from "@/src/features/organizations/hooks";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

const resetPasswordSchema = z
  .object({
    email: z.email(),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function ResetPasswordPage({
  passwordResetAvailable,
}: {
  passwordResetAvailable: boolean;
}) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const session = useSession();
  const router = useRouter();
  const { isLangfuseCloud, region } = useLangfuseCloudRegion();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showResetPasswordEmailButton, setShowResetPasswordEmailButton] =
    useState(false);

  const capture = usePostHogClientCapture();

  // Detect set mode: user exists but has no password (signup email verification flow)
  const isSetMode = session.data?.user?.hasPassword === false;

  const mutResetPassword = api.credentials.resetPassword.useMutation();
  const emailVerified = isEmailVerifiedWithinCutoff(
    session.data?.user?.emailVerified,
  );

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: session.data?.user?.email ?? "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    setFormError(null);
    setShowResetPasswordEmailButton(false);
    setIsSuccess(false);
    capture(
      isSetMode
        ? "auth:set_password_form_submit"
        : "auth:update_password_form_submit",
    );
    await mutResetPassword
      .mutateAsync({ password: values.password })
      .then(() => {
        setIsSuccess(true);
        setTimeout(() => {
          const target =
            isSetMode && isLangfuseCloud && region !== "DEV"
              ? "/onboarding"
              : "/";
          router.push(target);
          setIsSuccess(false);
        }, 2000);
      })
      .catch((error) => {
        console.log(error.message);
        if (error instanceof TRPCClientError) {
          if (error.data?.code === "UNAUTHORIZED") {
            setShowResetPasswordEmailButton(true);
          }
          setFormError(error.message);
        } else {
          console.error(error);
          setFormError("An unknown error occurred");
        }
      });
  }

  if (!passwordResetAvailable)
    return (
      <ErrorPage
        title={tAuto("not_available_d1a17af")}
        message={tAutoI18n(
          "password_reset_is_not_configured_on_this_instance_2593d77",
        )}
        additionalButton={{
          label: tAuto("setup_instructions_12abb23"),
          href: "https://langfuse.com/self-hosting/security/authentication-and-sso#auth-email-password",
        }}
      />
    );

  const title = isSetMode
    ? tAutoI18n("set_your_password_4f9f9c1")
    : tAutoI18n("reset_your_password_bf8804f");
  const pageTitle = isSetMode
    ? tAutoI18n("set_password_e8470ca")
    : tAutoI18n("reset_password_3fb75e3");
  const submitLabel = isSetMode
    ? tAutoI18n("set_password_94408e4")
    : tAutoI18n("update_password_61dcf34");
  const successMessage = isSetMode
    ? tAutoI18n("password_set_successfully_redirecting_d78bc37")
    : tAutoI18n("password_successfully_updated_redirecting_e93ad43");

  return (
    <>
      <Head>
        <title>
          {pageTitle} {tAutoI18n("langfuse_0fc32b5")}
        </title>
      </Head>
      <div className="flex flex-1 flex-col py-6 sm:min-h-full sm:justify-center sm:px-6 sm:py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link href="/">
            <div className="mx-auto w-fit">
              <LangfuseIcon />
            </div>
          </Link>
          <h2 className="text-primary mt-4 text-center text-2xl leading-9 font-bold tracking-tight">
            {title}
          </h2>
          {!isSetMode && session.status !== "authenticated" && (
            <div className="mt-2 flex justify-center">
              <Button asChild variant="ghost">
                <Link href="/auth/sign-in">
                  <ArrowLeft className="mr-2 h-3 w-3" />
                  {tAuto("back_to_sign_in_4da8216")}{" "}
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="bg-background mt-10 px-6 py-10 shadow-sm sm:mx-auto sm:w-full sm:max-w-[480px] sm:rounded-lg sm:px-12">
          <div className="space-y-6">
            <Form {...form}>
              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tAuto("email_84add5b")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="jsdoe@example.com"
                            disabled={session.status === "authenticated"}
                            allowPasswordManager
                            autoComplete="email"
                            {...field}
                          />
                          {emailVerified.verified && (
                            <span title={tAuto("email_verified_82f47c3")}>
                              <ShieldCheck className="text-muted-green absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 transform" />
                            </span>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {emailVerified.verified && (
                  <>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {isSetMode
                              ? tAutoI18n("password_8be3c94")
                              : tAutoI18n("new_password_4894cb3")}
                          </FormLabel>
                          <FormControl>
                            <PasswordInput
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {isSetMode
                              ? tAutoI18n("confirm_password_c2d404c")
                              : tAutoI18n("confirm_new_password_68dcd71")}
                          </FormLabel>
                          <FormControl>
                            <PasswordInput
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                <div className="pt-4">
                  {emailVerified.verified ? (
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={mutResetPassword.isPending}
                      loading={mutResetPassword.isPending}
                      variant={
                        showResetPasswordEmailButton ? "secondary" : "default"
                      }
                    >
                      {submitLabel}
                    </Button>
                  ) : (
                    <RequestResetPasswordEmailButton
                      email={form.watch("email")}
                      className="w-full"
                      callbackUrl={
                        isSetMode ? "/auth/setup-password" : undefined
                      }
                    />
                  )}
                </div>
              </form>
            </Form>
            {formError ? (
              <div className="text-destructive text-center text-sm font-bold">
                {formError}
              </div>
            ) : null}
            {isSuccess && (
              <div className="text-center text-sm font-bold">
                {successMessage}
              </div>
            )}
            {showResetPasswordEmailButton && (
              <RequestResetPasswordEmailButton
                email={form.getValues("email")}
                className="w-full"
                callbackUrl={isSetMode ? "/auth/setup-password" : undefined}
              />
            )}
          </div>
        </div>
        {!isSetMode && session.status !== "authenticated" && (
          <div className="text-muted-foreground mx-auto mt-10 max-w-lg text-center text-xs">
            {tAutoI18n(
              "you_will_only_receive_an_email_if_an_account_with_th_6a7aa2a",
            )}{" "}
            <Link href="/auth/sign-in" className="underline">
              {tAuto("sign_in_44922d1")}{" "}
            </Link>
            .
          </div>
        )}
      </div>
    </>
  );
}
