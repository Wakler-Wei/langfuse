import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { api } from "@/src/utils/api";
import { copyTextToClipboard } from "@/src/utils/clipboard";
import type { TableViewPresetState } from "@langfuse/shared";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type UseViewMutationsProps = {
  handleSetViewId: (viewId: string | null) => void;
  applyViewState: (view: TableViewPresetState) => void;
};

export const useViewMutations = ({
  handleSetViewId,
  applyViewState,
}: UseViewMutationsProps) => {
  const tAuto = useAutoTranslations();
  const utils = api.useUtils();

  const createMutation = api.TableViewPresets.create.useMutation({
    onSuccess: (data) => {
      utils.TableViewPresets.getByTableName.invalidate();
      applyViewState(data.view);
      handleSetViewId(data.view.id);
    },
  });

  const updateConfigMutation = api.TableViewPresets.update.useMutation({
    onSuccess: (data) => {
      utils.TableViewPresets.getById.invalidate({
        viewId: data.view.id,
      });
      utils.TableViewPresets.getByTableName.invalidate();
      showSuccessToast({
        title: tAuto("view_updated_c587dc0"),
        description: tAuto(
          "value0_has_been_updated_to_reflect_your_current_tabl_d2a6ec4",
          { value0: String(data.view.name ?? "") },
        ),
      });
    },
  });

  const updateNameMutation = api.TableViewPresets.updateName.useMutation({
    onSuccess: () => {
      utils.TableViewPresets.getByTableName.invalidate();
    },
  });

  const deleteMutation = api.TableViewPresets.delete.useMutation({
    onSuccess: () => {
      utils.TableViewPresets.getByTableName.invalidate();
      handleSetViewId(null);
    },
  });

  const generatePermalinkMutation =
    api.TableViewPresets.generatePermalink.useMutation({
      onSuccess: (data) => {
        // Toast on the clipboard write's resolution so a permission failure
        // surfaces an error instead of falsely reporting success.
        copyTextToClipboard(data)
          .then(() =>
            showSuccessToast({
              title: tAuto("permalink_copied_to_clipboard_50608c4"),
              description: tAuto(
                "you_can_now_share_the_permalink_with_others_d8f7432",
              ),
            }),
          )
          .catch(() =>
            showErrorToast(
              tAuto("failed_to_copy_permalink_9964fc5"),
              tAuto(
                "could_not_write_to_the_clipboard_please_copy_the_lin_50fed68",
              ),
              "WARNING",
            ),
          );
      },
    });

  return {
    createMutation,
    updateConfigMutation,
    updateNameMutation,
    deleteMutation,
    generatePermalinkMutation,
  };
};
