import { Button } from "@/src/components/ui/button";
import { api } from "@/src/utils/api";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function RetryBackgroundMigration({
  backgroundMigrationName,
  isRetryable,
}: {
  backgroundMigrationName: string;
  isRetryable: boolean;
}) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const utils = api.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [adminApiKey, setAdminApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const mutRetryBackgroundMigration =
    api.backgroundMigrations.retry.useMutation({
      onSuccess: () => {
        utils.backgroundMigrations.invalidate();
        toast.success(tAuto("migration_scheduled_for_retry_ba4bf87"));
        setIsOpen(false);
        setAdminApiKey("");
      },
      onError: (error) => {
        toast.error(
          error?.message || tAuto("failed_to_retry_migration_ffa935a"),
        );
      },
      onSettled: () => {
        setIsLoading(false);
      },
    });

  const handleRetry = async () => {
    if (!adminApiKey.trim()) {
      toast.error(tAuto("admin_api_key_is_required_c2e7af6"));
      return;
    }
    setIsLoading(true);
    try {
      await mutRetryBackgroundMigration.mutateAsync({
        name: backgroundMigrationName,
        adminApiKey: "Bearer " + adminApiKey.trim(),
      });
    } catch (_e) {
      // Error handled in onError
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={() => setIsOpen((prev) => !prev)}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="xs" disabled={!isRetryable}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <h2 className="mb-3 font-bold">
          {tAuto("retry_background_migration_df6e7b8")}
        </h2>
        <p className="mb-4 text-sm">
          {tAuto(
            "this_action_schedules_the_migration_for_retry_restar_841eae5",
          )}{" "}
        </p>

        <div className="mb-4">
          <Label htmlFor="admin-api-key" className="text-sm font-bold">
            {tAuto("admin_api_key_47daed2")}{" "}
          </Label>
          <Input
            id="admin-api-key"
            type="password"
            placeholder={tAuto("enter_admin_api_key_e14461b")}
            value={adminApiKey}
            onChange={(e) => setAdminApiKey(e.target.value)}
            className="mt-1"
            disabled={isLoading}
            autoComplete="off"
            inputMode="text"
            name="admin-api-key"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            {tAutoI18n(
              "required_for_security_this_key_must_match_your_admin_529c04c",
            )}
            {" ("}
            <a
              href="https://langfuse.com/self-hosting/administration/organization-management-api#authentication"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary underline"
            >
              {tAuto("docs_68a4194")}{" "}
            </a>
            ).
          </p>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              setAdminApiKey("");
            }}
            disabled={isLoading}
          >
            {tAuto("cancel_77dfd21")}{" "}
          </Button>
          <Button
            type="button"
            variant="default"
            loading={isLoading}
            onClick={handleRetry}
            disabled={isLoading}
          >
            {tAuto("retry_migration_47bf28c")}{" "}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
