import { StringParam, useQueryParam } from "use-query-params";
import { NewPromptForm } from "@/src/features/prompts/components/NewPromptForm";
import useProjectIdFromURL from "@/src/hooks/useProjectIdFromURL";
import { api } from "@/src/utils/api";
import Page from "@/src/components/layouts/page";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const NewPrompt = () => {
  const tAuto = useAutoTranslations();
  const projectId = useProjectIdFromURL();
  const [initialPromptId] = useQueryParam("promptId", StringParam);

  const { data: initialPrompt, isLoading } = api.prompts.byId.useQuery(
    {
      projectId: projectId as string, // Typecast as query is enabled only when projectId is present
      id: initialPromptId ?? "",
    },
    {
      enabled: Boolean(initialPromptId && projectId),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );

  if (isLoading) {
    return <div className="p-3">{tAuto("loading_b04ba49")}</div>;
  }

  const breadcrumb: { name: string; href?: string }[] = [
    {
      name: "Prompts",
      href: `/project/${projectId}/prompts/`,
    },
    {
      name: "New prompt",
    },
  ];

  if (initialPrompt) {
    breadcrumb.pop(); // Remove "New prompt"
    breadcrumb.push(
      {
        name: initialPrompt.name,
        href: `/project/${projectId}/prompts/${encodeURIComponent(initialPrompt.name)}`,
      },
      { name: "New version" },
    );
  }

  return (
    <Page
      withPadding
      scrollable
      headerProps={{
        title: initialPrompt
          ? tAuto("value0_new_version_3f819e4", { value0: initialPrompt.name })
          : tAuto("create_new_prompt_1252bce"),
        help: {
          description: tAuto(
            "manage_and_version_your_prompts_in_langfuse_edit_and_5583509",
          ),
          href: "https://langfuse.com/docs/prompts",
        },
        breadcrumb: breadcrumb,
      }}
    >
      {initialPrompt ? (
        <p className="text-muted-foreground text-sm">
          {tAuto(
            "prompts_are_immutable_in_langfuse_to_update_a_prompt_f2e2a19",
          )}{" "}
        </p>
      ) : null}
      <div className="my-8">
        <NewPromptForm {...{ initialPrompt }} />
      </div>
    </Page>
  );
};
