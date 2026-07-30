import { api } from "@/src/utils/api";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { type DefaultViewScope } from "@langfuse/shared/src/server";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

interface UseDefaultViewMutationsProps {
  tableName: string;
  projectId: string;
}

export function useDefaultViewMutations({
  tableName,
  projectId,
}: UseDefaultViewMutationsProps) {
  const tAuto = useAutoTranslations();
  const utils = api.useUtils();

  const setAsDefault = api.TableViewPresets.setAsDefault.useMutation({
    onSuccess: (_, variables) => {
      utils.TableViewPresets.getDefault.invalidate({
        projectId,
        viewName: tableName,
      });
      utils.TableViewPresets.getDefaultAssignments.invalidate({
        projectId,
        viewName: tableName,
      });
      const scopeLabel =
        variables.scope === "user"
          ? tAuto("your_4dc7374")
          : tAuto("project_98f5414");
      showSuccessToast({
        title: tAuto("default_view_set_b881ea9"),
        description: tAuto("set_as_value0_default_7c46ec8", {
          value0: String(scopeLabel ?? ""),
        }),
      });
    },
    onError: (error) => {
      showErrorToast(tAuto("failed_to_set_default_f65fd74"), error.message);
    },
  });

  const clearDefault = api.TableViewPresets.clearDefault.useMutation({
    onSuccess: (_, variables) => {
      utils.TableViewPresets.getDefault.invalidate({
        projectId,
        viewName: tableName,
      });
      utils.TableViewPresets.getDefaultAssignments.invalidate({
        projectId,
        viewName: tableName,
      });
      const scopeLabel =
        variables.scope === "user"
          ? tAuto("your_ba596fd")
          : tAuto("project_f6f4da8");
      showSuccessToast({
        title: tAuto("default_cleared_445bb31"),
        description: tAuto("value0_default_view_cleared_f6b7165", {
          value0: String(scopeLabel ?? ""),
        }),
      });
    },
    onError: (error) => {
      showErrorToast(tAuto("failed_to_clear_default_8af3375"), error.message);
    },
  });

  const setViewAsDefault = (viewId: string, scope: DefaultViewScope) => {
    setAsDefault.mutate({
      projectId,
      viewId,
      viewName: tableName,
      scope,
    });
  };

  const clearViewDefault = (scope: DefaultViewScope) => {
    clearDefault.mutate({
      projectId,
      viewName: tableName,
      scope,
    });
  };

  return {
    setViewAsDefault,
    clearViewDefault,
    isSettingDefault: setAsDefault.isPending,
  };
}
