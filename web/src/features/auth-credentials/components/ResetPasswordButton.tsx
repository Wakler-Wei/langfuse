import { signIn, useSession } from "next-auth/react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useState } from "react";
import { z } from "zod";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { env } from "@/src/env.mjs";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function RequestResetPasswordEmailButton({
  email,
  className,
  variant = "default",
  callbackUrl,
}: {
  email: string;
  className?: string;
  variant?: "default" | "secondary";
  callbackUrl?: string;
}) {
  const tAuto = useAutoTranslations();
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const session = useSession();
  const capture = usePostHogClientCapture();
  const isValidEmail = z.email().safeParse(email).success;

  const handleResetPassword = async () => {
    if (!isValidEmail) return;
    capture("auth:reset_password_email_requested");
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const targetCallbackUrl = callbackUrl
        ? `${env.NEXT_PUBLIC_BASE_PATH ?? ""}${callbackUrl}`
        : `${env.NEXT_PUBLIC_BASE_PATH ?? ""}/auth/reset-password`;
      const res = await signIn("email", {
        email: email,
        callbackUrl: targetCallbackUrl,
        redirect: false,
      });
      if (res?.error) {
        setErrorMessage(
          res.error === "AccessDenied"
            ? "This email is not associated with any account."
            : res.error,
        );
      } else if (res?.ok) {
        setIsEmailSent(true);
      }
    } catch (error) {
      console.error("Error sending reset password email:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (_e: React.MouseEvent<HTMLButtonElement>) => {
    if (!code) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const formattedEmail = encodeURIComponent(email.toLowerCase().trim());
      const formattedCode = encodeURIComponent(code.trim());
      const targetCb = callbackUrl
        ? `${env.NEXT_PUBLIC_BASE_PATH ?? ""}${callbackUrl}`
        : `${env.NEXT_PUBLIC_BASE_PATH ?? ""}/auth/reset-password`;
      const callback = encodeURIComponent(targetCb);
      const url = `${env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/auth/callback/email?email=${formattedEmail}&token=${formattedCode}&callbackUrl=${callback}`;
      window.location.href = url;
    } catch (error) {
      console.error("Error verifying code:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isEmailSent ? (
        <div>
          <label htmlFor="otp-code" className="mb-2 block text-sm font-bold">
            {tAuto("check_your_inbox_for_the_code_be7bc16")}{" "}
          </label>
          <Input
            id="otp-code"
            type="number"
            minLength={6}
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.trim())}
            placeholder={tAuto("one_time_passcode_b529178")}
            className="mb-8 w-full"
          />
          <Button
            onClick={handleVerify}
            className={className}
            loading={isLoading}
            disabled={!code || code.length !== 6}
            variant={variant}
          >
            {tAuto("verify_code_91a22c2")}{" "}
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleResetPassword}
          className={className}
          loading={isLoading}
          disabled={!isValidEmail}
          variant={variant}
        >
          {session.status === "authenticated"
            ? tAuto("verify_email_to_change_password_7aa2514")
            : tAuto("request_password_reset_beb3676")}
        </Button>
      )}
      {errorMessage && (
        <div className="text-destructive mt-3 text-center text-sm">
          {errorMessage}
        </div>
      )}
    </>
  );
}
