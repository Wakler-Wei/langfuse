import { Card } from "@/src/components/ui/card";
import { SearchXIcon } from "lucide-react";
import { I18nText } from "@/src/features/i18n/I18nText";

export const ObjectNotFoundCard = ({
  type,
}: {
  type: "TRACE" | "OBSERVATION" | "SESSION";
}) => (
  <Card className="flex h-full w-full items-center justify-center border-none p-6">
    <div className="text-center">
      <SearchXIcon className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
      <p className="text-muted-foreground text-sm capitalize">
        <I18nText
          id="object_not_found_likely_deleted_5149d97"
          values={{ type: type.toLowerCase() }}
        />
      </p>
    </div>
  </Card>
);
