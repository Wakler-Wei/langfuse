import { ListRestartIcon } from "lucide-react";
import { useRouter } from "next/router";

import { Button } from "@/src/components/ui/button";
import { usePersistedWindowIds } from "@/src/features/playground/page/hooks/usePersistedWindowIds";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const ResetPlaygroundButton: React.FC = () => {
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const { clearAllCache } = usePersistedWindowIds();

  const handleClick = () => {
    clearAllCache();
    router.reload();
  };

  return (
    <Button
      variant="outline"
      title={tAuto("reset_playground_state_7779c42")}
      onClick={handleClick}
      className="gap-1"
    >
      <ListRestartIcon className="h-4 w-4" />
      <span className="hidden lg:inline">
        {tAuto("reset_playground_245e0e8")}
      </span>
    </Button>
  );
};
