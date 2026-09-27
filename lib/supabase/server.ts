// Cliente para Server Components, Server Actions y Route Handlers.
// Cada request crea uno nuevo: necesita las cookies de esa petición.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

export async function createClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error("Faltan las variables de entorno de Supabase.");
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // En un Server Component no se pueden escribir cookies.
          // El proxy.ts se encarga de refrescar la sesión.
        }
      },
    },
  });
}
