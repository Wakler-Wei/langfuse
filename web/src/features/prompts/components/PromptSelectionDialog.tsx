import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Label } from "@/src/components/ui/label";
import { api } from "@/src/utils/api";
import { CopyIcon, ExternalLinkIcon } from "lucide-react";
import { copyTextToClipboard } from "@/src/utils/clipboard";
import { getPromptDetailHref } from "@/src/features/prompts/utils";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type PromptSelectionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (tag: string) => void;
  projectId: string;
};

export function PromptSelectionDialog({
  isOpen,
  onClose,
  onSelect,
  projectId,
}: PromptSelectionDialogProps) {
  const tAuto = useAutoTranslations();
  const [selectedPromptName, setSelectedPromptName] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [selectionType, setSelectionType] = useState<"version" | "label">(
    "label",
  );
  const [selectedVersionOrLabel, setSelectedVersionOrLabel] =
    useState<string>("");

  const copySelectedTag = useCallback(() => {
    copyTextToClipboard(selectedTag);
  }, [selectedTag]);

  useEffect(() => {
    if (isOpen) {
      setSelectedPromptName("");
      setSelectedTag("");
      setSelectionType("label");
      setSelectedVersionOrLabel("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedPromptName && selectedVersionOrLabel) {
      if (selectionType === "version") {
        setSelectedTag(
          `@@@langfusePrompt:name=${selectedPromptName}|version=${selectedVersionOrLabel}@@@`,
        );
      } else {
        setSelectedTag(
          `@@@langfusePrompt:name=${selectedPromptName}|label=${selectedVersionOrLabel}@@@`,
        );
      }
    } else {
      setSelectedTag("");
    }
  }, [selectedPromptName, selectedVersionOrLabel, selectionType]);

  const { data: promptOptions } = api.prompts.getPromptLinkOptions.useQuery(
    {
      projectId,
    },
    {
      enabled: Boolean(projectId),
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
    },
  );

  const selectedPrompt = promptOptions?.find(
    (option) => option.name === selectedPromptName,
  );

  const handleConfirm = useCallback(() => {
    if (!selectedTag) return;
    if (onSelect) {
      onSelect(selectedTag);
    } else {
      copySelectedTag();
    }
    onClose();
  }, [copySelectedTag, selectedTag, onSelect, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {tAuto("add_inline_prompt_reference_2e5a608")}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              {tAuto(
                "referenced_prompts_are_dynamically_resolved_and_inse_a743273",
              )}{" "}
            </p>

            <div className="flex flex-col gap-2">
              <Label htmlFor="prompt-name">
                {tAuto("prompt_name_b180cb6")}
              </Label>
              <Select
                value={selectedPromptName}
                onValueChange={(value) => {
                  setSelectedPromptName(value);
                  setSelectedVersionOrLabel("");
                }}
              >
                <SelectTrigger id="prompt-name">
                  <SelectValue
                    placeholder={tAuto("select_a_text_prompt_57e4566")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {promptOptions?.map((prompt) => (
                    <SelectItem key={prompt.name} value={prompt.name}>
                      {prompt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                {tAuto(
                  "only_text_prompts_can_be_referenced_inline_0534458",
                )}{" "}
              </p>
            </div>

            {selectedPromptName && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="selection-type">
                  {tAuto("reference_by_7d10292")}
                </Label>
                <Select
                  value={selectionType}
                  onValueChange={(value: "version" | "label") => {
                    setSelectionType(value);
                    setSelectedVersionOrLabel("");
                  }}
                >
                  <SelectTrigger id="selection-type">
                    <SelectValue
                      placeholder={tAuto("select_link_type_ba42d88")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="label">
                      {tAuto("label_74341e3")}
                    </SelectItem>
                    <SelectItem value="version">
                      {tAuto("version_2da600b")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedPromptName && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="version-or-label">
                  {selectionType === "version"
                    ? tAuto("version_2da600b")
                    : tAuto("label_74341e3")}
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedVersionOrLabel}
                    onValueChange={setSelectedVersionOrLabel}
                  >
                    <SelectTrigger id="version-or-label">
                      <SelectValue
                        placeholder={
                          selectionType === "version"
                            ? tAuto("select_a_version_f98521d")
                            : tAuto("select_a_label_65a33e3")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {selectionType === "version"
                        ? selectedPrompt?.versions.map((version) => (
                            <SelectItem
                              key={version.toString()}
                              value={version.toString()}
                            >
                              {version}
                            </SelectItem>
                          ))
                        : selectedPrompt?.labels.map((label) => (
                            <SelectItem key={label} value={label}>
                              {label}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                  {selectedVersionOrLabel && (
                    <Link
                      href={`${getPromptDetailHref(projectId, selectedPromptName)}?${selectionType}=${encodeURIComponent(selectedVersionOrLabel)}`}
                      target="_blank"
                      passHref
                    >
                      <Button type="button" variant="outline" size="icon">
                        <ExternalLinkIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedTag && (
            <div className="space-y-2">
              <Label>{tAuto("tag_preview_cfb4ed8")}</Label>
              <div className="relative">
                <div className="bg-muted rounded-md border p-3 pr-10 font-mono text-xs">
                  {selectedTag}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={copySelectedTag}
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                {onSelect
                  ? tAuto(
                      "this_tag_will_be_inserted_into_the_prompt_content_072f92a",
                    )
                  : tAuto(
                      "this_tag_will_be_copied_to_clipboard_to_be_then_inse_e2747a8",
                    )}
              </p>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {tAuto("cancel_77dfd21")}{" "}
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!selectedTag}>
            {onSelect
              ? tAuto("insert_95802da")
              : tAuto("copy_and_close_b430fb6")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
