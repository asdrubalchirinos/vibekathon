import type { Metadata } from "next";
import { SignInButton } from "@/components/SignInButton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Entrar",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const destination = next && next.startsWith("/") ? next : "/";
  const me = await getCurrentUser();
  if (me) redirect(destination);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="font-display text-3xl">Entrar con GitHub</h1>
      <p className="text-[var(--muted)]">
        La misma cuenta sirve para organizar un vibekathon y para participar en
        otro. Guardamos tu usuario y avatar de GitHub.
      </p>
      <ErrorBanner
        message={
          error === "auth"
            ? "No se pudo completar el inicio de sesión. Inténtalo de nuevo."
            : error
        }
      />
      <SignInButton next={destination} />
    </div>
  );
}
