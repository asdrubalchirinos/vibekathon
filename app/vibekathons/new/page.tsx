import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EventForm } from "@/components/EventForm";
import { getCurrentUser } from "@/lib/auth";
import { MAX_EVENTS_PER_DAY } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Crear vibekathon",
};

export default async function NewVibekathonPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-3xl">Crear un vibekathon</h1>
        <p className="text-[var(--muted)]">
          Primero configura Supabase. El README explica cómo en unos minutos.
        </p>
      </div>
    );
  }

  const me = await getCurrentUser();
  if (!me) redirect("/login?next=/vibekathons/new");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-3xl">Crear un vibekathon</h1>
      <p className="text-[var(--muted)]">
        Publica el problema, las fechas y si el llamado es abierto o solo por
        invitación. Hay un límite de {MAX_EVENTS_PER_DAY} vibekathons creados cada 24 horas.
      </p>
      <EventForm error={error} />
    </div>
  );
}
