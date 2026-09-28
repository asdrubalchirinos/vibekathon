import { createVibekathon, deleteVibekathon, updateVibekathon } from "@/lib/actions";
import { LIMITS } from "@/lib/constants";
import { toDatetimeLocal } from "@/lib/helpers";
import type { Vibekathon } from "@/lib/types";
import { ConfirmSubmitButton } from "./ConfirmSubmitButton";
import { ErrorBanner } from "./ErrorBanner";

export function EventForm({
  event,
  error,
}: {
  event?: Vibekathon;
  error?: string;
}) {
  const action = event ? updateVibekathon : createVibekathon;

  return (
    <form action={action} className="card space-y-4">
      {event ? <input type="hidden" name="id" value={event.id} /> : null}
      <ErrorBanner message={error} />

      <label className="block space-y-1">
        <span className="text-sm font-medium">Título</span>
        <input
          className="input"
          name="title"
          required
          maxLength={LIMITS.title}
          defaultValue={event?.title}
          placeholder="Ej. Vibekathon de herramientas para vecinos"
        />
        <span className="text-xs text-[var(--muted)]">Máximo {LIMITS.title} caracteres.</span>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Problema o idea a resolver</span>
        <textarea
          className="textarea"
          name="description"
          maxLength={LIMITS.eventDescription}
          defaultValue={event?.description}
          placeholder="Puedes usar texto plano o markdown. Cuenta el problema, el contexto y qué esperas ver."
        />
        <span className="text-xs text-[var(--muted)]">
          Máximo {LIMITS.eventDescription} caracteres.
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Inicio</span>
          <input
            className="input"
            type="datetime-local"
            name="starts_at"
            required
            defaultValue={event ? toDatetimeLocal(event.starts_at) : undefined}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Fin</span>
          <input
            className="input"
            type="datetime-local"
            name="ends_at"
            required
            defaultValue={event ? toDatetimeLocal(event.ends_at) : undefined}
          />
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Visibilidad</legend>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="radio"
            name="visibility"
            value="public"
            defaultChecked={!event || event.visibility === "public"}
          />
          <span>
            <strong>Público.</strong> Aparece en la portada para que cualquiera
            lo encuentre.
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="radio"
            name="visibility"
            value="private"
            defaultChecked={event?.visibility === "private"}
          />
          <span>
            <strong>Privado.</strong> Solo entra quien tenga el link de
            invitación. No se lista en explorar.
          </span>
        </label>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary">
          {event ? "Guardar cambios" : "Publicar vibekathon"}
        </button>
      </div>
    </form>
  );
}

export function DeleteEventForm({ eventId }: { eventId: string }) {
  return (
    <form action={deleteVibekathon} className="card space-y-2">
      <input type="hidden" name="id" value={eventId} />
      <h2 className="font-display text-xl">Borrar este vibekathon</h2>
      <p className="text-sm text-[var(--muted)]">
        Se borrarán el evento, los envíos y los comentarios. No se puede
        deshacer.
      </p>
      <ConfirmSubmitButton
        className="btn btn-rust"
        message="¿Borrar este vibekathon? Se eliminarán también los envíos y los comentarios."
      >
        Borrar evento
      </ConfirmSubmitButton>
    </form>
  );
}
