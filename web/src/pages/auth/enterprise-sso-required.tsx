import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { LangfuseIcon } from "@/src/components/design-system/LangfuseIcon/LangfuseIcon";
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
import { env } from "@/src/env.mjs";
import { captureUnknownError } from "@/src/utils/captureUnknownError";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

const enterpriseSsoFormSchema = z.object({
  email: z.email(),
});

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  "github-enterprise": "GitHub Enterprise",
  gitlab: "GitLab",
  "azure-ad": "Azure AD",
  okta: "Okta",
  authentik: "Authentik",
  onelogin: "OneLogin",
  auth0: "Auth0",
  cognito: "Cognito",
  keycloak: "Keycloak",
  workos: "WorkOS",
  wordpress: "WordPress",
  custom: "Custom OAuth",
};

export default function EnterpriseSsoRequiredPage() {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailFromQuery =
    typeof router.query.email === "string" ? router.query.email : "";
  const attemptedProvider =
    typeof router.query.attemptedProvider === "string"
      ? router.query.attemptedProvider
      : undefined;
  const callbackUrl =
    typeof router.query.callbackUrl === "string"
      ? router.query.callbackUrl
      : undefined;

  const friendlyProviderName = useMemo(() => {
    if (!attemptedProvider) return undefined;
    return (
      PROVIDER_LABELS[attemptedProvider] ?? attemptedProvider.replace(/-/g, " ")
    );
  }, [attemptedProvider]);

  const form = useForm<z.infer<typeof enterpriseSsoFormSchema>>({
    resolver: zodResolver(enterpriseSsoFormSchema),
    defaultValues: {
      email: emailFromQuery,
    },
  });

  useEffect(() => {
    if (emailFromQuery) {
      form.setValue("email", emailFromQuery);
    }
  }, [emailFromQuery, form]);

  async function onSubmit(values: z.infer<typeof enterpriseSsoFormSchema>) {
    setError(null);
    setLoading(true);

    const domain = values.email.split("@")[1]?.toLowerCase();
    if (!domain) {
      form.setError("email", { message: "Invalid email address" });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/auth/check-sso`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain }),
        },
      );

      if (response.ok) {
        const { providerId } = (await response.json()) as {
          providerId: string;
        };
        await signIn(providerId, {
          callbackUrl,
        });
        return;
      }

      if (response.status === 404) {
        setError(
          tAutoI18n(
            "we_couldn_t_find_a_custom_enterprise_sso_configurati_73405b1",
          ),
        );
        return;
      }

      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setError(
        data?.message ??
          tAutoI18n(
            "unable_to_start_the_enterprise_sso_sign_in_flow_plea_98514a4",
          ),
      );
    } catch (err) {
      captureUnknownError("auth.enterpriseSso", err);
      setError(
        tAutoI18n(
          "something_went_wrong_while_checking_your_enterprise__5639f3d",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  const description = friendlyProviderName
    ? tAutoI18n(
        "you_tried_signing_in_with_value0_but_this_domain_req_f84d78e",
        { value0: String((friendlyProviderName as unknown) ?? "") },
      )
    : tAutoI18n("this_domain_requires_your_company_s_custom_enterpris_7bfd357");

  return (
    <>
      <Head>
        <title>{tAuto("enterprise_sso_required_langfuse_743ec1f")}</title>
      </Head>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="mx-auto w-fit">
            <LangfuseIcon />
          </div>
          <h1 className="text-primary mt-6 text-center text-2xl font-bold">
            {tAuto("use_your_enterprise_sso_ea4ba99")}{" "}
          </h1>
          <p className="text-muted-foreground mt-2 text-center text-sm leading-6">
            {description}{" "}
            {tAutoI18n(
              "enter_your_company_email_so_we_can_send_you_to_the_c_81df847",
            )}{" "}
          </p>
        </div>

        <div className="border-border bg-card mt-10 rounded-lg border px-6 py-8 shadow-sm sm:mx-auto sm:w-full sm:max-w-md">
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAuto("email_84add5b")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="jsdoe@example.com"
                        allowPasswordManager
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                loading={loading}
                disabled={loading}
              >
                {tAuto("continue_with_enterprise_sso_1689cdc")}{" "}
              </Button>
            </form>
          </Form>
          {error ? (
            <div className="text-destructive mt-4 text-center text-sm font-bold">
              {error}
              <br />
              {tAutoI18n("contact_b37456c")}{" "}
              <a
                href="mailto:support@langfuse.com"
                className="text-link hover:text-link-hover"
              >
                {tAuto("support_langfuse_com_94850d7")}{" "}
              </a>{" "}
              {tAutoI18n("if_this_keeps_happening_34d4d55")}{" "}
            </div>
          ) : null}
          <div className="text-muted-foreground mt-6 text-center text-sm">
            <Link
              href="/auth/sign-in"
              className="text-link hover:text-link-hover"
            >
              {tAuto("back_to_other_sign_in_options_1f63abe")}{" "}
            </Link>
          </div>
        </div>

        <div className="text-muted-foreground mt-4 text-center text-xs">
          {tAutoI18n("need_help_contact_db9b822")}{" "}
          <a
            href="mailto:support@langfuse.com"
            className="text-link hover:text-link-hover"
          >
            {tAuto("support_langfuse_com_94850d7")}{" "}
          </a>
          .
        </div>
      </div>
    </>
  );
}
