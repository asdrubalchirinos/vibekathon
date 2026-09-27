import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { SignInButton } from "./SignInButton";
import { SignOutButton } from "./SignOutButton";

export async function Header() {
  const me = await getCurrentUser();

  return (
    <header className="border-b border-[var(--line)] bg-[var(--card)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="font-display text-xl tracking-tight">
            vibekathon
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
            <Link href="/" className="hover:text-[var(--teal)]">
              Explorar
            </Link>
            <Link href="/que-es" className="hover:text-[var(--teal)]">
              ¿Qué es un vibekathon?
            </Link>
            <Link href="/vibekathons/new" className="hover:text-[var(--teal)]">
              Crear
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {me ? (
            <>
              <span className="flex items-center gap-2 text-sm">
                {me.profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={me.profile.avatar_url}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full"
                  />
                ) : null}
                <span className="font-medium">
                  {me.profile?.github_username || "tú"}
                </span>
              </span>
              <SignOutButton />
            </>
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
    </header>
  );
}
