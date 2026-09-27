"use client";

import { useSyncExternalStore } from "react";
import { regenerateInviteToken } from "@/lib/actions";
import { CopyButton } from "./CopyButton";

function subscribe() {
  return () => {};
}

export function InviteBox({
  eventId,
  token,
}: {
  eventId: string;
  token: string;
}) {
  const origin = useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => "",
  );
  const inviteUrl = origin ? `${origin}/invite/${token}` : `/invite/${token}`;

  return (
    <div className="card space-y-3">
      <h2 className="font-display text-xl">Link de invitación</h2>
      <p className="text-sm text-[var(--muted)]">
        Este evento es privado. Quien no tenga este link no puede verlo. Si
        regeneras el token, el link anterior deja de funcionar; quienes ya
        entraron siguen teniendo acceso.
      </p>
      <p className="break-all rounded-lg bg-[#f7f2e8] px-3 py-2 text-sm">{inviteUrl}</p>
      <div className="flex flex-wrap gap-2">
        <CopyButton value={inviteUrl} label="Copiar link" />
        <form action={regenerateInviteToken}>
          <input type="hidden" name="id" value={eventId} />
          <button type="submit" className="btn btn-ghost">
            Regenerar link
          </button>
        </form>
      </div>
    </div>
  );
}
