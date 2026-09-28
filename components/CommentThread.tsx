import { addComment, deleteComment } from "@/lib/actions";
import { LIMITS } from "@/lib/constants";
import { displayName, formatDate } from "@/lib/helpers";
import type { CommentWithAuthor } from "@/lib/types";
import { ConfirmSubmitButton } from "./ConfirmSubmitButton";

export function CommentThread({
  eventId,
  submissionId,
  comments,
  emptyText,
  currentUserId,
}: {
  eventId: string;
  submissionId: string;
  comments: CommentWithAuthor[];
  emptyText: string;
  currentUserId?: string | null;
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
              {currentUserId && comment.author_id === currentUserId ? (
                <form action={deleteComment} className="mt-2">
                  <input type="hidden" name="vibekathon_id" value={eventId} />
                  <input type="hidden" name="comment_id" value={comment.id} />
                  <ConfirmSubmitButton
                    className="bg-transparent p-0 text-xs text-[var(--muted)] underline"
                    message="¿Borrar este comentario?"
                  >
                    Borrar
                  </ConfirmSubmitButton>
                </form>
              ) : null}
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
            maxLength={LIMITS.comment}
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
