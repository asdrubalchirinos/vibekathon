import { addComment } from "@/lib/actions";
import { displayName, formatDate } from "@/lib/helpers";
import type { CommentWithAuthor } from "@/lib/types";

export function CommentThread({
  eventId,
  submissionId,
  comments,
  emptyText,
}: {
  eventId: string;
  submissionId: string;
  comments: CommentWithAuthor[];
  emptyText: string;
}) {
  return (
    <div className="space-y-3">
      {comments.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-xl bg-[#f7f2e8] px-3 py-2">
              <p className="text-xs text-[var(--muted)]">
                <strong className="text-[var(--ink)]">
                  {displayName(comment.author)}
                </strong>
                {" · "}
                {formatDate(comment.created_at)}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form action={addComment} className="space-y-2">
        <input type="hidden" name="vibekathon_id" value={eventId} />
        <input type="hidden" name="submission_id" value={submissionId} />
        <label className="block space-y-1">
          <span className="sr-only">Comentario</span>
          <textarea
            className="textarea min-h-20"
            name="body"
            required
            placeholder="Escribe un comentario…"
          />
        </label>
        <button type="submit" className="btn btn-ghost">
          Enviar comentario
        </button>
      </form>
    </div>
  );
}
