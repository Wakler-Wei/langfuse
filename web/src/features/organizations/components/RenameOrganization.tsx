import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { api } from "@/src/utils/api";
import type * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/src/components/ui/form";
import { projectNameSchema } from "@/src/features/auth/lib/projectNameSchema";
import Header from "@/src/components/layouts/header";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { useHasOrganizationAccess } from "@/src/features/rbac/utils/checkOrganizationAccess";
import { useQueryOrganization } from "@/src/features/organizations/hooks";
import { Card } from "@/src/components/ui/card";
import { LockIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export default function RenameOrganization() {
  const tAuto = useAutoTranslations();
  const { update: updateSession } = useSession();
  const utils = api.useUtils();
  const capture = usePostHogClientCapture();
  const organization = useQueryOrganization();
  const hasAccess = useHasOrganizationAccess({
    organizationId: organization?.id,
    scope: "organization:update",
  });

  const orgName =
    organization && "name" in organization ? organization.name : "";

  const form = useForm({
    resolver: zodResolver(projectNameSchema),
    defaultValues: {
      name: "",
    },
  });
  const renameOrganization = api.organizations.update.useMutation({
    onSuccess: () => {
      updateSession();
      // Admins resolve org/project context from these queries, not the session
      utils.organizations.byId.invalidate();
      utils.projects.byId.invalidate();
    },
    onError: (error) => form.setError("name", { message: error.message }),
  });

  function onSubmit(values: z.infer<typeof projectNameSchema>) {
    if (!organization || !hasAccess) return;
    capture("organization_settings:rename_form_submit");
    renameOrganization
      .mutateAsync({
        orgId: organization.id,
        name: values.name,
      })
      .then(() => {
        form.reset();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  return (
    <div>
      <Header title={tAuto("organization_name_1458ffe")} />
      <Card className="mb-4 p-3">
        {form.getValues().name !== "" ? (
          <p className="text-primary mb-4 text-sm">
            {tAuto("your_organization_will_be_renamed_value0_value1_ba1d709", {
              value0: orgName,
              value1: form.watch().name,
            })}
          </p>
        ) : (
          <p className="mb-4 text-sm">
            {tAuto("your_organization_is_currently_named_value0_784a869", {
              value0: orgName,
            })}
          </p>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1"
            id="rename-organization-form"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder={orgName}
                        {...field}
                        className="flex-1"
                        disabled={!hasAccess}
                      />
                      {!hasAccess && (
                        <span title={tAuto("no_access_63bde5f")}>
                          <LockIcon className="text-muted absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform" />
                        </span>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {hasAccess && (
              <Button
                variant="secondary"
                type="submit"
                loading={renameOrganization.isPending}
                disabled={form.getValues().name === "" || !hasAccess}
                className="mt-4"
              >
                {tAuto("save_efc007a")}{" "}
              </Button>
            )}
          </form>
        </Form>
      </Card>
    </div>
  );
}
