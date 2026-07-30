import { Separator } from "@/src/components/ui/separator";
import { usePlaygroundContext } from "../context";
import { PromptVariableComponent } from "./PromptVariableComponent";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const Variables = () => {
  const tAuto = useAutoTranslations();
  const { promptVariables } = usePlaygroundContext();

  const renderNoVariables = () => (
    <div className="text-xs">
      <p className="mb-2">{tAuto("no_variables_defined_88beb8c")}</p>
      <p>
        {tAuto(
          "use_double_curly_braces_in_your_prompts_to_add_a_var_4f668de",
        )}{" "}
      </p>
    </div>
  );

  const renderVariables = () => (
    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
      {promptVariables
        .slice()
        .sort((a, b) => {
          if (a.isUsed && !b.isUsed) return -1;
          if (!a.isUsed && b.isUsed) return 1;
          return a.name.localeCompare(b.name);
        })
        .map((promptVariable, index) => (
          <div key={promptVariable.name}>
            <PromptVariableComponent promptVariable={promptVariable} />
            {index !== promptVariables.length - 1 && (
              <Separator className="my-2" />
            )}
          </div>
        ))}
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      {promptVariables.length === 0 ? renderNoVariables() : renderVariables()}
    </div>
  );
};
