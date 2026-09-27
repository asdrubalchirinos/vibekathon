import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/SignInButton";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Invitación",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-3xl">Invitación</h1>
        <p className="text-[var(--muted)]">
          Configura Supabase para aceptar invitaciones.
        </p>
      </div>
    );
  }

  const me = await getCurrentUser();
  if (!me) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="font-display text-3xl">Te invitaron a un vibekathon</h1>
        <p className="text-[var(--muted)]">
          Entra con GitHub para aceptar la invitación. Los eventos privados no
          aparecen en la portada.
        </p>
        <SignInButton next={`/invite/${token}`} label="Aceptar con GitHub" />
      </div>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_invite", { token });

  if (error || !data) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-3xl">Invitación no válida</h1>
        <p className="text-[var(--muted)]">
          El link puede haber sido regenerado o no existir. Pídele uno nuevo a
          quien organiza.
        </p>
      </div>
    );
  }

  redirect(`/vibekathons/${data}`);
}
