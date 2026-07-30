import { Button } from "@/src/components/ui/button";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import { api } from "@/src/utils/api";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import Header from "@/src/components/layouts/header";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { useHasOrganizationAccess } from "@/src/features/rbac/utils/checkOrganizationAccess";
import {
  useLangfuseCloudRegion,
  useQueryOrganization,
} from "@/src/features/organizations/hooks";
import { Card } from "@/src/components/ui/card";
import { LockIcon, ExternalLink } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export default function AIFeatureSwitch() {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const { update: updateSession } = useSession();
  const utils = api.useUtils();
  const { isLangfuseCloud } = useLangfuseCloudRegion();
  const capture = usePostHogClientCapture();
  const organization = useQueryOrganization();
  const aiFeaturesEnabled = organization?.aiFeaturesEnabled;
  const aiTelemetryEnabled = organization?.aiTelemetryEnabled;
  const [isAIFeatureSwitchEnabled, setIsAIFeatureSwitchEnabled] = useState(
    aiFeaturesEnabled ?? false,
  );
  const [isAITelemetrySwitchEnabled, setIsAITelemetrySwitchEnabled] = useState(
    aiTelemetryEnabled ?? true,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const hasAccess = useHasOrganizationAccess({
    organizationId: organization?.id,
    scope: "organization:update",
  });

  const updateAIFeatures = api.organizations.update.useMutation({
    onSuccess: async () => {
      await updateSession();
      // Admins resolve org context from this query, not the session
      utils.organizations.byId.invalidate();
      setConfirmOpen(false);
    },
    onError: () => {
      setConfirmOpen(false);
    },
  });

  const updateAITelemetry = api.organizations.update.useMutation({
    onSuccess: async () => {
      await updateSession();
      // Admins resolve org context from this query, not the session
      utils.organizations.byId.invalidate();
    },
    onError: () => {
      setIsAITelemetrySwitchEnabled(aiTelemetryEnabled ?? true);
    },
  });

  useEffect(() => {
    if (aiFeaturesEnabled === undefined || aiTelemetryEnabled === undefined) {
      return;
    }

    if (!confirmOpen && !updateAIFeatures.isPending) {
      setIsAIFeatureSwitchEnabled(aiFeaturesEnabled);
    }

    if (!updateAITelemetry.isPending) {
      setIsAITelemetrySwitchEnabled(aiTelemetryEnabled);
    }
  }, [
    aiFeaturesEnabled,
    aiTelemetryEnabled,
    confirmOpen,
    updateAIFeatures.isPending,
    updateAITelemetry.isPending,
  ]);

  function handleSwitchChange(newValue: boolean) {
    if (!hasAccess) return;
    setIsAIFeatureSwitchEnabled(newValue);
    setConfirmOpen(true);
  }

  function handleTelemetrySwitchChange(newValue: boolean) {
    if (!organization || !hasAccess) return;
    setIsAITelemetrySwitchEnabled(newValue);
    capture("organization_settings:ai_telemetry_toggle");
    updateAITelemetry.mutate({
      orgId: organization.id,
      aiTelemetryEnabled: newValue,
    });
  }

  function handleCancel() {
    setIsAIFeatureSwitchEnabled(organization?.aiFeaturesEnabled ?? false);
    setConfirmOpen(false);
  }

  function handleConfirm() {
    if (!organization || !hasAccess) return;
    capture("organization_settings:ai_features_toggle");
    updateAIFeatures.mutate({
      orgId: organization.id,
      aiFeaturesEnabled: isAIFeatureSwitchEnabled,
    });
  }

  if (!isLangfuseCloud) return null;

  return (
    <div>
      <Header title={tAuto("ai_features_3eedb2f")} />
      <Card className="mb-4 p-3">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-1">
            <h4 className="font-bold">
              {tAuto(
                "enable_ai_powered_features_for_your_organization_52d00c0",
              )}{" "}
            </h4>
            <p className="text-sm">
              {tAutoI18n(
                "this_setting_applies_to_all_users_and_projects_any_d_285066f",
              )}{" "}
              <i>{tAuto("can_7e9219a")}</i>{" "}
              {tAutoI18n(
                "be_sent_to_aws_bedrock_within_the_langfuse_data_regi_6134bf4",
              )}{" "}
              <a
                href="https://langfuse.com/security/ai-features"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 hover:underline"
              >
                {tAuto("more_details_in_the_docs_here_55f432f")}{" "}
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
          <div className="relative">
            <Switch
              checked={isAIFeatureSwitchEnabled}
              onCheckedChange={handleSwitchChange}
              disabled={!hasAccess}
            />
            {!hasAccess && (
              <span title={tAuto("no_access_63bde5f")}>
                <LockIcon className="text-muted absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform" />
              </span>
            )}
          </div>
        </div>
        {isAIFeatureSwitchEnabled && (
          <div className="mt-4 flex flex-row items-center justify-between border-t pt-4">
            <div className="flex flex-col gap-1">
              <h4 className="font-bold">
                {tAuto(
                  "ai_data_use_for_product_service_improvement_f17a31e",
                )}{" "}
              </h4>
              <p className="text-sm">
                {tAuto(
                  "share_data_about_your_use_of_ai_with_langfuse_for_pr_923b4b5",
                )}{" "}
              </p>
            </div>
            <div className="relative">
              <Switch
                checked={isAITelemetrySwitchEnabled}
                onCheckedChange={handleTelemetrySwitchChange}
                disabled={!hasAccess || updateAITelemetry.isPending}
              />
              {!hasAccess && (
                <span title={tAuto("no_access_63bde5f")}>
                  <LockIcon className="text-muted absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform" />
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      <Dialog
        open={confirmOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen && !updateAIFeatures.isPending) {
            handleCancel();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tAuto("confirm_ai_features_change_45bc67a")}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <span className="text-sm">
              {tAutoI18n("you_are_about_to_20e7c1f")}{" "}
              <strong>
                {isAIFeatureSwitchEnabled
                  ? tAutoI18n("enable_9905c33")
                  : tAutoI18n("disable_ccf09e2")}
              </strong>{" "}
              {tAutoI18n(
                "ai_features_for_your_organization_when_enabled_any_d_b1766da",
              )}
              {"  "}
              <i>{tAuto("can_7e9219a")}</i>{" "}
              {tAutoI18n(
                "be_sent_to_aws_bedrock_in_your_data_region_for_proce_955c41f",
              )}{" "}
              <br />
              <br />{" "}
              <a
                href="https://langfuse.com/security/ai-features"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 hover:underline"
              >
                {tAuto("learn_more_in_the_docs_1b6a582")}{" "}
                <ExternalLink className="h-3 w-3" />
              </a>
            </span>
            <p className="text-muted-foreground mt-3 text-sm">
              {tAuto("are_you_sure_you_want_to_proceed_4471388")}{" "}
            </p>
          </DialogBody>
          <DialogFooter>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                disabled={updateAIFeatures.isPending}
                onClick={handleCancel}
              >
                {tAuto("cancel_77dfd21")}{" "}
              </Button>
              <Button
                type="submit"
                onClick={handleConfirm}
                loading={updateAIFeatures.isPending}
              >
                {tAuto("confirm_04a2122")}{" "}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
