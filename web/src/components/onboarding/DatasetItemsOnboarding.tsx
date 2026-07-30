import { useState } from "react";
import { SplashScreen } from "@/src/components/ui/splash-screen";
import { Braces, Code, ListTree, Upload } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { CsvUploadDialog } from "@/src/features/datasets/components/CsvUploadDialog";
import { NewDatasetItemForm } from "@/src/features/datasets/components/NewDatasetItemForm";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { cn } from "@/src/utils/tailwind";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

interface DatasetItemEntryPointRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  hasAccess?: boolean;
}

const DatasetItemEntryPointRow = ({
  icon,
  title,
  description,
  onClick,
  hasAccess = true,
}: DatasetItemEntryPointRowProps) => {
  const tAuto = useAutoTranslations();
  const disabled = !hasAccess;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      className={cn(
        "border-border flex h-20 items-center gap-4 rounded-lg border p-4 transition-colors",
        disabled
          ? "bg-muted text-muted-foreground opacity-60"
          : "bg-card hover:bg-accent/50 cursor-pointer",
      )}
      onClick={!disabled ? onClick : undefined}
      onKeyDown={
        !disabled
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      title={
        !hasAccess
          ? tAuto(
              "you_don_t_have_access_to_this_feature_please_contact_5508896",
            )
          : undefined
      }
    >
      <div className="flex items-center">{icon}</div>
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="font-bold">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
};

export const DatasetItemsOnboarding = ({
  projectId,
  datasetId,
}: {
  projectId: string;
  datasetId: string;
}) => {
  const tAuto = useAutoTranslations();
  const capture = usePostHogClientCapture();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isNewItemDialogOpen, setIsNewItemDialogOpen] = useState(false);

  const hasProjectAccess = useHasProjectAccess({
    projectId,
    scope: "datasets:CUD",
  });

  return (
    <SplashScreen
      title={tAuto("add_items_to_your_dataset_8ff39ee")}
      description={tAuto(
        "datasets_are_collections_of_specific_edge_cases_and__b80952c",
      )}
    >
      <div className="flex flex-col gap-4">
        <CsvUploadDialog
          open={hasProjectAccess && isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          projectId={projectId}
          datasetId={datasetId}
        >
          <DialogTrigger asChild disabled={!hasProjectAccess}>
            <DatasetItemEntryPointRow
              icon={<Upload className="h-5 w-5" />}
              title={tAuto("upload_csv_0b77a04")}
              description={tAuto(
                "import_dataset_items_from_a_csv_file_8825710",
              )}
              onClick={() => {
                if (hasProjectAccess) {
                  capture("dataset_item:upload_csv_button_click");
                }
              }}
              hasAccess={hasProjectAccess}
            />
          </DialogTrigger>
        </CsvUploadDialog>

        <Dialog
          open={hasProjectAccess && isNewItemDialogOpen}
          onOpenChange={setIsNewItemDialogOpen}
        >
          <DialogTrigger asChild disabled={!hasProjectAccess}>
            <DatasetItemEntryPointRow
              icon={<Braces className="h-5 w-5" />}
              title={tAuto("add_manually_83d9c9a")}
              description={tAuto("manually_input_a_single_item_c41729e")}
              onClick={() => {
                if (hasProjectAccess) {
                  capture("dataset_item:new_form_open");
                }
              }}
              hasAccess={hasProjectAccess}
            />
          </DialogTrigger>
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>{tAuto("create_dataset_item_3aae618")}</DialogTitle>
            </DialogHeader>
            <NewDatasetItemForm
              projectId={projectId}
              datasetId={datasetId}
              onFormSuccess={() => setIsNewItemDialogOpen(false)}
              className="h-full overflow-y-auto"
            />
          </DialogContent>
        </Dialog>

        <Link
          href="https://langfuse.com/docs/evaluation/experiments/datasets#create-items-from-production-data"
          target="_blank"
        >
          <DatasetItemEntryPointRow
            icon={<Code className="h-5 w-5" />}
            title={tAuto("add_via_code_bf7c7bf")}
            description={tAuto(
              "use_our_python_ts_js_sdks_or_custom_api_98f106e",
            )}
          />
        </Link>

        <Link href={`/project/${projectId}/observations`}>
          <DatasetItemEntryPointRow
            icon={<ListTree className="h-5 w-5" />}
            title={tAuto("select_observations_30eee75")}
            description={tAuto(
              "select_observations_in_the_observations_table_and_us_10bd8eb",
            )}
            onClick={() => {
              capture("dataset_item:select_observations_button_click");
            }}
          />
        </Link>
      </div>
    </SplashScreen>
  );
};
