"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-3">
      <h1 className="font-display text-3xl">Algo salió mal</h1>
      <p className="text-[var(--muted)]">
        Inténtalo de nuevo. Si acaba de faltar la configuración de Supabase,
        revisa tu <code>.env.local</code>.
      </p>
      <button type="button" className="btn btn-primary" onClick={reset}>
        Reintentar
      </button>
    </div>
  );
}
