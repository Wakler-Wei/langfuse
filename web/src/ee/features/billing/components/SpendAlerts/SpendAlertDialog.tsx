import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { api } from "@/src/utils/api";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

const spendAlertSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  limit: z.coerce
    .number()
    .positive("Limit must be positive")
    .max(1000000, "Limit must be less than $1,000,000"),
});

type SpendAlertFormInput = z.input<typeof spendAlertSchema>;
type SpendAlertFormOutput = z.output<typeof spendAlertSchema>;

interface SpendAlertDialogProps {
  orgId: string;
  alert?: {
    id: string;
    title: string;
    threshold: { toString(): string };
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SpendAlertDialog({
  orgId,
  alert,
  open,
  onOpenChange,
  onSuccess,
}: SpendAlertDialogProps) {
  const tAuto = useAutoTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const capture = usePostHogClientCapture();

  const form = useForm<SpendAlertFormInput, undefined, SpendAlertFormOutput>({
    resolver: zodResolver(spendAlertSchema),
    defaultValues: {
      title: alert?.title ?? "",
      limit: alert ? parseFloat(alert.threshold.toString()) : undefined,
    },
  });

  const createMutation = api.spendAlerts.createSpendAlert.useMutation();
  const updateMutation = api.spendAlerts.updateSpendAlert.useMutation();

  const onSubmit = async (data: SpendAlertFormOutput) => {
    setIsSubmitting(true);
    try {
      if (alert) {
        // Update existing alert
        await updateMutation.mutateAsync({
          orgId,
          id: alert.id,
          title: data.title,
          threshold: data.limit,
        });
        capture("spend_alert:updated", {
          orgId,
          alertId: alert.id,
          limit: data.limit,
        });
        toast.success(tAuto("spend_alert_updated_successfully_89738f4"));
      } else {
        // Create new alert
        await createMutation.mutateAsync({
          orgId,
          title: data.title,
          threshold: data.limit,
        });
        capture("spend_alert:created", {
          orgId,
          limit: data.limit,
        });
        toast.success(tAuto("spend_alert_created_successfully_ea171b8"));
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save spend alert:", error);
      toast.error(
        tAuto("failed_to_value0_spend_alert_please_try_again_25c970a", {
          value0: alert ? "update" : "create",
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 sm:max-w-[425px]">
        <DialogTitle>
          {alert ? tAuto("edit_spend_alert_6621068") : tAuto("create_spend_alert_8dae0e9")}
        </DialogTitle>
        <DialogDescription className="text-muted-foreground pt-1 pb-2 text-sm">
          Get notified when your organization&apos;s spending exceeds a limit.
        </DialogDescription>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAuto("alert_title_46c6fa4")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={tAuto("e_g_production_alert_b224e11")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAuto("limit_usd_3a489c2")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      max="1000000"
                      placeholder="100.00"
                      name={field.name}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      onChange={field.onChange}
                      value={
                        typeof field.value === "number" ||
                        typeof field.value === "string"
                          ? field.value
                          : ""
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="text-muted-foreground text-xs">
              <div className="flex flex-row items-center">
                <Info className="mr-2 h-3 w-3" />
                <span className="font-bold">
                  {tAuto("how_it_works_1dd6a17")}
                </span>
              </div>
              <ul className="list-disc pl-5">
                <li>
                  {tAuto(
                    "the_limit_is_evaluated_against_your_upcoming_invoice_51991ad",
                  )}{" "}
                </li>
                <li>
                  {tAuto("alerts_trigger_once_per_billing_cycle_81b8f40")}
                </li>
                <li>
                  {tAuto(
                    "you_will_receive_an_email_when_the_alert_is_triggere_9874c0a",
                  )}
                </li>
                <li>
                  {tAuto("alerts_are_evaluated_with_a_90_minute_delay_d09be50")}
                </li>
              </ul>
            </div>
            <div className="flex flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {tAuto("cancel_77dfd21")}{" "}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? alert
                    ? tAuto("updating_e349e5c")
                    : tAuto("creating_28ea766")
                  : alert
                    ? tAuto("update_alert_42e0c2e")
                    : tAuto("create_alert_2263828")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
