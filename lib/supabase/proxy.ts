// Refresca la sesión de Auth en cada request.
// Next.js 16 llama a esto desde proxy.ts (antes se llamaba middleware).

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const env = getSupabaseEnv();
  if (!env) return supabaseResponse;

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // No pongas código entre createServerClient y getUser().
  // getUser() verifica el JWT; getSession() solo lee la cookie.
  await supabase.auth.getUser();

  return supabaseResponse;
}
