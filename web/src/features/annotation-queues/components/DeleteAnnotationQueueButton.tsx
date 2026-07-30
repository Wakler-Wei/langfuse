import { DeleteButton } from "@/src/components/deleteButton";
import { api } from "@/src/utils/api";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type DeleteAnnotationQueueButtonProps = {
  projectId: string;
  queueId: string;
};

export const DeleteAnnotationQueueButton = ({
  projectId,
  queueId,
}: DeleteAnnotationQueueButtonProps) => {
  const tAuto = useAutoTranslations();
  const utils = api.useUtils();
  const deleteMutation = api.annotationQueues.delete.useMutation();

  return (
    <DeleteButton
      itemId={queueId}
      projectId={projectId}
      scope="annotationQueues:CUD"
      invalidateFunc={() => utils.annotationQueues.invalidate()}
      isTableAction
      icon
      variant="ghost"
      size="icon-xs"
      title={tAuto("delete_f6fdbe4")}
      aria-label={tAuto("delete_9485989")}
      captureDeleteOpen={() => undefined}
      captureDeleteSuccess={() => undefined}
      customDeletePrompt="This action cannot be undone and removes queue items attached to this queue. Scores added while annotating in this queue will not be deleted."
      entityToDeleteName="annotation queue"
      executeDeleteMutation={async (onSuccess) => {
        await deleteMutation.mutateAsync({
          projectId,
          queueId,
        });
        onSuccess();
      }}
      isDeleteMutationLoading={deleteMutation.isPending}
    />
  );
};
