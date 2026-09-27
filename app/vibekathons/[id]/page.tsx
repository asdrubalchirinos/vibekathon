import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentThread } from "@/components/CommentThread";
import { ErrorBanner } from "@/components/ErrorBanner";
import { InviteBox } from "@/components/InviteBox";
import { Markdown } from "@/components/Markdown";
import { OrganizerPanel } from "@/components/OrganizerPanel";
import { StatusBadge, VisibilityBadge } from "@/components/StatusBadge";
import { getCurrentUser } from "@/lib/auth";
import {
  getInviteToken,
  getMySubmission,
  getVibekathon,
  listComments,
  listSubmissions,
} from "@/lib/data";
import { displayName, eventStatus, formatDate } from "@/lib/helpers";
import type { CommentWithAuthor } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getVibekathon(id);
  return { title: event?.title ?? "Vibekathon" };
}

export default async function VibekathonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const me = await getCurrentUser();
  const event = await getVibekathon(id);
  if (!event) notFound();

  const organizerView = me?.id === event.organizer_id;
  const inviteToken = organizerView ? await getInviteToken(id) : null;
  const status = eventStatus(event.starts_at, event.ends_at);
  const submissions = await listSubmissions(id);
  const mine = me ? await getMySubmission(id, me.id) : null;
  const winner = submissions.find((item) => item.id === event.winner_submission_id);

  const commentIds: string[] = [];
  if (organizerView) {
    commentIds.push(...submissions.map((item) => item.id));
  } else if (mine) {
    commentIds.push(mine.id);
  }
  const comments = await listComments(commentIds);
  const commentsBySubmission: Record<string, CommentWithAuthor[]> = {};
  for (const comment of comments) {
    commentsBySubmission[comment.submission_id] ??= [];
    commentsBySubmission[comment.submission_id].push(comment);
  }

  return (
    <div className="space-y-8">
      <ErrorBanner message={error} />

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge startsAt={event.starts_at} endsAt={event.ends_at} />
          <VisibilityBadge visibility={event.visibility} />
        </div>
        <h1 className="font-display text-4xl leading-tight">{event.title}</h1>
        <p className="text-[var(--muted)]">
          {formatDate(event.starts_at)} — {formatDate(event.ends_at)}
          {" · "}
          organiza {displayName(event.organizer)}
        </p>
        <div className="flex flex-wrap gap-2">
          {organizerView ? (
            <Link href={`/vibekathons/${id}/edit`} className="btn btn-ghost">
              Editar
            </Link>
          ) : null}
          {me && status !== "finished" ? (
            <Link href={`/vibekathons/${id}/submit`} className="btn btn-primary">
              {mine ? "Editar mi envío" : "Participar"}
            </Link>
          ) : null}
          {!me ? (
            <Link
              href={`/login?next=/vibekathons/${id}/submit`}
              className="btn btn-primary"
            >
              Entra para participar
            </Link>
          ) : null}
        </div>
      </header>

      {winner ? (
        <section className="card border-[var(--rust)] bg-[#fff7ed]">
          <p className="badge badge-winner">Ganador</p>
          <h2 className="mt-2 font-display text-2xl">
            {displayName(winner.participant)}
          </h2>
          <p className="mt-1 text-sm">{winner.description || "Proyecto ganador."}</p>
          <p className="mt-3 flex flex-wrap gap-3 text-sm">
            <a
              className="text-[var(--teal-dark)] underline"
              href={winner.repo_url}
              target="_blank"
              rel="noreferrer"
            >
              Ver repo
            </a>
            {winner.demo_url ? (
              <a
                className="text-[var(--teal-dark)] underline"
                href={winner.demo_url}
                target="_blank"
                rel="noreferrer"
              >
                Ver demo
              </a>
            ) : null}
          </p>
        </section>
      ) : null}

      <section className="card">
        <h2 className="mb-3 font-display text-2xl">El problema</h2>
        <Markdown text={event.description} />
      </section>

      {organizerView && event.visibility === "private" && inviteToken ? (
        <InviteBox eventId={id} token={inviteToken} />
      ) : null}

      {mine && !organizerView ? (
        <section className="card space-y-3">
          <h2 className="font-display text-2xl">Tu envío</h2>
          <p className="whitespace-pre-wrap text-sm">
            {mine.description || "Sin descripción."}
          </p>
          <p className="flex flex-wrap gap-3 text-sm">
            <a
              className="text-[var(--teal-dark)] underline"
              href={mine.repo_url}
              target="_blank"
              rel="noreferrer"
            >
              Repo
            </a>
            {mine.demo_url ? (
              <a
                className="text-[var(--teal-dark)] underline"
                href={mine.demo_url}
                target="_blank"
                rel="noreferrer"
              >
                Demo
              </a>
            ) : null}
          </p>
          <div className="border-t border-[var(--line)] pt-3">
            <h3 className="mb-2 text-sm font-semibold">Comentarios de revisión</h3>
            <CommentThread
              eventId={id}
              submissionId={mine.id}
              comments={commentsBySubmission[mine.id] ?? []}
              emptyText="Cuando el organizador comente, lo verás aquí. También puedes responder."
            />
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-2xl">
          Envíos {submissions.length ? `(${submissions.length})` : ""}
        </h2>
        {submissions.length === 0 ? (
          <div className="card text-sm text-[var(--muted)]">
            Todavía no hay proyectos enviados.
          </div>
        ) : (
          <ul className="grid gap-3">
            {submissions.map((submission) => (
              <li key={submission.id} className="card">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{displayName(submission.participant)}</p>
                  {event.winner_submission_id === submission.id ? (
                    <span className="badge badge-winner">Ganador</span>
                  ) : null}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {submission.description || "Sin descripción."}
                </p>
                <p className="mt-2 flex flex-wrap gap-3 text-sm">
                  <a
                    className="text-[var(--teal-dark)] underline"
                    href={submission.repo_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Repo
                  </a>
                  {submission.demo_url ? (
                    <a
                      className="text-[var(--teal-dark)] underline"
                      href={submission.demo_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Demo
                    </a>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {organizerView ? (
        <OrganizerPanel
          eventId={id}
          winnerId={event.winner_submission_id}
          submissions={submissions}
          commentsBySubmission={commentsBySubmission}
        />
      ) : null}
    </div>
  );
}
