import { Input } from "@/src/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { type UseFormReturn } from "react-hook-form";
import { type ActionDomain } from "@langfuse/shared";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

interface GitHubDispatchActionFormProps {
  form: UseFormReturn<any>;
  disabled: boolean;
  projectId: string;
  action?: ActionDomain;
}

export const GitHubDispatchActionForm: React.FC<
  GitHubDispatchActionFormProps
> = ({ form, disabled }) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const displayGitHubToken = form.watch("githubDispatch.displayGitHubToken");

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="githubDispatch.url"
        rules={{ required: "Repository Dispatch URL is required" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center">
              {tAutoI18n("repository_dispatch_url_9a28dda")}{" "}
              <span className="text-destructive ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="https://api.github.com/repos/owner/repo/dispatches"
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormDescription>
              {tAutoI18n("github_api_endpoint_for_repository_dispatch_dece469")}{" "}
              <Link
                href="https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center hover:underline"
              >
                {tAuto("learn_more_824d76b")}{" "}
                <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="githubDispatch.eventType"
        rules={{ required: "Event type is required" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center">
              {tAuto("event_type_2e1d8fd")}{" "}
              <span className="text-destructive ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder={tAuto("prompt_update_593a99e")}
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormDescription>
              {tAutoI18n(
                "event_type_for_github_actions_workflow_triggers_this_5c392c8",
              )}{" "}
              <code className="text-xs">on.repository_dispatch.types</code>{" "}
              {tAutoI18n("filter_in_your_workflow_file_cacdcf9")}{" "}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="githubDispatch.githubToken"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center">
              {tAutoI18n("github_personal_access_token_d883b4e")}{" "}
              {!displayGitHubToken && (
                <span className="text-destructive ml-1">*</span>
              )}
            </FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder={displayGitHubToken || tAuto("ghp_0f6e2b1")}
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormDescription>
              {tAutoI18n("github_pat_with_717e201")}{" "}
              <code className="text-xs">repo</code>{" "}
              {tAutoI18n("scope_for_repository_dispatch_04eaed9")}{" "}
              {displayGitHubToken
                ? tAutoI18n("leave_empty_to_keep_existing_token_301bae0")
                : ""}{" "}
              <Link
                href="https://github.com/settings/tokens/new?scopes=repo&description=Langfuse%20Automation"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center hover:underline"
              >
                {tAuto("create_token_4b3c8e3")}{" "}
                <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

// Schema exported for use in automationForm.tsx
export const githubDispatchSchema = {
  url: "",
  eventType: "",
  githubToken: "",
};
