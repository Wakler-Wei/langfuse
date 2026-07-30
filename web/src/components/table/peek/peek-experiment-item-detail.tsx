import { useRouter } from "next/router";
import { usePeekData } from "@/src/components/table/peek/hooks/usePeekData";
import { TraceDetailBody } from "@/src/components/trace/TraceDetailBody";
import { TablePeekView } from "@/src/components/table/peek";
import { ExperimentPeekFooter } from "@/src/features/experiments/components/ExperimentPeekFooter";
import { useExperimentPeekNavigation } from "@/src/features/experiments/hooks/useExperimentPeekNavigation";
import { parseTraceTimestampFromQuery } from "@/src/utils/parseTraceTimestampFromQuery";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

const PeekViewExperimentItemDetail = ({ projectId }: { projectId: string }) => {
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const peekId = router.query.peek as string | undefined;
  const timestamp = parseTraceTimestampFromQuery(router.query.timestamp);
  const traceId = router.query.traceId as string | undefined;

  const trace = usePeekData({
    projectId,
    traceId,
    timestamp,
  });

  // No trace target means the current experiment has no run for this item;
  // without this guard the disabled trace query would show a skeleton forever.
  if (!traceId) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <span className="text-muted-foreground text-sm">
          {tAuto(
            "no_run_for_this_item_in_the_selected_experiment_75f08cf",
          )}{" "}
        </span>
      </div>
    );
  }

  return (
    <TraceDetailBody trace={trace.data} context="peek" keySuffix={peekId} />
  );
};

export const TablePeekViewExperimentItemDetail = (
  props: Omit<
    React.ComponentProps<typeof TablePeekView>,
    "children" | "title" | "footer"
  > & {
    projectId: string;
  },
) => {
  const tAuto = useAutoTranslations();
  const { projectId } = props;
  const router = useRouter();
  const peekId = router.query.peek as string | undefined;
  const { canSwitch } = useExperimentPeekNavigation();

  return (
    <TablePeekView
      {...props}
      title={
        peekId
          ? tAuto("experiment_item_value0_84ee01d", { value0: peekId })
          : undefined
      }
      footer={
        canSwitch ? <ExperimentPeekFooter projectId={projectId} /> : undefined
      }
    >
      <PeekViewExperimentItemDetail projectId={projectId} />
    </TablePeekView>
  );
};
