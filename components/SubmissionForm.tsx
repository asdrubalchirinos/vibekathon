import { upsertSubmission } from "@/lib/actions";
import { LIMITS } from "@/lib/constants";
import type { Submission } from "@/lib/types";
import { ErrorBanner } from "./ErrorBanner";

export function SubmissionForm({
  eventId,
  submission,
  error,
}: {
  eventId: string;
  submission?: Submission | null;
  error?: string;
}) {
  return (
    <form action={upsertSubmission} className="card space-y-4">
      <input type="hidden" name="vibekathon_id" value={eventId} />
      <ErrorBanner message={error} />

      <label className="block space-y-1">
        <span className="text-sm font-medium">URL del repo público</span>
        <input
          className="input"
          type="url"
          name="repo_url"
          required
          maxLength={LIMITS.repoUrl}
          defaultValue={submission?.repo_url}
          placeholder="https://github.com/tu-usuario/tu-repo"
        />
        <span className="text-xs text-[var(--muted)]">
          Tiene que ser un repositorio público de GitHub
          (https://github.com/usuario/repo).
        </span>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Demo (opcional)</span>
        <input
          className="input"
          type="url"
          name="demo_url"
          maxLength={LIMITS.demoUrl}
          defaultValue={submission?.demo_url ?? ""}
          placeholder="https://tu-demo.vercel.app"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Descripción corta</span>
        <textarea
          className="textarea"
          name="description"
          maxLength={LIMITS.submissionDescription}
          defaultValue={submission?.description}
          placeholder="Qué construiste y cómo se usa."
        />
        <span className="text-xs text-[var(--muted)]">
          Máximo {LIMITS.submissionDescription} caracteres.
        </span>
      </label>

      <button type="submit" className="btn btn-primary">
        {submission ? "Actualizar envío" : "Participar y enviar"}
      </button>
    </form>
  );
}
