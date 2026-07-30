import React from "react";
import { Button } from "@/src/components/ui/button";
import {
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { ApiKeyDetailContent } from "@/src/features/public-api/components/ApiKeyDetailContent";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type ApiKeyScope = "project" | "organization";

export type ApiKeyCreateDialogContentProps =
  | {
      scope: ApiKeyScope;
      type: "form";
      note: string;
      onNoteChange: (value: string) => void;
      onSubmit: () => void;
      isPending?: boolean;
    }
  | (Omit<
      React.ComponentProps<typeof ApiKeyDetailContent>,
      "showMcpSection"
    > & {
      type: "detail";
    });

export function ApiKeyCreateDialogContent(
  props: ApiKeyCreateDialogContentProps,
) {
  const tAuto = useAutoTranslations();
  const { scope } = props;

  if (props.type === "detail") {
    const { secretKey, publicKey, baseUrl } = props;

    return (
      <DialogContent closeOnInteractionOutside>
        <DialogHeader>
          <DialogTitle>{tAuto("api_keys_e18ffc8")}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <ApiKeyDetailContent
            scope={scope}
            secretKey={secretKey}
            publicKey={publicKey}
            baseUrl={baseUrl}
            showMcpSection={true}
          />
        </DialogBody>
      </DialogContent>
    );
  }

  const { note, onNoteChange, onSubmit, isPending } = props;

  return (
    <DialogContent closeOnInteractionOutside>
      <DialogHeader>
        <DialogTitle>{tAuto("create_api_keys_c0979fd")}</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <div className="space-y-4">
          <div>
            <Label htmlFor="note">{tAuto("note_optional_4e39567")}</Label>
            <Input
              id="note"
              placeholder={tAuto("production_key_3c392fc")}
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSubmit();
                }
              }}
              className="mt-1.5"
            />
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button onClick={onSubmit} loading={isPending}>
          {tAuto("create_api_keys_e5f0bf3")}{" "}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
