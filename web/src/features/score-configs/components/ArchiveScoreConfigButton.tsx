import { Archive } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import React from "react";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { api } from "@/src/utils/api";
import { useEmptyScoreConfigs } from "@/src/features/scores/hooks/useEmptyConfigs";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const ArchiveScoreConfigButton = ({
  configId,
  projectId,
  isArchived,
  name,
}: {
  configId: string;
  projectId: string;
  isArchived: boolean;
  name: string;
}) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const capture = usePostHogClientCapture();
  const { emptySelectedConfigIds, setEmptySelectedConfigIds } =
    useEmptyScoreConfigs();

  const hasAccess = useHasProjectAccess({
    projectId: projectId,
    scope: "scoreConfigs:CUD",
  });

  const utils = api.useUtils();
  const configMutation = api.scoreConfigs.update.useMutation({
    onSuccess: () => utils.scoreConfigs.invalidate(),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="flex w-full items-center justify-start"
          disabled={!hasAccess}
          onClick={(e) => {
            e.stopPropagation();
            capture("score_configs:archive_form_open");
          }}
        >
          <Archive className="mr-2 h-4 w-4"></Archive>
          {tAuto("archive_2621c6f")}{" "}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        onClick={(e) => e.stopPropagation()}
        className="max-w-[500px]"
      >
        <h2 className="mb-3 font-bold">
          {isArchived
            ? tAutoI18n("restore_config_f7b595e")
            : tAutoI18n("archive_config_3be87b0")}
        </h2>
        <p className="mb-3 text-sm">
          {tAutoI18n("your_config_is_currently_923d159")}{" "}
          {isArchived
            ? tAutoI18n(
                "archived_restore_if_you_want_to_use_value0_in_annota_0406e82",
                { value0: String((name as unknown) ?? "") },
              )
            : tAutoI18n(
                "active_archive_if_you_no_longer_want_to_use_value0_i_e2aa468",
                {
                  value0: String((name as unknown) ?? ""),
                  value1: String((name as unknown) ?? ""),
                },
              )}
        </p>
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant={isArchived ? "default" : "destructive"}
            loading={configMutation.isPending}
            onClick={() => {
              configMutation.mutateAsync({
                projectId,
                id: configId,
                isArchived: !isArchived,
              });
              setEmptySelectedConfigIds(
                emptySelectedConfigIds.filter((id) => id !== configId),
              );
              capture("score_configs:archive_form_submit");
            }}
          >
            {tAuto("confirm_04a2122")}{" "}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
