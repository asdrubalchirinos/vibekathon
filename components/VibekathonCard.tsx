import Link from "next/link";
import { displayName, formatDateOnly } from "@/lib/helpers";
import type { VibekathonWithOrganizer } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function VibekathonCard({ event }: { event: VibekathonWithOrganizer }) {
  return (
    <Link href={`/vibekathons/${event.id}`} className="card block hover:border-[var(--teal)]">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge startsAt={event.starts_at} endsAt={event.ends_at} />
      </div>
      <h3 className="mt-3 font-display text-xl leading-snug">{event.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-[var(--muted)]">
        {event.description || "Sin descripción."}
      </p>
      <p className="mt-4 text-sm text-[var(--muted)]">
        {formatDateOnly(event.starts_at)} — {formatDateOnly(event.ends_at)}
        {" · "}
        organiza {displayName(event.organizer)}
      </p>
    </Link>
  );
}
