import { createVibekathon, updateVibekathon } from "@/lib/actions";
import { toDatetimeLocal } from "@/lib/helpers";
import type { Vibekathon } from "@/lib/types";
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
          defaultValue={event?.title}
          placeholder="Ej. Vibekathon de herramientas para vecinos"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Problema o idea a resolver</span>
        <textarea
          className="textarea"
          name="description"
          defaultValue={event?.description}
          placeholder="Puedes usar texto plano o markdown. Cuenta el problema, el contexto y qué esperas ver."
        />
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
