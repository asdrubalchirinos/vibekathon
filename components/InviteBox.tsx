"use client";

import { useSyncExternalStore } from "react";
import { regenerateInviteToken } from "@/lib/actions";
import { ConfirmSubmitButton } from "./ConfirmSubmitButton";
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
        regeneras el link, el anterior deja de funcionar y se revoca el acceso
        de quienes ya lo habían abierto, <strong>excepto</strong> de quienes
        ya enviaron un repo a este vibekathon.
      </p>
      <p className="break-all rounded-lg bg-[#f7f2e8] px-3 py-2 text-sm">{inviteUrl}</p>
      <div className="flex flex-wrap gap-2">
        <CopyButton value={inviteUrl} label="Copiar link" />
        <form action={regenerateInviteToken}>
          <input type="hidden" name="id" value={eventId} />
          <ConfirmSubmitButton
            className="btn btn-ghost"
            message="El link anterior dejará de funcionar. Quienes ya entraron perderán el acceso, salvo que hayan enviado un proyecto. ¿Regenerar?"
          >
            Regenerar link
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}
