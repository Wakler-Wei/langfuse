/**
 * Simple metadata badges for ObservationDetailView
 * Each badge handles its own null checks and returns null when data is unavailable
 */

import { Badge } from "@/src/components/ui/badge";
import { formatIntervalSeconds } from "@/src/utils/dates";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function LatencyBadge({
  latencySeconds,
}: {
  latencySeconds: number | null;
}) {
  const tAuto = useAutoTranslations();
  if (latencySeconds == null) return null;

  return (
    <Badge variant="tertiary">
      {tAuto("latency_4dea3dc")} {formatIntervalSeconds(latencySeconds)}
    </Badge>
  );
}

export function TimeToFirstTokenBadge({
  timeToFirstToken,
}: {
  timeToFirstToken: number | null | undefined;
}) {
  const tAuto = useAutoTranslations();
  if (timeToFirstToken == null) return null;

  return (
    <Badge variant="tertiary">
      {tAuto("time_to_first_token_d93e946")}{" "}
      {formatIntervalSeconds(timeToFirstToken)}
    </Badge>
  );
}

export function EnvironmentBadge({
  environment,
}: {
  environment: string | null | undefined;
}) {
  const tAuto = useAutoTranslations();
  if (!environment) return null;

  return (
    <Badge variant="tertiary">
      {tAuto("env_9b9526d")} {environment}
    </Badge>
  );
}

export function ReleaseBadge({
  release,
}: {
  release: string | null | undefined;
}) {
  const tAuto = useAutoTranslations();
  if (!release) return null;

  return (
    <Badge variant="tertiary">
      {tAuto("release_c720e68")} {release}
    </Badge>
  );
}

export function VersionBadge({
  version,
}: {
  version: string | null | undefined;
}) {
  const tAuto = useAutoTranslations();
  if (!version) return null;

  return (
    <Badge variant="tertiary">
      {tAuto("version_9f49127")} {version}
    </Badge>
  );
}

export function LevelBadge({ level }: { level: string | null | undefined }) {
  if (!level || level === "DEFAULT") return null;

  return (
    <Badge
      variant={
        level === "ERROR"
          ? "destructive"
          : level === "WARNING"
            ? "warning"
            : "tertiary"
      }
    >
      {level}
    </Badge>
  );
}

export function StatusMessageBadge({
  statusMessage,
}: {
  statusMessage: string | null | undefined;
}) {
  if (!statusMessage) return null;

  return <Badge variant="tertiary">{statusMessage}</Badge>;
}
