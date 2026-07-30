import { type LLMToolCall } from "@langfuse/shared";
import { PrettyJsonView } from "@/src/components/ui/PrettyJsonView";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const ToolCallCard: React.FC<{ toolCall: LLMToolCall }> = ({
  toolCall,
}) => {
  const tAuto = useAutoTranslations();
  return (
    <div className="my-1 rounded border border-gray-200 p-2 text-sm dark:border-gray-700">
      <div className="flex flex-row gap-4">
        <div className="flex w-[15%] flex-col overflow-hidden">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {tAuto("tool_called_4500437")}{" "}
          </div>
          <div className="mt-1 overflow-hidden text-xs font-bold text-ellipsis whitespace-nowrap">
            {toolCall.name}
          </div>
        </div>
        <div className="w-[50%] flex-1 overflow-hidden">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {tAuto("arguments_cbb9fa2")}{" "}
          </div>
          <PrettyJsonView
            json={toolCall.args}
            codeClassName="border-none p-1"
            currentView="pretty"
          />
        </div>
        <div className="flex w-[25%] flex-col overflow-hidden">
          <div className="text-xs text-gray-500 dark:text-gray-400">ID</div>
          <div className="mt-1 overflow-hidden text-xs text-ellipsis whitespace-nowrap">
            {toolCall.id}
          </div>
        </div>
      </div>
    </div>
  );
};
