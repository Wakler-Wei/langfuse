import { SupportOrUpgradePage } from "@/src/ee/features/billing/components/SupportOrUpgradePage";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { AnnotationQueueItemPage } from "@/src/features/annotation-queues/components/AnnotationQueueItemPage";
import { api } from "@/src/utils/api";
import Page from "@/src/components/layouts/page";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const AnnotationQueuesItem = ({
  annotationQueueId,
  projectId,
  itemId,
}: {
  annotationQueueId: string;
  projectId: string;
  itemId?: string;
}) => {
  const tAuto = useAutoTranslations();
  const hasAccess = useHasProjectAccess({
    projectId,
    scope: "annotationQueues:read",
  });

  const queue = api.annotationQueues.byId.useQuery(
    {
      queueId: annotationQueueId,
      projectId,
    },
    {
      trpc: {
        context: {
          skipBatch: true,
        },
      },
      refetchOnMount: false, // prevents refetching loops
    },
  );

  if (!hasAccess) return <SupportOrUpgradePage />;

  return (
    <Page
      headerProps={{
        title: itemId
          ? tAuto("value0_value1_0f13dbb", {
              value0: queue.data?.name ?? "",
              value1: itemId,
            })
          : (queue.data?.name ?? annotationQueueId),
        itemType: "QUEUE_ITEM",
        breadcrumb: [
          {
            name: "Annotation Queues",
            href: `/project/${projectId}/annotation-queues`,
          },
          {
            name: queue.data?.name ?? annotationQueueId,
            href: `/project/${projectId}/annotation-queues/${annotationQueueId}`,
          },
        ],
      }}
    >
      <AnnotationQueueItemPage
        projectId={projectId}
        annotationQueueId={annotationQueueId}
        queryItemId={itemId}
      />
    </Page>
  );
};
