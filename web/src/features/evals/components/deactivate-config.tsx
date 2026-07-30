import { EvaluatorStatus } from "@/src/features/evals/types";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { api, type RouterOutputs } from "@/src/utils/api";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Button } from "@/src/components/ui/button";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import { isLegacyEvalTarget } from "@/src/features/evals/utils/typeHelpers";
import { useEvalCapabilities } from "@/src/features/evals/hooks/useEvalCapabilities";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function DeactivateEvalConfig({
  projectId,
  evalConfig,
  onStatusChange,
}: {
  projectId: string;
  evalConfig: RouterOutputs["evals"]["configById"];
  /** Called when the user confirms an activate/deactivate toggle. */
  onStatusChange?: () => void;
}) {
  const tAuto = useAutoTranslations();
  const utils = api.useUtils();
  const hasAccess = useHasProjectAccess({ projectId, scope: "evalJob:CUD" });
  const { allowLegacy } = useEvalCapabilities(projectId);
  const [isOpen, setIsOpen] = useState(false);
  const capture = usePostHogClientCapture();
  const isActive = evalConfig?.status === EvaluatorStatus.ACTIVE;
  // Where new legacy setups are not allowed (cloud), deactivating a legacy
  // evaluator is a one-way door: reactivating it would amount to setting up
  // a legacy eval again.
  const reactivationBlocked =
    !isActive &&
    isLegacyEvalTarget(evalConfig?.targetObject ?? "") &&
    !allowLegacy;

  const mutEvaluator = api.evals.updateEvalJob.useMutation({
    onSuccess: () => {
      utils.evals.invalidate();
    },
  });

  const onClick = async () => {
    if (!projectId) {
      console.error("Project ID is missing");
      return;
    }
    // The popover trigger wraps the switch, so guard the action itself too.
    if (reactivationBlocked) {
      setIsOpen(false);
      return;
    }

    const prevStatus = evalConfig?.status;

    try {
      await mutEvaluator.mutateAsync({
        projectId,
        evalConfigId: evalConfig?.id ?? "",
        config: {
          status: isActive ? EvaluatorStatus.INACTIVE : EvaluatorStatus.ACTIVE,
        },
      });
    } catch {
      // The default mutation error toast reports the failure; the status is
      // unchanged, so keep the popover open and skip the change callbacks.
      return;
    }
    capture(
      prevStatus === EvaluatorStatus.ACTIVE
        ? "eval_config:deactivate"
        : "eval_config:activate",
    );
    onStatusChange?.();
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
      <PopoverTrigger asChild>
        <div className="flex items-center">
          <Switch
            disabled={
              !hasAccess ||
              reactivationBlocked ||
              (evalConfig?.timeScope?.length === 1 &&
                evalConfig.timeScope[0] === "EXISTING")
            }
            checked={isActive}
            color="green"
            {...(reactivationBlocked && {
              title: tAuto(
                "deprecated_evaluators_cannot_be_reactivated_migrate__7c895ee",
              ),
            })}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent>
        <h2 className="mb-3 font-bold">{tAuto("please_confirm_3a799cc")}</h2>
        <p className="mb-3 text-sm">
          {evalConfig?.status === "ACTIVE"
            ? tAuto(
                "this_action_will_deactivate_the_evaluator_no_more_tr_26e6072",
              )
            : tAuto(
                "this_action_will_activate_the_evaluator_new_traces_w_1d28b12",
              )}
        </p>
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant={
              evalConfig?.status === "ACTIVE" ? "destructive" : "default"
            }
            loading={mutEvaluator.isPending}
            onClick={onClick}
          >
            {evalConfig?.status === "ACTIVE"
              ? tAuto("deactivate_d65ded9")
              : tAuto("activate_92ef083")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
