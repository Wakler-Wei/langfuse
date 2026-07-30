import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/src/components/ui/button";
import {
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { CodeMirrorEditor } from "@/src/components/editor/CodeMirrorEditor";
import { api } from "@/src/utils/api";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { getFormattedPayload } from "@/src/features/experiments/utils/format";
import { type Prisma } from "@langfuse/shared";
import Spinner from "@/src/components/design-system/Spinner/Spinner";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

const RemoteExperimentTriggerSchema = z.object({
  payload: z.string(),
});

type RemoteExperimentTriggerForm = z.infer<
  typeof RemoteExperimentTriggerSchema
>;

export const RemoteExperimentTriggerModal = ({
  projectId,
  datasetId,
  remoteExperimentConfig,
  setShowTriggerModal,
}: {
  projectId: string;
  datasetId: string;
  remoteExperimentConfig: {
    url: string;
    payload?: Prisma.JsonValue;
  };
  setShowTriggerModal: (show: boolean) => void;
}) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const hasDatasetAccess = useHasProjectAccess({
    projectId,
    scope: "datasets:CUD",
  });

  const dataset = api.datasets.byId.useQuery({
    projectId,
    datasetId,
  });

  const form = useForm<RemoteExperimentTriggerForm>({
    resolver: zodResolver(RemoteExperimentTriggerSchema),
    defaultValues: {
      payload: getFormattedPayload(remoteExperimentConfig.payload),
    },
  });

  const runRemoteExperimentMutation =
    api.datasets.triggerRemoteExperiment.useMutation({
      onSuccess: (data) => {
        if (data.success && data.skipped) {
          showErrorToast(
            tAutoI18n("trigger_is_disabled_ce21426"),
            tAutoI18n(
              "enable_the_trigger_in_settings_to_run_remote_experim_fd0e1e0",
            ),
            "WARNING",
          );
        } else if (data.success) {
          showSuccessToast({
            title: tAuto("remote_experiment_triggered_6581fb0"),
            description: tAuto(
              "your_remote_experiment_may_take_a_few_minutes_to_com_efb5235",
            ),
          });
        } else {
          showErrorToast(
            tAutoI18n("failed_to_trigger_remote_experiment_84ab01f"),
            data.error ||
              tAutoI18n(
                "please_try_again_or_check_your_remote_experiment_con_394a1b3",
              ),
          );
        }
        setShowTriggerModal(false);
      },
    });

  const onSubmit = (data: RemoteExperimentTriggerForm) => {
    if (data.payload.trim()) {
      try {
        JSON.parse(data.payload);
      } catch {
        form.setError("payload", {
          message: "Invalid JSON format",
        });
        return;
      }
    }

    runRemoteExperimentMutation.mutate({
      projectId,
      datasetId,
      payload: data.payload,
    });
  };

  if (!hasDatasetAccess) {
    return null;
  }

  return (
    <>
      <DialogHeader>
        <Button
          variant="ghost"
          onClick={() => setShowTriggerModal(false)}
          className="inline-block self-start"
        >
          {tAuto("back_c32ae9f")}{" "}
        </Button>
        <DialogTitle>{tAuto("run_remote_dataset_run_a2a62e7")}</DialogTitle>
        <DialogDescription>
          {tAutoI18n(
            "this_action_will_send_the_following_information_to_ce97316",
          )}{" "}
          <strong>{remoteExperimentConfig.url}</strong>.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DialogBody>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="payload"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAuto("config_8851142")}</FormLabel>
                    <FormDescription>
                      {tAutoI18n(
                        "confirm_the_config_you_want_to_send_to_the_remote_da_300251a",
                      )}{" "}
                      <strong>{dataset.data?.name}</strong>{" "}
                      {tAutoI18n("dataset_information_f032946")}{" "}
                    </FormDescription>
                    <FormControl>
                      <CodeMirrorEditor
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        editable
                        mode="json"
                        minHeight={200}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <div className="flex w-full justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTriggerModal(false)}
                disabled={runRemoteExperimentMutation.isPending}
              >
                {tAuto("cancel_77dfd21")}{" "}
              </Button>
              <Button
                type="submit"
                disabled={runRemoteExperimentMutation.isPending}
              >
                {runRemoteExperimentMutation.isPending && (
                  <div className="mr-2">
                    <Spinner size="sm" />
                  </div>
                )}
                {tAutoI18n("run_b1b3926")}{" "}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};
