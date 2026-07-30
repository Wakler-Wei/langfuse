import { useMemo } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Bug,
  Lightbulb,
  Sparkles,
  LibraryBig,
  LifeBuoy,
  Radio,
  Calendar,
} from "lucide-react";
import { SiDiscord, SiGithub } from "react-icons/si";
import { RainbowButton } from "@/src/components/magicui/rainbow-button";
import { Separator } from "@/src/components/ui/separator";
import { usePlan } from "@/src/features/entitlements/hooks";
import { isCloudPlan } from "@langfuse/shared";
import { useUiCustomization } from "@/src/ee/features/ui-customization/useUiCustomization";
import { useLangfuseCloudRegion } from "@/src/features/organizations/hooks";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type SupportType = "in-app-support" | "custom" | "community";

export function IntroSection({ onStartForm }: { onStartForm: () => void }) {
  const tAuto = useAutoTranslations();
  const uiCustomization = useUiCustomization();
  const { isLangfuseCloud } = useLangfuseCloudRegion();
  const capture = usePostHogClientCapture();

  // Note: We previously added an entitlement for in-app support, but removed it for now.
  //       The issue was that on global routes e.g., https://langfuse.com/setup, the entitlement
  //       hook would not have access to an org or project an therefore no plan, always returning
  //       false if asked. However on these pages, the in-app-chat should be available.
  //       Therefore we now check for whether wer are in a cloud deployment instead.
  // const hasInAppSupportEntitlement = useHasEntitlement("in-app-support");
  const hasInAppSupportEntitlement = !!isLangfuseCloud;
  const plan = usePlan();

  const supportType: SupportType = useMemo(() => {
    if (uiCustomization?.supportHref) {
      return "custom";
    }
    if (hasInAppSupportEntitlement) {
      return "in-app-support";
    }
    return "community";
  }, [hasInAppSupportEntitlement, uiCustomization]);

  const showStatusPageLink = useMemo(() => {
    return isCloudPlan(plan);
  }, [plan]);

  return (
    <div className="mt-1 flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-base font-bold">
          <Sparkles className="h-4 w-4" /> {tAuto("ask_ai_8dbaeb8")}{" "}
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          {tAuto(
            "get_instant_helpful_answers_our_ai_knows_the_docs_ex_19caad8",
          )}{" "}
        </p>

        <RainbowButton asChild>
          <a
            href="https://langfuse.com/docs/ask-ai"
            target="_blank"
            rel="noopener"
          >
            {tAuto("chat_with_ai_e6335ee")}{" "}
          </a>
        </RainbowButton>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-base font-bold">
          <LibraryBig className="h-4 w-4" /> {tAuto("docs_68a4194")}{" "}
        </div>
        <p className="text-muted-foreground text-sm">
          {tAuto(
            "dive_into_guides_concepts_and_api_reference_clear_st_f148a40",
          )}{" "}
        </p>

        <Button asChild variant="outline">
          <a
            href={
              uiCustomization?.documentationHref ?? "https://langfuse.com/docs"
            }
            target="_blank"
            rel="noopener"
          >
            {tAuto("view_documentation_e240d7c")}{" "}
          </a>
        </Button>
      </div>

      <Separator />

      {supportType === "custom" && (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-base font-bold">
              <LifeBuoy className="h-4 w-4" /> {tAuto("support_f32d5a3")}{" "}
            </div>
            <p className="text-muted-foreground text-sm">
              {tAuto(
                "ask_ai_docs_did_not_unblock_you_get_in_touch_with_th_7853c92",
              )}{" "}
            </p>
            <Button variant="outline" asChild>
              <a
                href={uiCustomization?.supportHref}
                target="_blank"
                rel="noopener"
              >
                {tAuto("open_support_2243567")}{" "}
              </a>
            </Button>
            {uiCustomization?.feedbackHref && (
              <Button variant="outline" asChild>
                <a
                  href={uiCustomization?.feedbackHref}
                  target="_blank"
                  rel="noopener"
                >
                  {tAuto("submit_feedback_c5a35a7")}{" "}
                </a>
              </Button>
            )}
            {!uiCustomization?.supportHref && (
              <>
                <Button variant="outline" asChild>
                  <a
                    href="https://langfuse.com/ideas"
                    target="_blank"
                    rel="noopener"
                  >
                    {tAuto("feature_request_94ddc39")}{" "}
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a
                    href="https://langfuse.com/issues"
                    target="_blank"
                    rel="noopener"
                  >
                    {tAuto("report_a_bug_fbb446a")}{" "}
                  </a>
                </Button>
              </>
            )}
          </div>

          <Separator />
        </>
      )}

      {supportType === "in-app-support" && (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-base font-bold">
              <LifeBuoy className="h-4 w-4" />{" "}
              {tAuto("email_a_support_engineer_925c985")}{" "}
            </div>
            <p className="text-muted-foreground text-sm">
              {tAuto(
                "ask_ai_docs_did_not_unblock_you_one_of_our_support_e_a13937f",
              )}{" "}
            </p>
            <Button variant="outline" onClick={onStartForm}>
              {tAuto("email_a_support_engineer_925c985")}{" "}
            </Button>
          </div>

          <Separator />
        </>
      )}

      {supportType === "community" && (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-base font-bold">
              <LifeBuoy className="h-4 w-4" />{" "}
              {tAuto("community_support_a018fb7")}{" "}
            </div>
            <p className="text-muted-foreground text-sm">
              {tAuto(
                "ask_ai_docs_did_not_unblock_you_get_help_from_and_sh_7760643",
              )}{" "}
            </p>
            <Button variant="outline" asChild>
              <a
                href="https://langfuse.com/gh-support"
                target="_blank"
                rel="noopener"
              >
                <SiGithub className="mr-2 h-4 w-4" />{" "}
                {tAuto("get_help_e95ef3a")}{" "}
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href="https://langfuse.com/ideas"
                target="_blank"
                rel="noopener"
              >
                <Lightbulb className="mr-2 h-4 w-4" />{" "}
                {tAuto("feature_request_d1061c5")}{" "}
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href="https://langfuse.com/issues"
                target="_blank"
                rel="noopener"
              >
                <Bug className="mr-2 h-4 w-4" />{" "}
                {tAuto("report_a_bug_8423d54")}{" "}
              </a>
            </Button>
          </div>

          <Separator />
        </>
      )}

      {supportType !== "custom" && (
        <div>
          <div className="flex items-center gap-2 text-base font-bold">
            <SiGithub className="h-4 w-4" />{" "}
            {tAuto("community_resources_ba3e46c")}{" "}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {tAuto(
              "join_the_conversation_and_connect_with_the_langfuse__4f29e3a",
            )}{" "}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2">
            <Button asChild variant="ghost" className="justify-start px-1.5">
              <a
                href="https://langfuse.com/gh-support"
                target="_blank"
                rel="noopener"
              >
                <SiGithub className="mr-2 h-4 w-4" />{" "}
                {tAuto("github_548b068")}{" "}
              </a>
            </Button>
            <Button asChild variant="ghost" className="justify-start px-1.5">
              <a
                href="https://langfuse.com/discord"
                target="_blank"
                rel="noopener"
                className="flex items-center"
              >
                <SiDiscord className="mr-2 h-4 w-4" />{" "}
                {tAuto("discord_bea0c40")}{" "}
              </a>
            </Button>
            <Button asChild variant="ghost" className="justify-start px-1.5">
              <a
                href="https://lu.ma/langfuse"
                target="_blank"
                rel="noopener"
                className="flex items-center"
                onClick={() => capture("support_chat:community_hours_click")}
              >
                <Calendar className="mr-2 h-4 w-4" />{" "}
                {tAuto("community_hours_892a589")}{" "}
              </a>
            </Button>

            {showStatusPageLink && (
              <Button asChild variant="ghost" className="justify-start px-1.5">
                <a
                  href="https://status.langfuse.com"
                  target="_blank"
                  rel="noopener"
                  className="flex items-center"
                >
                  <Radio className="mr-2 h-4 w-4" />{" "}
                  {tAuto("status_page_ceb0a14")}{" "}
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
