import { eventStatus, statusLabel, visibilityLabel } from "@/lib/helpers";
import type { Visibility } from "@/lib/types";

export function StatusBadge({
  startsAt,
  endsAt,
}: {
  startsAt: string;
  endsAt: string;
}) {
  const status = eventStatus(startsAt, endsAt);
  return <span className={`badge badge-${status}`}>{statusLabel(status)}</span>;
}

export function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  if (visibility === "public") return null;
  return <span className="badge badge-private">{visibilityLabel(visibility)}</span>;
}
