/**
 * TraceMetadataBadges - Extracted badge components for trace metadata
 *
 * Following the pattern from ObservationDetailView/ObservationMetadataBadgesSimple.tsx
 * Each badge handles its own null check and returns null when data is unavailable.
 */

import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function SessionBadge({
  sessionId,
  projectId,
}: {
  sessionId: string | null;
  projectId: string;
}) {
  if (!sessionId) return null;

  const text = `Session: ${sessionId}`;

  return (
    <Link
      href={`/project/${projectId}/sessions/${encodeURIComponent(sessionId)}`}
      className="inline-flex"
    >
      <Badge>
        <span className="truncate" title={text}>
          {text}
        </span>
        <ExternalLinkIcon className="ml-1 h-3 w-3" />
      </Badge>
    </Link>
  );
}

export function UserIdBadge({
  userId,
  projectId,
}: {
  userId: string | null;
  projectId: string;
}) {
  if (!userId) return null;

  const text = `User ID: ${userId}`;

  return (
    <Link
      href={`/project/${projectId}/users/${encodeURIComponent(userId)}`}
      className="inline-flex"
    >
      <Badge>
        <span className="truncate" title={text}>
          {text}
        </span>
        <ExternalLinkIcon className="ml-1 h-3 w-3" />
      </Badge>
    </Link>
  );
}

export function TargetTraceBadge({
  targetTraceId,
  projectId,
}: {
  targetTraceId: string | null;
  projectId: string;
}) {
  if (!targetTraceId) return null;

  const text = `Target Trace: ${targetTraceId}`;

  return (
    <Link
      href={`/project/${projectId}/traces/${encodeURIComponent(targetTraceId)}`}
      className="inline-flex"
    >
      <Badge>
        <span className="truncate" title={text}>
          {text}
        </span>
        <ExternalLinkIcon className="ml-1 h-3 w-3" />
      </Badge>
    </Link>
  );
}

export function EnvironmentBadge({
  environment,
}: {
  environment: string | null;
}) {
  const tAuto = useAutoTranslations();
  if (!environment) return null;
  return (
    <Badge variant="tertiary">
      {tAuto("env_9b9526d")} {environment}
    </Badge>
  );
}

export function ReleaseBadge({ release }: { release: string | null }) {
  const tAuto = useAutoTranslations();
  if (!release) return null;
  return (
    <Badge variant="tertiary">
      {tAuto("release_c720e68")} {release}
    </Badge>
  );
}

export function VersionBadge({ version }: { version: string | null }) {
  const tAuto = useAutoTranslations();
  if (!version) return null;
  return (
    <Badge variant="tertiary">
      {tAuto("version_9f49127")} {version}
    </Badge>
  );
}
