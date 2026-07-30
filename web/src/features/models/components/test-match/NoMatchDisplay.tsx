import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type NoMatchDisplayProps = {
  modelName: string;
};

export type { NoMatchDisplayProps };

export function NoMatchDisplay({ modelName }: NoMatchDisplayProps) {
  const tAuto = useAutoTranslations();
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2 text-base">
          <AlertCircle className="h-5 w-5" />
          {tAuto("no_match_found_918d36b")}{" "}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          No model configuration matches &quot;{modelName}&quot; in this
          project.
        </p>

        <div>
          <p className="mb-2 text-sm font-bold">
            {tAuto("suggestions_5d32837")}
          </p>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            <li>{tAuto("check_your_model_name_spelling_e1079ae")}</li>
            <li>
              {tAuto("view_existing_models_and_their_match_patterns_e1fe7c2")}
            </li>
            <li>{tAuto("create_a_new_model_definition_5a04ed6")}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
