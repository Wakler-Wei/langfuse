import { Card } from "@/src/components/ui/card";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const NotFoundCard = ({
  itemType,
  singleLine = false,
}: {
  itemType: "trace" | "observation";
  singleLine?: boolean;
}) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  if (singleLine) {
    return (
      <Card className="flex h-full w-full items-center justify-start overflow-hidden rounded-sm px-2">
        <p
          className="text-muted-foreground truncate text-xs"
          title={tAuto(
            "the_value0_is_either_still_being_processed_or_has_be_3d87a13",
            { value0: itemType },
          )}
        >
          {tAutoI18n("the_93ef0dd")} {itemType}{" "}
          {tAutoI18n(
            "is_either_still_being_processed_or_has_been_deleted_7b960f1",
          )}{" "}
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-sm p-3">
      <h2 className="mb-1.5 text-sm font-bold">{tAuto("not_found_475c848")}</h2>
      <p className="text-muted-foreground max-w-xs text-center text-xs">
        {tAutoI18n("the_93ef0dd")} {itemType}{" "}
        {tAutoI18n(
          "is_either_still_being_processed_or_has_been_deleted_7b960f1",
        )}{" "}
      </p>
    </Card>
  );
};
