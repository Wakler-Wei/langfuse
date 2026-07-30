import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Table,
  TableBody,
  TableCell,
  TableCellWithCopyButton,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import Header from "@/src/components/layouts/header";
import { useHasEntitlement } from "@/src/features/entitlements/hooks";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { useHasOrganizationAccess } from "@/src/features/rbac/utils/checkOrganizationAccess";
import { api } from "@/src/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ChevronRight, TrashIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

const addDomainSchema = z.object({
  domain: z
    .string()
    .trim()
    .min(3)
    .max(253)
    .transform((v) => v.toLowerCase())
    .refine(
      (v) =>
        /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(
          v,
        ),
      { message: "Must be a valid domain (e.g. acme.com)" },
    ),
});

type AddDomainInput = z.infer<typeof addDomainSchema>;

export const VerifiedDomainsSettings = ({ orgId }: { orgId: string }) => {
  const tAuto = useAutoTranslations();
  const hasEntitlement = useHasEntitlement("cloud-multi-tenant-sso");
  const hasAccess = useHasOrganizationAccess({
    organizationId: orgId,
    scope: "organization:update",
  });

  const heading = (
    <>
      <Header title={tAuto("verified_domains_8be53e0")} />
      <p className="text-muted-foreground mb-4 text-sm">
        {tAuto(
          "you_can_only_configure_sso_for_domains_your_organiza_6b39a96",
        )}{" "}
      </p>
    </>
  );

  if (!hasEntitlement) {
    return (
      <div>
        {heading}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{tAuto("not_available_d1a17af")}</AlertTitle>
          <AlertDescription>
            {tAuto(
              "verified_domains_and_enterprise_sso_are_not_availabl_5c5f898",
            )}{" "}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div>
        {heading}
        <Alert>
          <AlertTitle>{tAuto("access_denied_1647b9d")}</AlertTitle>
          <AlertDescription>
            {tAuto(
              "you_do_not_have_permission_to_manage_verified_domain_720a456",
            )}{" "}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        title={tAuto("verified_domains_8be53e0")}
        actionButtons={<AddDomainButton orgId={orgId} />}
      />
      <p className="text-muted-foreground text-sm">
        {tAuto(
          "you_can_only_configure_sso_for_domains_your_organiza_6b39a96",
        )}{" "}
      </p>
      <DomainsTable orgId={orgId} />
    </div>
  );
};

function DomainsTable({ orgId }: { orgId: string }) {
  const tAuto = useAutoTranslations();
  const query = api.verifiedDomain.list.useQuery({ orgId });

  return (
    <Card className="mb-4 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-primary pl-2.5">
              {tAuto("domain_9b10914")}
            </TableHead>
            <TableHead className="text-primary">
              {tAuto("status_bae7d5b")}
            </TableHead>
            <TableHead className="text-primary hidden md:table-cell">
              {tAuto("added_b68734c")}{" "}
            </TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody className="text-muted-foreground">
          {query.data && query.data.length === 0 ? (
            <TableRow>
              <TableCell
                density="comfortable"
                colSpan={4}
                className="py-12 text-center text-sm"
              >
                {tAuto("no_domains_added_yet_d6fdffb")}{" "}
              </TableCell>
            </TableRow>
          ) : (
            query.data?.map((row) => (
              <DomainRow key={row.id} orgId={orgId} row={row} />
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

type DomainRowData = {
  id: string;
  domain: string;
  verifiedAt: Date | null;
  createdAt: Date;
  recordHost: string;
  recordValue: string;
};

function DomainRow({ orgId, row }: { orgId: string; row: DomainRowData }) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const [expanded, setExpanded] = useState(!row.verifiedAt);
  const utils = api.useUtils();

  const verifyMutation = api.verifiedDomain.verify.useMutation({
    onSuccess: () => {
      utils.verifiedDomain.list.invalidate({ orgId });
      utils.ssoConfig.get.invalidate({ orgId });
      showSuccessToast({
        title: tAuto("domain_verified_0633c71"),
        description: tAuto("value0_is_now_verified_f702553", {
          value0: row.domain,
        }),
      });
    },
    onError: (err) => {
      showErrorToast(tAutoI18n("verification_failed_e10d7e5"), err.message);
    },
  });

  return (
    <>
      <TableRow className="hover:bg-primary-foreground">
        <TableCell density="comfortable" className="font-mono">
          {!row.verifiedAt ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1"
            >
              <ChevronRight
                className={`h-3 w-3 transition-transform ${
                  expanded ? "rotate-90" : ""
                }`}
              />
              {row.domain}
            </button>
          ) : (
            row.domain
          )}
        </TableCell>
        <TableCell density="comfortable">
          {row.verifiedAt ? (
            <Badge variant="default">{tAuto("verified_aed3b8c")}</Badge>
          ) : (
            <Badge variant="secondary">
              {tAuto("pending_verification_f0ac0a5")}
            </Badge>
          )}
        </TableCell>
        <TableCell density="comfortable" className="hidden md:table-cell">
          {row.createdAt.toLocaleDateString()}
        </TableCell>
        <TableCell
          density="comfortable"
          className="flex items-center justify-end gap-2"
        >
          {!row.verifiedAt && (
            <Button
              size="sm"
              onClick={() => verifyMutation.mutate({ orgId, id: row.id })}
              loading={verifyMutation.isPending}
            >
              {tAuto("verify_dda6ac2")}{" "}
            </Button>
          )}
          <DeleteDomainButton
            orgId={orgId}
            id={row.id}
            domain={row.domain}
            verified={Boolean(row.verifiedAt)}
          />
        </TableCell>
      </TableRow>
      {!row.verifiedAt && expanded && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={4} className="py-4">
            <DnsInstructions
              recordHost={row.recordHost}
              recordValue={row.recordValue}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function DnsInstructions({
  recordHost,
  recordValue,
}: {
  recordHost: string;
  recordValue: string;
}) {
  const tAuto = useAutoTranslations();
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold">
        {tAuto(
          "add_the_following_txt_record_to_your_dns_provider_a932062",
        )}{" "}
      </p>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">{tAuto("type_3deb745")}</TableHead>
              <TableHead className="w-54">{tAuto("host_3960ec4")}</TableHead>
              <TableHead>{tAuto("value_8dce170")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell density="comfortable" className="w-16 font-mono">
                TXT
              </TableCell>
              <TableCellWithCopyButton
                density="comfortable"
                text={recordHost}
                className="w-54 py-3 font-mono break-all"
              />
              <TableCellWithCopyButton
                density="comfortable"
                text={recordValue}
                className="py-3 font-mono break-all"
              />
            </TableRow>
          </TableBody>
        </Table>
      </Card>
      <p className="text-muted-foreground text-xs">
        {tAuto("dns_changes_may_take_up_to_24h_to_propagate_after_ad_99e9551")}{" "}
        <span className="font-bold">{tAuto("verify_dda6ac2")}</span>.
      </p>
    </div>
  );
}

function AddDomainButton({ orgId }: { orgId: string }) {
  const tAuto = useAutoTranslations();
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();

  const form = useForm<AddDomainInput>({
    resolver: zodResolver(addDomainSchema),
    defaultValues: { domain: "" },
  });

  const createMutation = api.verifiedDomain.create.useMutation({
    onSuccess: () => {
      utils.verifiedDomain.list.invalidate({ orgId });
      showSuccessToast({
        title: tAuto("domain_added_884de03"),
        description: tAuto(
          "add_the_dns_txt_record_shown_in_the_table_then_click_1c60c66",
        ),
      });
      form.reset();
      setOpen(false);
    },
    onError: (err) => {
      form.setError("domain", { message: err.message });
    },
  });

  function onSubmit(values: AddDomainInput) {
    createMutation.mutate({ orgId, domain: values.domain });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{tAuto("add_domain_074977f")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tAuto("add_a_domain_b4b41f0")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody>
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAuto("domain_9b10914")}</FormLabel>
                    <FormControl>
                      <Input placeholder="acme.com" autoFocus {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                {tAuto("cancel_77dfd21")}{" "}
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                {tAuto("add_61cc55a")}{" "}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDomainButton({
  orgId,
  id,
  domain,
  verified,
}: {
  orgId: string;
  id: string;
  domain: string;
  verified: boolean;
}) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const utils = api.useUtils();

  const deleteMutation = api.verifiedDomain.delete.useMutation({
    onSuccess: () => {
      utils.verifiedDomain.list.invalidate({ orgId });
      showSuccessToast({
        title: tAuto("domain_removed_0123506"),
        description: tAuto("value0_has_been_removed_78cd3b0", {
          value0: domain,
        }),
      });
    },
    onError: (err) => {
      showErrorToast(tAutoI18n("failed_to_remove_domain_fc723ce"), err.message);
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={tAuto("delete_value0_4d18989", { value0: domain })}
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {tAutoI18n("remove_e963907")} {domain}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {verified
              ? tAutoI18n(
                  "if_an_sso_configuration_exists_for_this_domain_you_m_0695e2a",
                )
              : tAutoI18n(
                  "this_removes_the_pending_claim_the_domain_can_be_re__56588c0",
                )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tAuto("cancel_77dfd21")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate({ orgId, id })}
            disabled={deleteMutation.isPending}
          >
            {tAuto("remove_e963907")}{" "}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
