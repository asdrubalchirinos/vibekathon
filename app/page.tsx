import Link from "next/link";
import { VibekathonCard } from "@/components/VibekathonCard";
import { listPublicVibekathons } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { EventStatus } from "@/lib/types";

const FILTERS: { key: "all" | EventStatus; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "upcoming", label: "Próximos" },
  { key: "active", label: "En curso" },
  { key: "finished", label: "Finalizados" },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const filter = FILTERS.some((item) => item.key === estado)
    ? (estado as "all" | EventStatus)
    : "all";

  const events = await listPublicVibekathons(filter);

  return (
    <div className="space-y-10">
      <section className="grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-end">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--teal)]">
            Vibe coding + hackatón
          </p>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">
            Convoca un vibekathon. Construye con IA. Elige un ganador.
          </h1>
          <p className="max-w-xl text-lg text-[var(--muted)]">
            Un vibekathon es un llamado a resolver un problema construyendo
            software casi solo conversando con herramientas de IA. Comunidades y
            empresas publican el reto; vibe coders envían un repo público.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/vibekathons/new" className="btn btn-primary">
              Publicar un vibekathon
            </Link>
            <Link href="/que-es" className="btn btn-ghost">
              ¿Qué es un vibekathon?
            </Link>
          </div>
        </div>
        <aside className="card text-sm leading-relaxed text-[var(--muted)]">
          Parte del movimiento{" "}
          <a
            className="font-medium text-[var(--teal-dark)] underline"
            href="https://achirinos.com/es/personal-software/"
            target="_blank"
            rel="noreferrer"
          >
            Personal Software
          </a>
          : devolver el control creativo a las personas que viven el problema,
          no solo a quienes programan de oficio.
        </aside>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-2xl">Vibekathons públicos</h2>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => {
              const href = item.key === "all" ? "/" : `/?estado=${item.key}`;
              const active = filter === item.key;
              return (
                <Link
                  key={item.key}
                  href={href}
                  className={`badge ${active ? "badge-active" : "badge-finished"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {!isSupabaseConfigured() ? (
          <div className="card text-[var(--muted)]">
            Cuando configures Supabase, aquí aparecerán los vibekathons
            públicos. Mientras tanto puedes leer{" "}
            <Link href="/que-es" className="underline">
              qué es un vibekathon
            </Link>
            .
          </div>
        ) : events.length === 0 ? (
          <div className="card space-y-2">
            <p className="font-medium">No hay vibekathons en esta vista.</p>
            <p className="text-sm text-[var(--muted)]">
              Sé el primero en publicar uno, o cambia el filtro.
            </p>
            <Link href="/vibekathons/new" className="btn btn-primary w-fit">
              Crear el primero
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {events.map((event) => (
              <VibekathonCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
