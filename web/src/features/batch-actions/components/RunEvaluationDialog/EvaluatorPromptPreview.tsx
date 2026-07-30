import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/src/components/ui/hover-card";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type EvaluatorPromptPreviewProps = {
  trigger: React.ReactNode;
  previewContent: string;
};

export function EvaluatorPromptPreview(props: EvaluatorPromptPreviewProps) {
  const tAuto = useAutoTranslations();
  const { trigger, previewContent } = props;

  return (
    <HoverCard openDelay={150} closeDelay={150}>
      <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
      <HoverCardContent
        className="w-[520px] max-w-[85vw]"
        align="end"
        onWheel={(event) => event.stopPropagation()}
      >
        <p className="text-muted-foreground mb-2 text-xs">
          {tAuto(
            "prompt_preview_with_the_first_selected_observation_39b65a1",
          )}{" "}
        </p>
        <pre
          className="bg-muted/20 max-h-[320px] overflow-y-auto rounded-md border p-2 text-xs wrap-break-word whitespace-pre-wrap"
          onWheel={(event) => event.stopPropagation()}
        >
          {previewContent}
        </pre>
      </HoverCardContent>
    </HoverCard>
  );
}
