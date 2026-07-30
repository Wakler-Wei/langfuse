import { Badge } from "@/src/components/ui/badge";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const PromptVariableListPreview = ({
  variables,
}: {
  variables: string[];
}) => {
  const tAuto = useAutoTranslations();
  if (variables.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="text-muted-foreground mb-2 text-sm">
        {tAuto("the_following_variables_are_available_663bba9")}{" "}
      </p>
      <div className="flex min-h-6 flex-wrap gap-2">
        {variables.map((variable) => (
          <Badge key={variable} variant="outline">
            {variable}
          </Badge>
        ))}
      </div>
    </div>
  );
};
