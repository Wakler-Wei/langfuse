import { SubHeader } from "@/src/components/layouts/header";
import { CodeView } from "@/src/components/ui/CodeJsonViewer";
import { Label } from "@/src/components/ui/label";
import { getLangfuseEnvCode } from "@/src/features/public-api/hooks/useLangfuseEnvCode";
import { cn } from "@/src/utils/tailwind";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type ApiKeyScope = "project" | "organization";

export type ApiKeyDetailContentProps = {
  scope: ApiKeyScope;
  secretKey: string;
  publicKey: string;
  baseUrl: string;
  className?: string;
  showMcpSection: boolean;
};

function encodeMcpCredential(publicKey: string, secretKey: string) {
  const credential = `${publicKey}:${secretKey}`;

  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(credential);
  }

  return Buffer.from(credential).toString("base64");
}

export function ApiKeyDetailContent(props: ApiKeyDetailContentProps) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const { scope, secretKey, publicKey, baseUrl, className, showMcpSection } =
    props;
  const envCode = getLangfuseEnvCode(baseUrl, { secretKey, publicKey });
  const mcpCredential = encodeMcpCredential(publicKey, secretKey);

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <SubHeader title={tAuto("secret_key_2969a18")} />
        <div className="text-muted-foreground text-sm">
          {tAutoI18n(
            "this_key_can_only_be_viewed_once_you_can_always_crea_daaab02",
          )}{" "}
          {scope} {tAutoI18n("settings_4fd2f8c")}{" "}
        </div>
        <CodeView content={secretKey} className="mt-2" />
      </div>
      <div>
        <SubHeader title={tAuto("public_key_590e3d2")} />
        <CodeView content={publicKey} className="mt-2" />
      </div>
      <div>
        <SubHeader title=".env" />
        <CodeView content={envCode} className="mt-2" />
      </div>
      {showMcpSection ? (
        <>
          <hr />
          <div>
            <SubHeader title={tAuto("using_with_mcp_a574848")} />
            <p className="text-muted-foreground text-sm">
              {tAutoI18n(
                "for_a_detailed_guide_on_how_to_use_this_api_key_to_c_a8c8488",
              )}{" "}
              <a
                href="https://langfuse.com/docs/api-and-data-platform/features/mcp-server"
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline"
              >
                {tAuto("mcp_setup_docs_12ce74e")}{" "}
              </a>
              .
            </p>
            <div className="mt-4">
              <Label>{tAuto("header_31341c6")}</Label>
              <CodeView
                content={`Authorization: Basic ${mcpCredential}`}
                className="mt-2"
                lineWrap={false}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
