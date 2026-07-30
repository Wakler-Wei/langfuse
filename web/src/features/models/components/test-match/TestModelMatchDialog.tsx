import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { api } from "@/src/utils/api";
import { UsageDetailsEditor } from "./UsageDetailsEditor";
import { MatchedModelCard } from "./MatchedModelCard";
import { MatchedTierCard } from "./MatchedTierCard";
import { NoMatchDisplay } from "./NoMatchDisplay";
import { CheckCircle, SquareArrowOutUpRight } from "lucide-react";
import Spinner from "@/src/components/design-system/Spinner/Spinner";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type TestModelMatchDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type { TestModelMatchDialogProps };

export function TestModelMatchDialog({
  projectId,
  open,
  onOpenChange,
}: TestModelMatchDialogProps) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const [modelName, setModelName] = useState("");
  const [usageDetails, setUsageDetails] = useState<Record<string, number>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Query for match result - only enabled after submit
  const { data, isLoading, error, refetch } = api.models.testMatch.useQuery(
    {
      projectId,
      modelName,
      usageDetails,
    },
    {
      enabled: false, // Manual trigger only
    },
  );

  // Handle form submission
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (modelName.trim()) {
      setHasSubmitted(true);
      refetch();
    }
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setModelName("");
      setUsageDetails({});
      setHasSubmitted(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="min-h-[62vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>{tAuto("test_model_match_dfee8dd")}</DialogTitle>
            <DialogDescription className="mt-1">
              {tAuto(
                "test_which_model_and_pricing_tier_your_ingestion_dat_7b8cdf6",
              )}{" "}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="grid grid-cols-[1fr_1px_1fr] gap-6">
            {/* Left Column: Input Form */}
            <div className="flex flex-col justify-between space-y-6">
              <div className="space-y-6">
                {/* Model Name Input */}
                <div className="space-y-2">
                  <div className="text-sm font-bold">
                    {tAuto("model_name_e83a317")}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {tAuto("the_model_name_on_your_generations_c64b764")}{" "}
                  </div>
                  <Input
                    placeholder={tAuto("e_g_gpt_4_turbo_e0faedd")}
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value.trim())}
                    autoFocus
                    required
                  />
                </div>

                {/* Usage Details Editor */}
                <UsageDetailsEditor
                  usageDetails={usageDetails}
                  onChange={setUsageDetails}
                />
              </div>

              {/* Buttons at bottom of left column */}
              <div className="flex gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  {tAuto("close_bbfa773")}{" "}
                </Button>
                <Button
                  type="submit"
                  disabled={!modelName.trim() || isLoading}
                  className="flex-1"
                >
                  {tAuto("test_match_84073c0")}{" "}
                </Button>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="bg-border" />

            {/* Right Column: Results Panel */}
            <div className="flex flex-col justify-between">
              <div className="space-y-4 overflow-y-auto pb-4">
                {hasSubmitted && (
                  <>
                    {isLoading && (
                      <div className="bg-muted/30 text-muted-foreground flex min-h-[300px] items-center justify-center gap-2 rounded-lg border p-6">
                        <Spinner size="md" />
                        <span>{tAuto("testing_match_af34aaa")}</span>
                      </div>
                    )}

                    {error && (
                      <div className="border-destructive/50 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
                        {tAutoI18n("error_787aa16")} {error.message}
                      </div>
                    )}

                    {!isLoading && !error && data && (
                      <>
                        {data.matched ? (
                          <>
                            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 dark:border-green-900 dark:bg-green-950">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-bold text-green-900 dark:text-green-100">
                                {tAuto("match_found_85f8e24")}{" "}
                              </span>
                            </div>
                            <MatchedModelCard model={data.model} />
                            <MatchedTierCard tier={data.matchedTier} />
                          </>
                        ) : (
                          <NoMatchDisplay modelName={modelName} />
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {/* View Model Details button at bottom */}
              {hasSubmitted && !isLoading && !error && data?.matched && (
                <div className="border-t pt-4">
                  <Button variant="outline" asChild className="w-full">
                    <Link
                      href={`/project/${projectId}/settings/models/${data.model.id}?pricingTier=${data.matchedTier.id}`}
                      target="_blank"
                    >
                      {tAuto("view_model_details_3a070cd")}{" "}
                      <SquareArrowOutUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </DialogBody>
        </form>
      </DialogContent>
    </Dialog>
  );
}
