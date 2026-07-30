import Header from "@/src/components/layouts/header";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { CodeBlock } from "@/src/components/design-system/Codeblock/Codeblock";
import Link from "next/link";
import { Bot, SquareTerminal, Sparkles } from "lucide-react";
import { I18nText, useAutoTranslations } from "@/src/features/i18n/I18nText";

const DocsButton = ({ href }: { href: string }) => (
  <Button asChild variant="ghost">
    <Link href={href} target="_blank">
      <I18nText id="documentation_81ff2fc" />{" "}
    </Link>
  </Button>
);

const ManageApiKeysButton = ({ projectId }: { projectId: string }) => (
  <Button asChild variant="secondary">
    <Link href={`/project/${projectId}/settings/api-keys`}>
      <I18nText id="manage_api_keys_85a7ad2" />{" "}
    </Link>
  </Button>
);

export function DeveloperToolsSettings({ projectId }: { projectId: string }) {
  const tAuto = useAutoTranslations();
  return (
    <div>
      <Header title={tAuto("mcp_cli_38b1ba7")} />
      <p className="text-muted-foreground mb-6 text-sm">
        {tAuto(
          "bring_langfuse_into_your_terminal_and_ai_coding_agen_1ce9cec",
        )}{" "}
      </p>
      <div className="space-y-6">
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="text-foreground h-5 w-5" />
            <span className="font-bold">{tAuto("agent_skill_0fa4cfe")}</span>
          </div>
          <p className="text-primary mb-4 text-sm">
            The Langfuse Agent Skill is an open-source skill following
            Anthropic&apos;s Agent Skills standard. It equips AI coding agents
            (Claude Code, Cursor, Windsurf) with native Langfuse capabilities
            and conditions them to follow best practices, so agents produce
            better results when it is installed.
          </p>
          <CodeBlock
            language="shell"
            value={`npx skills add langfuse/skills --skill "langfuse"`}
          />
          <div className="mt-4 flex items-center gap-2">
            <DocsButton href="https://langfuse.com/docs/api-and-data-platform/features/agent-skill" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Bot className="text-foreground h-5 w-5" />
            <span className="font-bold">{tAuto("mcp_server_231652e")}</span>
          </div>
          <p className="text-primary mb-4 text-sm">
            {tAuto(
              "the_langfuse_mcp_server_lets_ai_assistants_and_agent_2acaf56",
            )}{" "}
          </p>
          <CodeBlock
            language="shell"
            value={`claude mcp add --transport http langfuse \\
  https://cloud.langfuse.com/api/public/mcp \\
  --header "Authorization: Basic {your-base64-token}"`}
          />
          <div className="mt-4 flex items-center gap-2">
            <ManageApiKeysButton projectId={projectId} />
            <DocsButton href="https://langfuse.com/docs/api-and-data-platform/features/mcp-server" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <SquareTerminal className="text-foreground h-5 w-5" />
            <span className="font-bold">CLI</span>
          </div>
          <p className="text-primary mb-4 text-sm">
            {tAuto(
              "the_langfuse_cli_provides_terminal_access_to_the_ful_e094077",
            )}{" "}
          </p>
          <CodeBlock
            language="shell"
            value={`export LANGFUSE_PUBLIC_KEY="pk-lf-..."
export LANGFUSE_SECRET_KEY="sk-lf-..."

npx langfuse-cli api <resource> <action>`}
          />
          <div className="mt-4 flex items-center gap-2">
            <ManageApiKeysButton projectId={projectId} />
            <DocsButton href="https://langfuse.com/docs/api-and-data-platform/features/cli" />
          </div>
        </Card>
      </div>
    </div>
  );
}
