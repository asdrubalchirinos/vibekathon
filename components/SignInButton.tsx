"use client";

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useState } from "react";

export function SignInButton({
  next = "/",
  label = "Entrar con GitHub",
  className = "btn btn-primary",
}: {
  next?: string;
  label?: string;
  className?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!isSupabaseConfigured()) {
      setError("Supabase todavía no está configurado.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo },
      });
      if (signInError) setError(signInError.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
      setPending(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" className={className} onClick={handleClick} disabled={pending}>
        {pending ? "Redirigiendo…" : label}
      </button>
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </span>
  );
}
