import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EventForm } from "@/components/EventForm";
import { getCurrentUser } from "@/lib/auth";
import { getVibekathon } from "@/lib/data";

export const metadata: Metadata = {
  title: "Editar vibekathon",
};

export default async function EditVibekathonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const me = await getCurrentUser();
  if (!me) redirect(`/login?next=/vibekathons/${id}/edit`);

  const event = await getVibekathon(id);
  if (!event) notFound();
  if (event.organizer_id !== me.id) redirect(`/vibekathons/${id}`);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-3xl">Editar vibekathon</h1>
      <EventForm event={event} error={error} />
    </div>
  );
}
