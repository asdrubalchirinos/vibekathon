import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-3">
      <h1 className="font-display text-3xl">No encontramos esa página</h1>
      <p className="text-[var(--muted)]">
        Puede que el link esté mal, o que sea un vibekathon privado al que
        todavía no te invitaron.
      </p>
      <Link href="/" className="btn btn-primary">
        Volver a explorar
      </Link>
    </div>
  );
}
