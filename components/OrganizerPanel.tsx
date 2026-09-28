import { setSubmissionScoreAction, setWinnerAction } from "@/lib/actions";
import { displayName, formatDate } from "@/lib/helpers";
import type { CommentWithAuthor, EventStatus, SubmissionWithParticipant } from "@/lib/types";
import { CommentThread } from "./CommentThread";

export function OrganizerPanel({
  eventId,
  winnerId,
  submissions,
  commentsBySubmission,
  status,
  endsAt,
  currentUserId,
}: {
  eventId: string;
  winnerId: string | null;
  submissions: SubmissionWithParticipant[];
  commentsBySubmission: Record<string, CommentWithAuthor[]>;
  status: EventStatus;
  endsAt: string;
  currentUserId: string;
}) {
  const canJudge = status === "finished";

  return (
    <section className="space-y-4">
      <h2 className="font-display text-2xl">Panel del organizador</h2>
      <p className="text-sm text-[var(--muted)]">
        Puedes comentar durante el evento. El puntaje y el ganador se eligen
        cuando ya cerró el plazo de envíos ({formatDate(endsAt)}).
      </p>

      {!canJudge ? (
        <p className="card text-sm text-[var(--muted)]">
          {status === "upcoming"
            ? `El vibekathon todavía no empieza. Cuando termine (${formatDate(endsAt)}) podrás puntuar y elegir ganador.`
            : `Todavía no puedes puntuar ni elegir ganador: el evento cierra el ${formatDate(endsAt)}. Los comentarios sí están permitidos.`}
        </p>
      ) : null}

      {submissions.length === 0 ? (
        <div className="card text-sm text-[var(--muted)]">
          Todavía no hay participantes.
        </div>
      ) : (
        <ul className="space-y-4">
          {submissions.map((submission) => {
            const isWinner = winnerId === submission.id;
            return (
              <li key={submission.id} className="card space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{displayName(submission.participant)}</p>
                    <p className="text-xs text-[var(--muted)]">
                      Enviado {formatDate(submission.created_at)}
                    </p>
                  </div>
                  {isWinner ? <span className="badge badge-winner">Ganador</span> : null}
                </div>

                <p className="whitespace-pre-wrap text-sm">
                  {submission.description || "Sin descripción."}
                </p>
                <p className="flex flex-wrap gap-3 text-sm">
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

                {canJudge ? (
                  <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-3 sm:flex-row sm:items-end">
                    <form action={setSubmissionScoreAction} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="vibekathon_id" value={eventId} />
                      <input type="hidden" name="submission_id" value={submission.id} />
                      <label className="space-y-1 text-sm">
                        <span className="block font-medium">Puntaje</span>
                        <select
                          className="select w-28"
                          name="score"
                          defaultValue={submission.score ?? ""}
                        >
                          <option value="">Sin puntaje</option>
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button type="submit" className="btn btn-ghost">
                        Guardar puntaje
                      </button>
                    </form>

                    <form action={setWinnerAction}>
                      <input type="hidden" name="vibekathon_id" value={eventId} />
                      <input
                        type="hidden"
                        name="submission_id"
                        value={isWinner ? "" : submission.id}
                      />
                      <button type="submit" className="btn btn-rust">
                        {isWinner ? "Quitar ganador" : "Elegir ganador"}
                      </button>
                    </form>
                  </div>
                ) : null}

                <div className="border-t border-[var(--line)] pt-3">
                  <h3 className="mb-2 text-sm font-semibold">Comentarios</h3>
                  <CommentThread
                    eventId={eventId}
                    submissionId={submission.id}
                    comments={commentsBySubmission[submission.id] ?? []}
                    emptyText="Todavía no hay comentarios en este envío."
                    currentUserId={currentUserId}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
