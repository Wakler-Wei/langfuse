import { useEffect, useRef, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { usePlaygroundContext } from "../context";
import { ChatMessageRole, ChatMessageType } from "@langfuse/shared";
import { BracesIcon, Check, Copy, Plus } from "lucide-react";
import { ToolCallCard } from "@/src/components/ChatMessages/ToolCallCard";
import { copyTextToClipboard } from "@/src/utils/clipboard";
import { ThinkingBlock } from "@/src/components/trace/components/IOPreview/components/ThinkingBlock";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const GenerationOutput = () => {
  const tAuto = useAutoTranslations();
  const [isCopied, setIsCopied] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isJson, setIsJson] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const {
    output,
    outputReasoning,
    outputJson,
    addMessage,
    outputToolCalls,
    scrollToMessage,
  } = usePlaygroundContext();

  const handleCopy = () => {
    setIsCopied(true);
    const textToCopy = isJson ? outputJson : output;
    copyTextToClipboard(textToCopy);
    setTimeout(() => setIsCopied(false), 1000);
  };

  const handleAddAssistantMessage = () => {
    setIsAdded(true);
    const newMessage =
      outputToolCalls.length > 0
        ? addMessage({
            type: ChatMessageType.AssistantToolCall,
            role: ChatMessageRole.Assistant,
            content: output,
            toolCalls: outputToolCalls,
          })
        : addMessage({
            type: ChatMessageType.AssistantText,
            role: ChatMessageRole.Assistant,
            content: output,
          });
    // Scroll the appended row into view without stealing focus: this is a
    // programmatic add from the Output panel, so unlike the Add-message button
    // path (focus=true) we shouldn't yank the caret into the new editor. For a
    // tool-call add, addMessage returns the last appended row (the final
    // ToolResult placeholder), so we reveal the newest content (LFE-6864).
    scrollToMessage(newMessage.id, false);
    setTimeout(() => setIsAdded(false), 1000);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [output]);

  const checkIcon = <Check className="h-2 w-2" />;
  const copyIcon = <Copy className="h-2 w-2" />;
  const plusIcon = <Plus className="h-2 w-2" />;

  const copyButton =
    output || outputToolCalls.length ? (
      <div className="absolute top-2 right-3 flex space-x-1 opacity-50">
        <Button
          size="icon"
          variant={isJson ? "default" : "secondary"}
          onClick={() => {
            setIsJson((prev) => !prev);
          }}
          title={tAuto("toggle_input_output_json_d05f4fc")}
        >
          <BracesIcon size={15} />
        </Button>

        <Button
          size="icon"
          variant="secondary"
          onClick={!isCopied ? handleCopy : undefined}
          title={tAuto("copy_output_944a2cd")}
        >
          {isCopied ? checkIcon : copyIcon}
        </Button>

        <Button
          className="flex items-center gap-1 p-0 px-1 whitespace-nowrap"
          variant="secondary"
          onClick={!isAdded ? handleAddAssistantMessage : undefined}
          title={tAuto("add_as_assistant_message_01f46c9")}
          disabled={isAdded}
        >
          {isAdded ? checkIcon : plusIcon}
          <span className="text-xs">{tAuto("add_to_messages_ad8d8b7")}</span>
        </Button>
      </div>
    ) : null;

  return (
    <div className="relative h-full">
      <div
        className="bg-muted h-full overflow-auto rounded-lg"
        ref={scrollAreaRef}
      >
        <div className="bg-muted sticky top-0 z-10 p-3">
          <div className="flex w-full items-center">
            <p className="flex-1 text-xs font-bold">
              {tAuto("output_4bed336")}
            </p>
            {copyButton}
          </div>
        </div>
        <div className="px-4">
          {outputReasoning && !isJson && (
            <div className="-ml-1">
              <ThinkingBlock content={outputReasoning} />
            </div>
          )}
          <pre className="text-xs wrap-break-word whitespace-break-spaces">
            {isJson ? outputJson : output}
          </pre>
          {outputToolCalls.length > 0
            ? outputToolCalls.map((toolCall) => (
                <div className="mt-4" key={toolCall.id}>
                  <ToolCallCard toolCall={toolCall} />
                </div>
              ))
            : null}
        </div>
      </div>
    </div>
  );
};
