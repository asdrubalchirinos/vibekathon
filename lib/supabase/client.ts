// Cliente para componentes que corren en el navegador
// (botón de GitHub, copiar links, etc.).

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

export function createClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error("Faltan las variables de entorno de Supabase.");
  }

  return createBrowserClient(env.url, env.key);
}
