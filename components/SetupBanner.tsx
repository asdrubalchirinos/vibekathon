import { isSupabaseConfigured } from "@/lib/supabase/env";

export function SetupBanner() {
  if (isSupabaseConfigured()) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
      Falta configurar Supabase. Copia <code>.env.example</code> a{" "}
      <code>.env.local</code> y sigue el README para poder iniciar sesión y
      guardar datos.
    </div>
  );
}
