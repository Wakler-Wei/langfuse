import { PagedSettingsContainer } from "@/src/components/PagedSettingsContainer";
import Header from "@/src/components/layouts/header";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { api } from "@/src/utils/api";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/src/components/ui/form";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { useSession, signOut } from "next-auth/react";
import { SettingsDangerZone } from "@/src/components/SettingsDangerZone";
import ContainerPage from "@/src/components/layouts/container-page";
import { useRouter } from "next/router";
import { StringNoHTML } from "@langfuse/shared";
import Link from "next/link";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { useTranslations } from "next-intl";

function UpdateDisplayName() {
  const { data: session, update: updateSession } = useSession();
  const utils = api.useUtils();
  const t = useTranslations("AccountSettings");
  const displayNameSchema = z.object({
    name: StringNoHTML.min(1, t("displayNameRequired")).max(
      100,
      t("displayNameTooLong"),
    ),
  });

  const form = useForm({
    resolver: zodResolver(displayNameSchema),
    defaultValues: {
      name: "",
    },
  });

  const updateDisplayName = api.userAccount.updateDisplayName.useMutation({
    onSuccess: async () => {
      await updateSession();
      await utils.invalidate();
      form.reset();
      showSuccessToast({
        title: t("displayNameUpdated"),
        description: t("displayNameUpdatedDescription"),
      });
    },
    onError: (error) => form.setError("name", { message: error.message }),
  });

  function onSubmit(values: z.infer<typeof displayNameSchema>) {
    updateDisplayName.mutate({ name: values.name });
  }

  return (
    <div>
      <Header title={t("displayName")} />
      <Card className="p-3">
        {form.getValues().name !== "" ? (
          <p className="text-primary mb-4 text-sm">
            {t("displayNameChange", {
              currentName: session?.user?.name ?? "",
              nextName: form.watch().name,
            })}
          </p>
        ) : (
          <p className="text-primary mb-4 text-sm">
            {t("displayNameCurrent", { name: session?.user?.name ?? "" })}
          </p>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder={session?.user?.name ?? ""}
                      {...field}
                      className="flex-1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              variant="secondary"
              type="submit"
              loading={updateDisplayName.isPending}
              disabled={form.getValues().name === ""}
              className="mt-4"
            >
              {t("save")}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}

function DeleteAccountButton() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email ?? "";
  const t = useTranslations("AccountSettings");

  const { data: canDeleteData } = api.userAccount.checkCanDelete.useQuery();
  const deleteAccount = api.userAccount.delete.useMutation();

  const formSchema = z.object({
    email: z.string().refine((val) => val === userEmail, {
      message: t("deleteAccountEmailMismatch", { email: userEmail }),
    }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const canDelete = canDeleteData?.canDelete ?? false;
  const blockingOrganizations = canDeleteData?.blockingOrganizations ?? [];

  const onSubmit = async () => {
    if (!canDelete) return;
    try {
      await deleteAccount.mutateAsync();
      showSuccessToast({
        title: t("accountDeleted"),
        description: t("accountDeletedDescription"),
      });
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await signOut();
    } catch (error) {
      console.error(error);
      showErrorToast(
        t("deleteAccountFailed"),
        error instanceof Error ? error.message : t("unexpectedError"),
      );
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive-secondary">{t("deleteAccount")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {t("deleteAccount")}
          </DialogTitle>
          <DialogDescription>
            {!canDelete && blockingOrganizations.length > 0 ? (
              <div>
                <p className="mb-2">{t("deleteAccountBlocked")}</p>
                <ul className="list-inside list-disc space-y-1">
                  {blockingOrganizations.map((org) => (
                    <li key={org.id}>
                      <Link
                        href={`/organization/${org.id}/settings`}
                        className="text-primary hover:text-primary/80 font-bold underline"
                      >
                        {org.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-2">{t("deleteAccountBlockedAction")}</p>
              </div>
            ) : (
              t("deleteAccountConfirm", { email: userEmail })
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {canDelete && (
              <DialogBody>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder={userEmail} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </DialogBody>
            )}
            <DialogFooter>
              <Button
                type="submit"
                variant="destructive"
                loading={deleteAccount.isPending}
                disabled={!canDelete}
                className="w-full"
              >
                {t("deleteAccount")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

type AccountSettingsPage = {
  title: string;
  slug: string;
  content: React.ReactNode;
  cmdKKeywords?: string[];
};

export function useAccountSettingsPages(): AccountSettingsPage[] {
  const { data: session } = useSession();
  const userEmail = session?.user?.email ?? "";
  const t = useTranslations("AccountSettings");

  return [
    {
      title: t("general"),
      slug: "index",
      cmdKKeywords: [
        "account",
        "user",
        "profile",
        "email",
        "password",
        "name",
        "display",
        "delete",
        "remove",
      ],
      content: (
        <div className="flex flex-col gap-6">
          <div>
            <Header title={t("email")} />
            <Card className="p-3">
              <p className="text-primary text-sm">
                {t("emailAddress", { email: userEmail })}
              </p>
            </Card>
          </div>
          <UpdateDisplayName />
          <div>
            <Header title={t("password")} />
            <Card className="p-3">
              <p className="text-primary mb-4 text-sm">
                {t("passwordDescription")}
              </p>
              <Button asChild variant="secondary">
                <Link href="/auth/reset-password">{t("changePassword")}</Link>
              </Button>
            </Card>
          </div>
          <SettingsDangerZone
            items={[
              {
                title: t("deleteAccountTitle"),
                description: t("deleteAccountDescription"),
                button: <DeleteAccountButton />,
              },
            ]}
          />
        </div>
      ),
    },
  ];
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const pages = useAccountSettingsPages();
  const t = useTranslations("AccountSettings");

  return (
    <ContainerPage
      headerProps={{
        title: t("title"),
      }}
    >
      <PagedSettingsContainer
        activeSlug={router.query.page as string | undefined}
        pages={pages}
      />
    </ContainerPage>
  );
}
