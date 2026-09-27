import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SubmissionForm } from "@/components/SubmissionForm";
import { getCurrentUser } from "@/lib/auth";
import { getMySubmission, getVibekathon } from "@/lib/data";
import { eventStatus } from "@/lib/helpers";

export const metadata: Metadata = {
  title: "Enviar proyecto",
};

export default async function SubmitPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const me = await getCurrentUser();
  if (!me) redirect(`/login?next=/vibekathons/${id}/submit`);

  const event = await getVibekathon(id);
  if (!event) notFound();

  const status = eventStatus(event.starts_at, event.ends_at);
  const mine = await getMySubmission(id, me.id);

  if (status === "finished" && !mine) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-3xl">Este vibekathon ya terminó</h1>
        <p className="text-[var(--muted)]">
          Ya no se aceptan envíos nuevos.
        </p>
      </div>
    );
  }

  if (status === "finished" && mine) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-3xl">El plazo se cerró</h1>
        <p className="text-[var(--muted)]">
          Puedes ver tu envío en la página del evento, pero ya no se puede
          editar.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-3xl">
        {mine ? "Editar tu envío" : "Participar"}
      </h1>
      <p className="text-[var(--muted)]">
        Un envío por persona. Puedes corregirlo hasta la fecha de fin.
      </p>
      <SubmissionForm eventId={id} submission={mine} error={error} />
    </div>
  );
}
