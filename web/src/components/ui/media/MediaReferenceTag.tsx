import { useState } from "react";
import { MediaTag } from "./MediaTag";
import { useResolvedMedia } from "./useResolvedMedia";
import { type MediaDescriptor } from "./mediaUtils";
import { OBSERVATION_FIELD_SIZE_LIMIT_MEDIA_SOURCE } from "@langfuse/shared";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type LangfuseRefDescriptor = Extract<MediaDescriptor, { kind: "langfuseRef" }>;

/**
 * Container that connects a classified media value to the pure `MediaTag`: it
 * arms the lazy fetch the first time the peek opens (hover/focus) and keeps it
 * armed so re-hovers read from the query cache instead of re-fetching.
 */
export function MediaReferenceTag({
  descriptor,
}: {
  descriptor: MediaDescriptor;
}) {
  if (descriptor.kind !== "langfuseRef") {
    return (
      <MediaTag
        contentType={descriptor.contentType}
        status="ready"
        url={descriptor.src}
      />
    );
  }

  return <LangfuseRefMediaTag descriptor={descriptor} />;
}

function LangfuseRefMediaTag({
  descriptor,
}: {
  descriptor: LangfuseRefDescriptor;
}) {
  const tAuto = useAutoTranslations();
  const [armed, setArmed] = useState(false);
  const { status, url, contentLength } = useResolvedMedia(descriptor, {
    enabled: armed,
  });
  const isOversizedField =
    descriptor.source === OBSERVATION_FIELD_SIZE_LIMIT_MEDIA_SOURCE;

  return (
    <MediaTag
      contentType={descriptor.contentType}
      status={status}
      url={url}
      contentLength={contentLength}
      label={
        isOversizedField ? tAuto("full_value_attached_57028e2") : undefined
      }
      description={
        isOversizedField
          ? tAuto(
              "this_field_was_too_large_to_process_inline_so_langfu_5cf632d",
            )
          : undefined
      }
      openActionLabel={isOversizedField ? "Open original" : undefined}
      intent={isOversizedField ? "attachment" : undefined}
      onOpenChange={(open) => {
        if (open) setArmed(true);
      }}
    />
  );
}
